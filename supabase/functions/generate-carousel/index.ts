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
    const { tema, tom, num_slides, cta_tipo, instructions } = await req.json() as {
      tema: string
      tom: string
      num_slides: number
      cta_tipo: string
      instructions?: string
    }

    if (!tema?.trim()) return json({ error: 'tema_required' }, 400)

    // ── Busca profile ─────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('voice_profile, visual_kit, niche, plan, carousels_used_this_month, carousels_limit')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404)

    // ── Verifica limite de carrosséis ─────────────────────────────────
    // Planos profissional e agencia têm geração ilimitada
    const unlimitedPlans = ['profissional', 'agencia']
    if (!unlimitedPlans.includes(profile.plan)) {
      if (profile.carousels_used_this_month >= profile.carousels_limit) {
        return json({ error: 'carousel_limit_reached' }, 403)
      }
    }

    // ── Monta system prompt ───────────────────────────────────────────
    const vp = profile.voice_profile ?? {}
    const palavrasProibidas = vp.palavras_proibidas?.join(', ') ?? 'nenhuma'
    const palavrasChave = vp.palavras_chave?.join(', ') ?? ''
    const exemploTexto = vp.exemplo_texto ?? ''

    const systemPrompt = `Você é um especialista em carrosseis virais para Instagram no mercado brasileiro.

REGRAS DE COPY:
- Título (máx 8 palavras): deve ser uma DECLARAÇÃO PROVOCADORA ou PARADOXO que gera curiosidade imediata. Nunca começa com "como", "dicas" ou "aprenda". Usa linguagem direta, sem rodeios.
- Corpo (máx 4 linhas, ~80 palavras): storytelling ou dado concreto que PROVA o título. Uma frase por linha. Última frase sempre muda a perspectiva ou entrega o insight.
- Tom: meio culto, meio direto — como alguém que entende do assunto e não tem paciência pra enrolar.
- Estrutura narrativa obrigatória: slide 1 = gancho polêmico, slides 2-N = provas/desenvolvimento, último slide = CTA ou síntese provocadora.
- NUNCA use: "portanto", "ademais", "vale destacar", "no mundo atual", "nos dias de hoje".
- SEMPRE use: frases curtas, números concretos quando possível, verbos de ação.
- Escreve em letras minúsculas no corpo (não no título). ZERO ponto de exclamação. ZERO travessão. ZERO coaching language.

TOM: ${tom}
NICHO: ${profile.niche ?? 'empreendedorismo'}
PALAVRAS PROIBIDAS: ${palavrasProibidas}
PALAVRAS QUE O DEFINEM: ${palavrasChave}
ESTILO DE REFERÊNCIA: ${exemploTexto}

Responda APENAS com o JSON solicitado, sem texto adicional.`

    const userPrompt = `Tema: ${tema}
CTA desejado: ${cta_tipo}
Número de slides: ${num_slides}${instructions ? `\n\nINSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${instructions}` : ''}

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
    const kit = (profile.visual_kit ?? {}) as Record<string, string>
    const kitCor   = kit.cor   ?? '#C8FF00'
    const kitFonte = kit.fonte ?? '"Bebas Neue", sans-serif'
    const isClaro  = kit.estilo === 'claro'

    const slideRows = parsed.slides.map((s) => ({
      carousel_id:          carousel.id,
      position:             s.position,
      titulo:               s.titulo,
      corpo:                s.corpo,
      bg_image_url:         null,
      font_family:          kitFonte,
      accent_color:         kitCor,
      text_color:           isClaro ? '#111111' : '#F5F5F5',
      body_color:           isClaro ? '#222222' : '#F5F5F5',
      overlay_opacity:      isClaro ? 30 : 50,
      title_uppercase:      true,
      font_size_title:      80,
      font_size_body:       28,
      title_line_height:    1.1,
      title_letter_spacing: 2,
      text_position:        'bottom',
      padding_x:            20,
      block_spacing:        16,
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

    // ── Incrementa contador de carrosséis ─────────────────────────────
    await supabase
      .from('profiles')
      .update({ carousels_used_this_month: profile.carousels_used_this_month + 1 })
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
