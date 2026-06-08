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

// ─── Estilo por tipo de imagem ────────────────────────────────────────────────
// Termos técnicos de fotografia e direção de arte guiam o Flux melhor que
// adjetivos genéricos. Cada estilo define lente, luz, textura e referência.
const STYLE_MODIFIERS: Record<string, string> = {
  cinematic:    'shot on ARRI Alexa, 35mm anamorphic lens, deep directional key light, fine analog film grain, rich shadow detail, Kodak Vision3 color science, professional color grade',
  illustration: 'bold editorial illustration, high-contrast graphic design, geometric shapes, flat vector art with depth, Behance trending style 2025',
  abstract:     'abstract cinematic background, organic fluid shapes, soft light leaks, painterly bokeh texture, premium generative-art aesthetic',
  minimal:      'minimalist studio shot, single soft-box key light, clean subject, generous negative space, sharp focus, neutral tones',
  gradient:     'premium gradient background, subtle holographic sheen, glassmorphism depth, tech-brand aesthetic, smooth color transitions',
}

// ─── Bloqueio de texto na imagem ─────────────────────────────────────────────
const NO_TEXT = 'NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO TYPOGRAPHY, NO WATERMARKS, NO CAPTIONS anywhere in the image.'

// ─── Composição por tipo de slide ────────────────────────────────────────────
// Capa: impacto visual máximo, espaço limpo no topo para o título sobreposto.
// Slides internos: suportam o texto sem competir, espaço limpo no centro.
const COVER_COMP  = 'scroll-stopping cover composition: bold dramatic focal subject at bottom-right using rule-of-thirds, large clean dark negative space in the upper-left third reserved for headline text overlay, strong visual impact, magazine-cover energy'
const SLIDE_COMP  = 'editorial content-slide composition: main subject pushed to one edge of frame, wide clean low-contrast negative space across the center reserved for body text overlay, minimal visual clutter so overlaid text stays fully legible, moody atmospheric background'

// ─── Infere mood pelo conteúdo em PT-BR ──────────────────────────────────────
function inferMood(text: string): string {
  const t = text.toLowerCase()
  if (/\berro|medo|perigo|risco|problema|fracass|perd[ae]|\bdor\b|trava|armadilha|cuidado|alerta|mentira|ilusão/.test(t))
    return 'tense cautionary atmosphere, cool desaturated blue-grey shadows, dramatic underlighting, sense of unease and urgency'
  if (/resultado|sucesso|crescimento|conquist|transform|vit[óo]ria|lucro|escala|liberdade|poder|lider|autoridade/.test(t))
    return 'aspirational triumphant atmosphere, warm golden-amber rim light, strong forward momentum, premium cinematic feel'
  if (/segredo|verdade|revela[çc]|descobert|ningu[ée]m|por tr[áa]s|invisível|oculto|esquema|sistema|controle/.test(t))
    return 'mysterious intriguing atmosphere, single dramatic spotlight carving subject from deep darkness, noir tension'
  if (/dinheiro|venda|negócio|empresa|mercado|produto|cliente|receita|faturamento|contrato/.test(t))
    return 'sharp professional atmosphere, clean directional studio light, confident premium business aesthetic'
  if (/rede social|instagram|conteúdo|algoritmo|post|feed|criador|audiência|engajamento|viral/.test(t))
    return 'modern digital creative atmosphere, cool blue-teal accent light, dynamic tech energy, content-creator aesthetic'
  return 'focused confident atmosphere, balanced high-contrast dramatic lighting, cinematic depth'
}

// ─── Traduz nicho para vocabulário visual ────────────────────────────────────
function nichoToVisualContext(nicho: string): string {
  const n = (nicho ?? '').toLowerCase()
  if (/marketing|conteúdo|criador|social|instagram/.test(n))
    return 'social media creative environment, smartphone screens with glowing light, modern workspace, digital content creation'
  if (/negócio|empreend|empresa|vendas|mercado/.test(n))
    return 'premium business environment, modern city architecture, executive office, corporate energy'
  if (/finanças|invest|dinheiro|renda/.test(n))
    return 'financial growth metaphor, abstract currency flows, clean data visualization, wealth and precision'
  if (/saúde|nutri|fitness|bem.estar/.test(n))
    return 'health and vitality environment, natural light, organic textures, clean lifestyle aesthetic'
  if (/educação|curso|mentor|coach/.test(n))
    return 'knowledge and learning environment, books, light breaking through, pathway forward, intellectual energy'
  if (/tecnologia|ia|software|digital/.test(n))
    return 'cutting-edge technology environment, glowing circuits, neural network visuals, sci-fi realism'
  return 'modern professional environment, dramatic architecture, high-contrast urban setting'
}

