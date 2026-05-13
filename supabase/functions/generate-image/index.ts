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

const STYLE_MODIFIERS: Record<string, string> = {
  cinematic:    'cinematic photography, dramatic lighting, dark moody atmosphere, film noir aesthetic',
  illustration: 'graphic design illustration, bold shapes, editorial style, dark background',
  abstract:     'abstract art, flowing shapes, deep blue tones, artistic',
  minimal:      'minimalist photography, dark tones, clean composition',
  gradient:     'smooth dark gradient, luxury texture, premium aesthetic',
}

const NO_TEXT_PREFIX = 'Abstract cinematic background only. NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO TYPOGRAPHY anywhere in the image. Pure visual atmosphere. '
const NO_TEXT_SUFFIX = ', wide cinematic atmospheric background, ultra detailed, no text, no people, no writing, no words, no labels visible anywhere'

function buildPrompt(tema: string, style: string): string {
  const modifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['cinematic']
  return `${NO_TEXT_PREFIX}${tema}, ${modifier}${NO_TEXT_SUFFIX}`
}

function buildContextualPrompt(titulo: string, corpo: string, style: string): string {
  const modifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['cinematic']
  return `${NO_TEXT_PREFIX}Visual representation of: "${titulo}". Context: ${corpo}. ${modifier}${NO_TEXT_SUFFIX}`
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
    const { carousel_id, style, slide_id, titulo, corpo } = await req.json() as {
      carousel_id: string
      style: string
      slide_id?: string
      titulo?: string
      corpo?: string
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

      const slideContext = slideData
        ? `Slide de Instagram. Título: "${slideData.titulo}".${slideData.corpo ? ` Contexto: "${slideData.corpo.substring(0, 120)}"` : ''}`
        : (titulo ? `Slide de Instagram. Título: "${titulo}".${corpo ? ` Contexto: "${corpo.substring(0, 120)}"` : ''}` : '')

      const modifier = STYLE_MODIFIERS[styleKey] ?? STYLE_MODIFIERS['cinematic']
      fullPrompt = slideContext
        ? `Fotografia cinematográfica para ${slideContext} Estilo: dark moody, contraste alto, iluminação dramática. Sem texto, sem pessoas, sem rostos. Composição: regra dos terços, profundidade de campo. ${modifier}${NO_TEXT_SUFFIX}`
        : buildPrompt(titulo ?? '', styleKey)
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

      // ── Incrementa contador de imagens IA ────────────────────────
      await supabase
        .from('profiles')
        .update({ ai_images_used_this_month: profile.ai_images_used_this_month + 1 })
        .eq('user_id', userId)
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

      // ── Incrementa contador de imagens IA ────────────────────────
      await supabase
        .from('profiles')
        .update({ ai_images_used_this_month: profile.ai_images_used_this_month + 1 })
        .eq('user_id', userId)
    }

    return json({ success: true, bg_image_url: imageUrl })

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
