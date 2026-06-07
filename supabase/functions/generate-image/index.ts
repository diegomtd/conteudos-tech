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

// Vocabulário de direção de arte/fotografia profissional — adjetivos genéricos
// como "dark moody" produziam imagens de banco de imagens. Termos técnicos
// específicos (lente, luz, textura, referência de estilo) guiam o modelo
// pra resultados com cara de capa de carrossel viral, não de stock photo.
const STYLE_MODIFIERS: Record<string, string> = {
  cinematic:    'cinematic photography, anamorphic lens flare, deep directional shadows, fine film grain, Kodak Portra color science',
  illustration: 'modern editorial illustration, bold flat color blocking, geometric shapes, high-contrast vector art, trending Behance aesthetic',
  abstract:     'abstract fluid art, organic gradient blends, soft bokeh light leaks, painterly texture, generative-art aesthetic',
  minimal:      'minimalist studio photography, single-source soft light, clean geometric subject, generous negative space',
  gradient:     'smooth gradient mesh, holographic sheen, glassmorphism texture, premium tech-brand aesthetic',
}

const NO_TEXT_PREFIX = 'Abstract cinematic background only. NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO TYPOGRAPHY, NO WATERMARKS anywhere in the image. Pure visual atmosphere. '
const NO_TEXT_SUFFIX = ', wide cinematic atmospheric background, ultra detailed, professional color grading, no text, no people, no faces, no writing, no words, no labels, no logos visible anywhere'

// Técnica nº1 que separa carrossel amador de profissional: deixar uma área
// limpa (negative space) onde o texto vai ser sobreposto depois. Capa precisa
// parar o scroll (alto impacto); slides internos precisam "sustentar" o texto
// sem competir com ele.
const COVER_COMPOSITION = 'bold scroll-stopping composition for a social media cover: striking focal subject placed off-center using rule-of-thirds, large clean negative-space area in the upper half reserved for a bold headline overlay, high visual impact, magazine-cover energy'
const SLIDE_COMPOSITION = 'calm supportive composition for a content slide: subject pushed toward one edge of the frame, large clean low-detail negative-space area across the center reserved for body-text overlay, minimal visual noise so overlaid text stays legible'

// Lê o tom emocional do conteúdo (PT-BR) pra dar direção de luz/cor coerente
// com a mensagem do slide, em vez de aplicar sempre o mesmo clima genérico.
function inferMood(text: string): string {
  const t = text.toLowerCase()
  if (/\berro|medo|perigo|risco|problema|fracass|perd[ae]|\bdor\b|trava|armadilha|cuidado/.test(t))
    return 'tense, cautionary mood, cool desaturated shadows, a sense of unease'
  if (/resultado|sucesso|crescimento|conquist|transform|vit[óo]ria|lucro|escala|liberdade/.test(t))
    return 'aspirational, triumphant mood, warm golden rim light, a sense of forward momentum'
  if (/segredo|verdade|revela[çc]|descobert|ningu[ée]m.*conta|por tr[áa]s/.test(t))
    return 'mysterious, intriguing mood, a single dramatic light source carving the subject out of darkness'
  return 'focused, confident mood, balanced high-contrast lighting'
}

function buildPrompt(tema: string, style: string): string {
  const modifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['cinematic']
  return `${NO_TEXT_PREFIX}Visual metaphor representing the theme "${tema}". ${SLIDE_COMPOSITION}, ${modifier}${NO_TEXT_SUFFIX}`
}

