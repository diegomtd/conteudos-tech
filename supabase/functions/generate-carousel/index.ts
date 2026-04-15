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
    if (!authHeader) return json({ error: 'missing_authorization' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'invalid_token' }, 401)

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
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404)

    // ── Monta system prompt ───────────────────────────────────────────
    const vp = profile.voice_profile ?? {}
    const palavrasProibidas = vp.palavras_proibidas?.join(', ') ?? 'nenhuma'
    const palavrasChave = vp.palavras_chave?.join(', ') ?? ''
    const exemploTexto = vp.exemplo_texto ?? ''

    const systemPrompt = `Você é um especialista em conteúdo viral para Instagram Brasil 2026.
Crie um carrossel sobre o tema fornecido.

TOM DO CRIADOR: ${tom}
PALAVRAS QUE NUNCA USA: ${palavrasProibidas}
PALAVRAS QUE O DEFINEM: ${palavrasChave}
EXEMPLO DO ESTILO DELE: ${exemploTexto}

REGRAS ABSOLUTAS — sem exceção:
- ZERO travessão em qualquer campo (use vírgula ou reescreva)
- ZERO ponto de exclamação
- ZERO conectivos de IA: portanto, ademais, vale destacar, sendo assim
- Tom direto, observacional, humano
- Cada slide = UMA ideia
- Frases variam em tamanho (natural, não uniforme)
- Títulos em MAIÚSCULAS, curtos e impactantes`

    const userPrompt = `Tema: ${tema}
CTA desejado: ${cta_tipo}
Número de slides: ${num_slides}

Retorne APENAS um JSON válido, sem markdown, sem explicação, sem código fence:
{
  "slides": [
    {
      "position": 1,
      "titulo": "...",
      "corpo": "...",
      "hack_aplicado": "Pattern Interrupt | Curiosity Gap | Identity Mirror | Zeigarnik Effect | Social Proof"
    }
  ],
  "legenda": {
    "gancho": "...",
    "corpo": "...",
    "cta": "..."
  }
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
    let parsed: { slides: Array<{ position: number; titulo: string; corpo: string; hack_aplicado: string }>; legenda: { gancho: string; corpo: string; cta: string } }
    try {
      // Remove possíveis code fences caso o modelo inclua
      const clean = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse error. Raw:', rawContent)
      return json({ error: 'invalid_claude_response', raw: rawContent }, 502)
    }

    // ── Custo estimado (Sonnet: $3/1M input, $15/1M output) ──────────
    const inputTokens = claudeData.usage?.input_tokens ?? 0
    const outputTokens = claudeData.usage?.output_tokens ?? 0
    const costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000
    const costBrl = costUsd * 5.8  // câmbio aproximado

    const hasWatermark = profile.plan === 'free'

    // ── Salva carrossel ───────────────────────────────────────────────
    const legendaText = [parsed.legenda.gancho, parsed.legenda.corpo, parsed.legenda.cta]
      .filter(Boolean)
      .join('\n\n')

    const { data: carousel, error: carouselError } = await supabase
      .from('carousels')
      .insert({
        user_id: user.id,
        tema,
        tom,
        num_slides: parsed.slides.length,
        slides_json: parsed.slides,
        legenda: legendaText,
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
      hack_aplicado: s.hack_aplicado,
    }))

    const { error: slidesError } = await supabase
      .from('carousel_slides')
      .insert(slideRows)

    if (slidesError) console.error('Slides insert error:', slidesError)

    // ── Log de uso ────────────────────────────────────────────────────
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'generate_carousel',
      tokens_used: tokensUsed,
      cost_brl: costBrl,
    })

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