// ─── Gera a cena concreta a partir do conteúdo do slide ──────────────────────
// Em vez de "visual metaphor for X", descreve uma cena fotográfica específica
// que o Flux consegue renderizar de forma realista e cinematográfica.
function buildSceneFromContent(titulo: string, corpo: string, nicho: string, isFirstSlide: boolean): string {
  const combinedText = `${titulo} ${corpo ?? ''}`.trim()
  const t = combinedText.toLowerCase()

  // Capa: cena de alto impacto que representa o tema principal
  if (isFirstSlide) {
    if (/instagram|carrossel|feed|post|conteúdo|criador|redes sociais/.test(t))
      return 'a lone creative professional standing at the edge of a rooftop at golden hour, phone in hand, city lights blurring below, dramatic warm rim lighting outlining the silhouette against a deep dark sky, cinematic'
    if (/dinheiro|lucro|faturamento|receita|rico|riqueza|ganhar|fatura/.test(t))
      return 'stacks of hundred-dollar bills fanning out on a dark marble surface, single overhead spotlight creating dramatic shadows, macro texture detail, deep black background, premium cinematic'
    if (/erro|fracasso|problema|armadilha|mentira|cuidado|alerta|perigo/.test(t))
      return 'a cracked glass surface with cold blue light refracting through the fractures, dark moody atmosphere, sense of something breaking apart in slow motion, dramatic underlighting'
    if (/segredo|sistema|controle|algoritmo|por tr[áa]s|invisível|oculto/.test(t))
      return 'a aerial view of a geometric maze at night, one small figure at the center illuminated by a single shaft of warm light, all others in dark corridors, cinematic drone perspective'
    if (/sucesso|crescimento|conquista|escala|vit[óo]ria|lider|autoridade/.test(t))
      return 'a lone figure at the summit of a mountain at dawn, arms slightly open, warm golden light breaking over the horizon, deep atmospheric mist in the valleys below, epic scale and achievement'
    if (/tempo|hora|rotina|produtividade|eficiência|trabalha|trabalho|grátis|desperdiç|automat|manual/.test(t))
      return 'extreme close-up macro of a luxury analog watch face, gears and mechanisms partially exposed, dramatic single side light with deep shadows, time as a tangible precious object, dark background'
    if (/venda|cliente|negócio|empresa|mercado|produto|contrato|fechar/.test(t))
      return 'a handshake moment captured in dramatic close-up, warm directional light illuminating only the hands, dark premium background, sense of power and finality, cinematic depth of field'
    if (/aprender|conhecimento|curso|habilidade|skill|estud/.test(t))
      return 'a single open book on a dark surface, a beam of golden light falling on it from above, dust particles visible in the light ray, knowledge as something sacred and rare'
    if (/saúde|corpo|mente|bem.estar|energia|dormir|descanso/.test(t))
      return 'abstract organic light waves flowing through a dark space, bioluminescent energy patterns, calm powerful atmosphere, sense of internal vitality and strength'
    if (/medo|bloqueio|trava|dúvida|ansiedade|paralisa/.test(t))
      return 'a single figure standing at the edge of a diving board over a pool far below, dramatic underlighting, high altitude perspective, moment of decision frozen in time'
    // fallback forte — usa o título real como referência descritiva
    return `dramatic cinematic cover image evoking the concept "${titulo.substring(0, 70)}", powerful focal subject with strong directional light, deep dark background, magazine-cover energy, no text`
  }

  // Slides internos: cena que sustenta o conteúdo específico
  if (/dinheiro|lucro|faturamento|venda|negócio/.test(t))
    return 'abstract close-up of premium financial symbols, dark rich background, single directional warm light, depth of field blur creating clean space for text overlay'
  if (/rede social|algoritmo|engajamento|viral|alcance/.test(t))
    return 'glowing smartphone screen emitting light in a dark room, social media interface visible as light source, modern minimalist composition, clean dark background for text'
  if (/pessoas|time|equipe|cliente|comunidade/.test(t))
    return 'silhouettes of people against a warm backlit window, soft natural light diffusion, peaceful collaborative atmosphere, large clean bright area for text overlay'
  if (/dados|número|resultado|métrica|análise/.test(t))
    return 'abstract data visualization with glowing lines on dark background, clean geometric precision, teal accent light, premium tech aesthetic with open space for text'
  if (/tempo|rotina|hábito|consistência|diário/.test(t))
    return 'morning desk with soft window light, coffee steam rising, open notebook, calm productive atmosphere, clean neutral tones with generous empty space'
  if (/crescimento|evolução|progresso|escala/.test(t))
    return 'abstract upward trajectory, light trail ascending through dark atmosphere, sense of movement and momentum, large dark area for text overlay'
  if (/medo|bloqueio|trava|dúvida|ansiedade/.test(t))
    return 'a single empty chair under a spotlight in a vast dark empty room, isolating atmosphere, cool blue-grey tones, sense of stillness and unease'

  // fallback contextual pelo nicho
  const nichoCtx = nichoToVisualContext(nicho)
  return `${nichoCtx}, cinematic atmospheric background, dramatic professional lighting, wide negative space area for text overlay`
}

