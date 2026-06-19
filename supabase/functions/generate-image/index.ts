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
const NO_TEXT = 'NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO TYPOGRAPHY, NO WATERMARKS, NO CAPTIONS, NO UI ELEMENTS anywhere in the image.'
const NEGATIVE_PROMPT = 'text, words, letters, numbers, typography, watermarks, captions, subtitles, labels, signs, writing, fonts, interface, UI elements, buttons, menus, overlaid graphics, screen content, instagram interface, social media UI'

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
    return 'modern creative workspace with dramatic ambient blue-teal light, abstract glowing bokeh in background, dark minimal setting, no visible screens or interfaces'
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
      return 'photorealistic shot of a young confident creative professional standing at the edge of a rooftop terrace at golden hour, holding a smartphone, city skyline with bokeh lights behind, warm dramatic rim light outlining the figure, cinematic depth of field, fashion editorial quality'
    if (/dinheiro|lucro|faturamento|receita|rico|riqueza|ganhar|fatura/.test(t))
      return 'photorealistic macro shot of a hand holding a thick stack of hundred-dollar bills fanning out, single overhead key light creating dramatic shadows on dark marble, ultra detailed paper texture, deep black background, premium commercial photography'
    if (/erro|fracasso|problema|armadilha|mentira|cuidado|alerta|perigo/.test(t))
      return 'photorealistic image of a person standing alone in a dark empty corridor, single cold blue light source ahead casting long shadows behind them, sense of isolation and tension, cinematic wide angle'
    if (/segredo|sistema|controle|algoritmo|por tr[áa]s|invisível|oculto/.test(t))
      return 'aerial photorealistic view of a geometric maze at night, one solitary person illuminated by a single warm shaft of light at the center, everyone else lost in dark corridors, dramatic contrast, drone photography aesthetic'
    if (/sucesso|crescimento|conquista|escala|vit[óo]ria|lider|autoridade/.test(t))
      return 'photorealistic image of a person standing at the summit of a mountain at dawn, silhouette against a massive golden sunrise, deep atmospheric fog filling the valleys below, sense of epic achievement and scale, long exposure quality'
    if (/tempo|hora|rotina|produtividade|eficiência|trabalha|trabalho|grátis|desperdiç|automat|manual/.test(t))
      return 'extreme close-up macro photorealistic shot of a luxury mechanical watch, gears and movement partially visible, dramatic raking side light with deep shadows highlighting every detail, dark background, precision engineering aesthetic'
    if (/venda|cliente|negócio|empresa|mercado|produto|contrato|fechar/.test(t))
      return 'photorealistic cinematic shot of a sharp-dressed person in a modern glass office at night, city lights visible behind floor-to-ceiling windows, dramatic single light source from above, confident powerful atmosphere'
    if (/aprender|conhecimento|curso|habilidade|skill|estud/.test(t))
      return 'photorealistic image of a focused person studying at a desk late at night, single warm desk lamp illuminating their face and an open notebook, dark room around them, determined concentrated expression, cinematic intimate framing'
    if (/saúde|corpo|mente|bem.estar|energia|dormir|descanso/.test(t))
      return 'photorealistic image of a person meditating on a mountain cliff at sunrise, perfect stillness, warm golden light from the horizon, dramatic sky with clouds, sense of inner power and peace'
    if (/medo|bloqueio|trava|dúvida|ansiedade|paralisa/.test(t))
      return 'photorealistic image of a person standing alone at a crossroads on an empty road at night, multiple paths lit differently, sense of isolation and decision pressure, cinematic wide angle, fog in the distance'
    // fallback forte com pessoa — mais engajante que objetos abstratos
    return `photorealistic cinematic image representing the concept "${titulo.substring(0, 70)}", a person as the main subject in a dramatic professional setting, strong directional lighting, dark moody background, editorial photography quality`
  }

  // Slides internos: cena que sustenta o conteúdo específico
  if (/dinheiro|lucro|faturamento|venda|negócio/.test(t))
    return 'abstract close-up of premium financial symbols, dark rich background, single directional warm light, depth of field blur creating clean space for text overlay'
  if (/redes? sociais?|algoritmo|engajamento|viral|alcance|bot|automação|automatiz/.test(t))
    return 'abstract glowing blue-teal light network nodes floating in deep darkness, interconnected geometric lines suggesting digital communication, no screens no text no interface, cinematic atmospheric depth, clean dark background for text overlay'
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