function buildContextualPrompt(titulo: string, corpo: string, style: string, isFirstSlide: boolean): string {
  const modifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['cinematic']
  const mood = inferMood(`${titulo} ${corpo ?? ''}`)
  const composition = isFirstSlide ? COVER_COMPOSITION : SLIDE_COMPOSITION
  const subject = corpo
    ? `Visual metaphor for the idea: "${titulo}" — ${corpo.substring(0, 140)}`
    : `Visual metaphor for the idea: "${titulo}"`
  return `${NO_TEXT_PREFIX}${subject}. Composition: ${composition}. Mood: ${mood}, ${modifier}${NO_TEXT_SUFFIX}`
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
    const { carousel_id, style, slide_id, titulo, corpo, is_first_slide } = await req.json() as {
      carousel_id: string
      style: string
      slide_id?: string
      titulo?: string
      corpo?: string
      is_first_slide?: boolean
    }

    if (!carousel_id) return json({ error: 'missing_fields' }, 400)

    // ── Verifica saldo de imagens IA ──────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_images_used_this_month, ai_images_limit')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404)

    if (profile.ai_images_used_this_month >= profile.ai_images_limit) {
      return json({ error: 'ai_images_limit_reached' }, 403)
    }

    // ── Monta prompt ──────────────────────────────────────────────────
    const styleKey = (style ?? 'cinematic').toLowerCase()
    let fullPrompt: string

    if (slide_id) {
      // Busca conteúdo real do slide no banco para garantir dados atualizados
      const { data: slideData } = await supabase
        .from('carousel_slides')
        .select('titulo, corpo')
        .eq('id', slide_id)
        .single()

      const finalTitulo = slideData?.titulo ?? titulo ?? ''
      const finalCorpo = slideData?.corpo ?? corpo ?? ''

      fullPrompt = finalTitulo
        ? buildContextualPrompt(finalTitulo, finalCorpo, styleKey, !!is_first_slide)
        : buildPrompt(finalTitulo, styleKey)
    } else {
      // Prompt genérico baseado no tema do carrossel
      const { data: carousel, error: carouselError } = await supabase
        .from('carousels')
        .select('tema')
        .eq('id', carousel_id)
        .single()

      if (carouselError || !carousel) return json({ error: 'carousel_not_found' }, 404)
      fullPrompt = buildPrompt(carousel.tema, styleKey)
    }

    console.log('[generate-image] slide_id:', slide_id ?? 'all', 'prompt:', fullPrompt)

    // ── Chama fal.ai ──────────────────────────────────────────────────
    const falKey = Deno.env.get('FAL_KEY') ?? ''
    console.log('[init] FAL_KEY length:', falKey.length)

    const falRes = await fetch('https://fal.run/fal-ai/flux-2-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: { width: 1080, height: 1350 },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!falRes.ok) {
      const errText = await falRes.text()
      console.error('[fal] erro HTTP', falRes.status, ':', errText)
      return json({ error: 'fal_error', status: falRes.status, detail: errText }, 502)
    }

    const falData = await falRes.json()
    const imageUrl = falData.images?.[0]?.url

    if (!imageUrl) {
      console.error('[fal] sem URL na resposta:', JSON.stringify(falData).substring(0, 300))
      return json({ error: 'no_image_returned', detail: falData }, 502)
    }

    console.log('[fal] imagem gerada:', imageUrl)

    if (slide_id) {
      // ── Atualiza apenas o slide específico ────────────────────────
      const { error: updateError } = await supabase
        .from('carousel_slides')
        .update({ bg_image_url: imageUrl })
        .eq('id', slide_id)

      if (updateError) {
        console.error('[db] update error:', updateError)
        return json({ error: 'db_update_error', detail: updateError.message }, 500)
      }
    } else {
      // ── Aplica a mesma URL em todos os slides do carrossel ────────
      const { error: updateError } = await supabase
        .from('carousel_slides')
        .update({ bg_image_url: imageUrl })
        .eq('carousel_id', carousel_id)

      if (updateError) {
        console.error('[db] update error:', updateError)
        return json({ error: 'db_update_error', detail: updateError.message }, 500)
      }
    }

    // ── Incrementa contador + loga custo ─────────────────────────────
    await supabase.rpc('increment_counter', {
      p_user_id: userId,
      p_field: 'ai_images_used_this_month',
    })

    await supabase.from('usage_logs').insert({
      user_id:     userId,
      action:      'generate_image',
      tokens_used: 0,
      cost_brl:    0.28,  // fal.ai flux-2-pro ≈ $0.05 USD × câmbio 5.6
    })

    return json({ success: true, bg_image_url: imageUrl })

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