// ─── Monta prompt completo ────────────────────────────────────────────────────
function buildContextualPrompt(
  titulo: string,
  corpo: string,
  style: string,
  isFirstSlide: boolean,
  nicho: string,
  tema: string,
): string {
  const modifier  = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['cinematic']
  const mood      = inferMood(`${titulo} ${corpo ?? ''} ${tema ?? ''}`)
  const comp      = isFirstSlide ? COVER_COMP : SLIDE_COMP
  const scene     = buildSceneFromContent(titulo, corpo, nicho, isFirstSlide)

  return [
    NO_TEXT,
    `Scene: ${scene}.`,
    `Composition: ${comp}.`,
    `Mood and lighting: ${mood}.`,
    `Render style: ${modifier}.`,
    'Ultra high resolution, professional color grading, no text, no letters, no numbers, no watermarks, no people\'s faces visible.',
  ].join(' ')
}

// ─── Prompt genérico quando não há slide específico ──────────────────────────
function buildGenericPrompt(tema: string, style: string, nicho: string): string {
  const modifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['cinematic']
  const mood     = inferMood(tema)
  const nichoCtx = nichoToVisualContext(nicho)
  return [
    NO_TEXT,
    `Scene: ${nichoCtx}, evocating the theme "${tema.substring(0, 80)}".`,
    `Composition: ${SLIDE_COMP}.`,
    `Mood: ${mood}.`,
    `Render style: ${modifier}.`,
    'Ultra high resolution, professional color grading, no text, no letters, no watermarks.',
  ].join(' ')
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

    // ── Busca tema do carrossel + nicho do usuário (contexto para o prompt) ──
    const [carouselRes, profileNichoRes] = await Promise.all([
      supabase.from('carousels').select('tema').eq('id', carousel_id).single(),
      supabase.from('profiles').select('niche').eq('user_id', userId).single(),
    ])
    const carouselTema = carouselRes.data?.tema ?? ''
    const userNicho    = profileNichoRes.data?.niche ?? 'empreendedorismo'

    // ── Monta prompt ──────────────────────────────────────────────────
    const styleKey = (style ?? 'cinematic').toLowerCase()
    let fullPrompt: string

    if (slide_id) {
      // Busca conteúdo real do slide no banco
      const { data: slideData } = await supabase
        .from('carousel_slides')
        .select('titulo, corpo')
        .eq('id', slide_id)
        .single()

      const finalTitulo = slideData?.titulo ?? titulo ?? ''
      const finalCorpo  = slideData?.corpo  ?? corpo  ?? ''

      fullPrompt = buildContextualPrompt(finalTitulo, finalCorpo, styleKey, !!is_first_slide, userNicho, carouselTema)
    } else {
      // Sem slide específico: prompt genérico contextualizado pelo nicho
      if (carouselRes.error || !carouselRes.data) return json({ error: 'carousel_not_found' }, 404)
      fullPrompt = buildGenericPrompt(carouselTema, styleKey, userNicho)
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
        num_inference_steps: is_first_slide ? 35 : 30,  // capa recebe mais passos
        guidance_scale: 4.5,   // mais aderência ao prompt descritivo
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