// ─── Gera a cena com Claude a partir do conteúdo REAL do slide ───────────────
// Em vez de casar palavras-chave fixas (que falha em qualquer tema fora da
// lista), o Claude lê título+corpo+tema e descreve uma cena fotográfica
// LITERAL e específica — o personagem, o lugar, a época, o objeto que o slide
// realmente menciona. Retorna null em erro para cair no fallback por regex.
async function sceneFromClaude(
  titulo: string,
  corpo: string,
  tema: string,
  isFirstSlide: boolean,
): Promise<string | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return null

  const roleRule = isFirstSlide
    ? 'This is the COVER (first slide): the single most scroll-stopping, pattern-breaking, attention-grabbing image of the whole carousel. Bold dramatic focal subject. Leave clean dark negative space in the upper-left third for a headline that will be overlaid later.'
    : 'This is an internal content slide: push the main subject to one edge and keep a wide, clean, low-contrast negative space across the center for body text that will be overlaid later.'

  // Parte estática (regras) vai no system com cache_control → cacheia entre todas
  // as chamadas de cena, derrubando o custo de input. TTL de 5min mantém quente
  // com tráfego contínuo.
  const systemRules = [
    'Você é diretor de arte de carrosséis virais para Instagram. A partir do conteúdo de um slide, descreva UMA cena fotográfica concreta para um gerador de imagem (Flux).',
    'REGRAS:',
    '- Mostre LITERALMENTE o assunto/personagem/lugar/época/objeto que o slide menciona. Nada de metáfora abstrata genérica. Se fala de uma fábrica inglesa do século 19, mostre operários e máquinas vitorianas; se cita uma pessoa histórica, mostre uma figura fiel à época; se é futebol, mostre futebol.',
    '- Fotorrealista, cinematográfico, qualidade de fotografia editorial. Iluminação dramática direcional.',
    '- SEM nenhum texto, letra, palavra, número, logo ou interface na cena.',
    '- Responda APENAS com a descrição da cena, em inglês, um parágrafo, no máximo ~55 palavras. Sem preâmbulo.',
  ].join('\n')

  const userMsg = [
    `Tema do carrossel: "${tema || titulo}".`,
    `Título do slide: "${titulo}".`,
    corpo ? `Corpo do slide: "${corpo.substring(0, 400)}".` : '',
    '',
    roleRule,
  ].filter(Boolean).join('\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 220,
        system: [{ type: 'text', text: systemRules, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMsg }],
      }),
    })
    if (!res.ok) {
      console.error('[scene] Claude HTTP', res.status, (await res.text()).substring(0, 200))
      return null
    }
    const data = await res.json()
    const text = (data?.content?.[0]?.text ?? '').trim()
    return text.length > 10 ? text : null
  } catch (e) {
    console.error('[scene] Claude erro:', String(e))
    return null
  }
}

