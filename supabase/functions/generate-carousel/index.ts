import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    const userId = payload.sub

    if (!userId) return json({ error: 'unauthorized' }, 401)

    // ── Parse body ────────────────────────────────────────────────────
    const { tema, tom, num_slides, cta_tipo } = await req.json() as {
      tema: string
      tom: string
      num_slides: number
      cta_tipo: string
    }

    if (!tema?.trim()) return json({ error: 'tema_required' }, 400)

    // ── Busca profile ─────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('voice_profile, visual_kit, niche, plan, exports_used_this_month, exports_limit')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404)

    // ── Verifica limite de exportações ────────────────────────────────
    // Planos profissional e agencia têm exportações ilimitadas
    const unlimitedPlans = ['profissional', 'agencia']
    if (!unlimitedPlans.includes(profile.plan)) {
      if (profile.exports_used_this_month >= profile.exports_limit) {
        return json({ error: 'export_limit_reached' }, 403)
      }
    }

    // ── Monta system prompt ───────────────────────────────────────────
    const vp = profile.voice_profile ?? {}
    const palavrasProibidas = vp.palavras_proibidas?.join(', ') ?? 'nenhuma'
    const palavrasChave = vp.palavras_chave?.join(', ') ?? ''
    const exemploTexto = vp.exemplo_texto ?? ''

    const systemPrompt = `Você é um especialista em carrosseis virais para Instagram que dominam o algoritmo de retenção. Crie carrosseis que parecem escritos por um humano que entende profundamente o tema — não por IA.

ESTRUTURA NARRATIVA OBRIGATÓRIA:
- Slide 1 (CAPA): Apenas um hook de impacto. Máximo 5 palavras. Deve criar uma lacuna mental que só fecha lendo o resto. Sem corpo, sem explicação. Exemplos de padrão: "Você está perdendo dinheiro agora", "Ninguém te conta isso", "Isso vai mudar tudo". titulo apenas, corpo vazio.
- Slides 2 a N-1: Cada slide aprofunda o anterior e cria tensão para o próximo. O último parágrafo de cada slide deve terminar com uma ideia incompleta ou uma pergunta implícita que força o próximo swipe. Copy humana: frases curtas, dados concretos quando relevante, sem jargão de coach.
- Último slide (DESFECHO + CTA): Fecha a narrativa com uma conclusão poderosa. Depois o CTA baseado no tipo solicitado: Engajamento = pergunta pessoal; Seguir = "Segue pra não perder o próximo"; Salvar = "Salva isso antes que precise"; DM = "Me manda uma mensagem"; Link na bio = "Link na bio pra ir fundo nisso".

REGRAS DE VOZ:
- Escreve como alguém falando com um amigo que precisa saber disso agora
- Dados e especificidades criam credibilidade ("73% dos compradores", "em menos de 3 segundos", "desde 2022")
- Cada slide tem UMA ideia central — nunca duas
- Transições naturais: o fim de um slide planta a semente do próximo
- ZERO frases genéricas como "é importante ressaltar", "vale destacar", "sendo assim"
- ZERO travessão em qualquer campo
- ZERO ponto de exclamação
- ZERO conectivos de IA: portanto, ademais, sendo assim

TOM DO CRIADOR: ${tom}
PALAVRAS QUE NUNCA USA: ${palavrasProibidas}
PALAVRAS QUE O DEFINEM: ${palavrasChave}
EXEMPLO DO ESTILO DELE: ${exemploTexto}`

    const userPrompt = `Tema: ${tema}
CTA desejado: ${cta_tipo}
Número de slides: ${num_slides}

Retorne APENAS um JSON válido, sem markdown, sem explicação, sem código fence:
{
  "slides": [
    {"position": 1, "titulo": "...", "corpo": ""},
    {"position": 2, "titulo": "...", "corpo": "..."},
    {"position": N, "titulo": "...", "corpo": "... [CTA]"}
  ],
  "legenda": "legenda completa para o post com hook + desenvolvimento + CTA + hashtags relevantes"
}`

    // ── Chama Claude API ──────────────────────────────────────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      console.error('Claude API error:', err)
      return json({ error: 'claude_api_error', detail: err }, 502)
    }

    const claudeData = await claudeRes.json()
    const rawContent = claudeData.content?.[0]?.text ?? ''
    const tokensUsed = (claudeData.usage?.input_tokens ?? 0) + (claudeData.usage?.output_tokens ?? 0)

    // ── Parse JSON retornado ──────────────────────────────────────────
    let parsed: { slides: Array<{ position: number; titulo: string; corpo: string }>; legenda: string }
    try {
      const clean = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse error. Raw:', rawContent)
      return json({ error: 'invalid_claude_response', raw: rawContent }, 502)
    }

    // ── Custo estimado ────────────────────────────────────────────────
    const inputTokens = claudeData.usage?.input_tokens ?? 0
    const outputTokens = claudeData.usage?.output_tokens ?? 0
    const costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000
    const costBrl = costUsd * 5.8

    const hasWatermark = profile.plan === 'free'

    // ── Salva carrossel ───────────────────────────────────────────────
    const { data: carousel, error: carouselError } = await supabase
      .from('carousels')
      .insert({
        user_id: userId,
        tema,
        tom,
        num_slides: parsed.slides.length,
        slides_json: parsed.slides,
        legenda: parsed.legenda,
        has_watermark: hasWatermark,
        status: 'draft',
      })
      .select('id, preview_token')
      .single()

    if (carouselError || !carousel) {
      console.error('Carousel insert error:', carouselError)
      return json({ error: 'db_insert_error' }, 500)
    }

    // ── Salva slides individuais ──────────────────────────────────────
    const slideRows = parsed.slides.map((s) => ({
      carousel_id: carousel.id,
      position: s.position,
      titulo: s.titulo,
      corpo: s.corpo,
      bg_image_url: '',
    }))

    const { error: slidesError } = await supabase
      .from('carousel_slides')
      .insert(slideRows)

    if (slidesError) console.error('Slides insert error:', slidesError)

    // ── Log de uso ────────────────────────────────────────────────────
    await supabase.from('usage_logs').insert({
      user_id: userId,
      action: 'generate_carousel',
      tokens_used: tokensUsed,
      cost_brl: costBrl,
    })

    // ── Incrementa contador de exportações ────────────────────────────
    await supabase
      .from('profiles')
      .update({ exports_used_this_month: profile.exports_used_this_month + 1 })
      .eq('user_id', userId)

    return json({
      carousel_id: carousel.id,
      preview_token: carousel.preview_token,
      slides: parsed.slides,
      legenda: parsed.legenda,
      has_watermark: hasWatermark,
    })

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