// ─── Monta prompt completo ────────────────────────────────────────────────────
function buildContextualPrompt(
  titulo: string,
  corpo: string,
  style: string,
  isFirstSlide: boolean,
  nicho: string,
  tema: string,
  sceneOverride?: string,
): string {
  const modifier  = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS['cinematic']
  const mood      = inferMood(`${titulo} ${corpo ?? ''} ${tema ?? ''}`)
  const comp      = isFirstSlide ? COVER_COMP : SLIDE_COMP
  const scene     = sceneOverride ?? buildSceneFromContent(titulo, corpo, nicho, isFirstSlide)

  const qualitySuffix = isFirstSlide
    ? 'Photorealistic ultra-detailed render, 8K resolution, perfect focus, professional color grade, RAW photo quality, hyper-realistic textures and materials, no text, no words, no watermarks, no overlaid graphics.'
    : 'Photorealistic render, sharp focus on subject, soft natural background, professional color grade, no text, no words, no watermarks, no UI elements.'

  return [
    NO_TEXT,
    `Scene: ${scene}.`,
    `Composition: ${comp}.`,
    `Mood and lighting: ${mood}.`,
    `Render style: ${modifier}.`,
    qualitySuffix,
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

// ─── fal.ai com retry + timeout ───────────────────────────────────────────────
// Retries: 3 tentativas com backoff 2s / 4s.
// Timeout: AbortController em 52s (abaixo do limite de 60s da Edge Function).
// Retryable: timeout, 429, 5xx. Non-retryable: 4xx (exceto 429).
async function falWithRetry(
  falKey: string,
  body: Record<string, unknown>,
): Promise<string> {
  const DELAYS_MS = [0, 2000, 4000]

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, DELAYS_MS[attempt]))
      console.log(`[fal] retry ${attempt}/2`)
    }

    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 52_000)

    try {
      const res = await fetch('https://fal.run/fal-ai/flux-2-pro', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body:    JSON.stringify(body),
        signal:  ctrl.signal,
      })
      clearTimeout(tid)

      if (res.ok) {
        const data = await res.json()
        const url  = data.images?.[0]?.url as string | undefined
        if (url) return url
        throw new Error(`fal_no_url: ${JSON.stringify(data).substring(0, 200)}`)
      }

      const errText = await res.text()
      console.error(`[fal] attempt ${attempt} HTTP ${res.status}:`, errText.substring(0, 200))

      // retryable: throttle ou erro de servidor
      if (res.status === 429 || res.status >= 500) continue

      // non-retryable: 4xx (exceto 429)
      throw new Error(`fal_http_${res.status}: ${errText.substring(0, 100)}`)

    } catch (e) {
      clearTimeout(tid)
      if (e instanceof DOMException && e.name === 'AbortError') {
        console.error(`[fal] attempt ${attempt} timeout (52s)`)
        continue  // retry após timeout
      }
      if (attempt < 2 && String(e).includes('fal_no_url')) continue
      throw e
    }
  }

  throw new Error('fal_exhausted_retries')
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

      // Cena vinda do Claude (contextual ao conteúdo real); null → fallback regex
      const scene = await sceneFromClaude(finalTitulo, finalCorpo, carouselTema, !!is_first_slide)
      fullPrompt = buildContextualPrompt(finalTitulo, finalCorpo, styleKey, !!is_first_slide, userNicho, carouselTema, scene ?? undefined)
    } else {
      // Sem slide específico: usa a capa do tema (Claude) como cena de impacto
      if (carouselRes.error || !carouselRes.data) return json({ error: 'carousel_not_found' }, 404)
      const scene = await sceneFromClaude(carouselTema, '', carouselTema, true)
      fullPrompt = scene
        ? buildContextualPrompt(carouselTema, '', styleKey, true, userNicho, carouselTema, scene)
        : buildGenericPrompt(carouselTema, styleKey, userNicho)
    }

    console.log('[generate-image] slide_id:', slide_id ?? 'all', 'prompt:', fullPrompt)

    // ── Chama fal.ai com retry + timeout ─────────────────────────────
    const falKey = Deno.env.get('FAL_KEY') ?? ''
    if (!falKey) return json({ error: 'fal_key_missing' }, 500)

    let imageUrl: string
    try {
      imageUrl = await falWithRetry(falKey, {
        prompt:                fullPrompt,
        negative_prompt:       NEGATIVE_PROMPT,
        image_size:            { width: 1080, height: 1350 },
        num_inference_steps:   is_first_slide ? 35 : 30,
        guidance_scale:        4.5,
        num_images:            1,
        enable_safety_checker: true,
      })
    } catch (e) {
      const msg = String(e)
      console.error('[fal] falhou após retries:', msg)
      const isTimeout = msg.includes('timeout') || msg.includes('exhausted')
      return json({ error: isTimeout ? 'fal_timeout' : 'fal_error', retryable: true, detail: msg }, 502)
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
      cost_brl:    0.29,  // flux-2-pro ≈ R$0.28 + cena via Claude Haiku ≈ R$0.01
    })

    return json({ success: true, bg_image_url: imageUrl })

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
