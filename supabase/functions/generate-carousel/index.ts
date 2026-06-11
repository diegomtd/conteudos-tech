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

// ─── Template configs (duplicado do frontend — Deno não importa de src/) ──────
const TEMPLATE_CONFIGS: Record<string, {
  font_size_title: number; font_size_body: number; title_uppercase: boolean
  title_letter_spacing: number; text_position: string; overlay_opacity: number
  body_max_lines: number; num_slides_sugerido: number
}> = {
  impacto:      { font_size_title: 96, font_size_body: 30, title_uppercase: true,  title_letter_spacing: 3, text_position: 'bottom', overlay_opacity: 60, body_max_lines: 3,  num_slides_sugerido: 7  },
  editorial:    { font_size_title: 64, font_size_body: 30, title_uppercase: true,  title_letter_spacing: 1, text_position: 'center', overlay_opacity: 70, body_max_lines: 5,  num_slides_sugerido: 10 },
  lista:        { font_size_title: 48, font_size_body: 30, title_uppercase: false, title_letter_spacing: 0, text_position: 'center', overlay_opacity: 65, body_max_lines: 4,  num_slides_sugerido: 7  },
  citacao:      { font_size_title: 52, font_size_body: 28, title_uppercase: false, title_letter_spacing: 0, text_position: 'center', overlay_opacity: 75, body_max_lines: 2,  num_slides_sugerido: 5  },
  storytelling: { font_size_title: 58, font_size_body: 28, title_uppercase: false, title_letter_spacing: 0, text_position: 'bottom', overlay_opacity: 55, body_max_lines: 4,  num_slides_sugerido: 10 },
  dados:        { font_size_title: 88, font_size_body: 30, title_uppercase: true,  title_letter_spacing: 2, text_position: 'center', overlay_opacity: 70, body_max_lines: 3,  num_slides_sugerido: 7  },
}

// ─── Font size adaptativo por comprimento do título ───────────────────────────
function adaptiveTitleFontSize(titulo: string, templateId: string): number {
  const base = TEMPLATE_CONFIGS[templateId]?.font_size_title ?? 80
  const words = titulo.trim().split(' ').length
  if (words <= 3) return Math.min(base + 16, 120)
  if (words <= 5) return base
  if (words <= 8) return Math.max(base - 12, 56)
  return Math.max(base - 20, 48)
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
    const { tema, tom, num_slides, cta_tipo, template_id, instructions } = await req.json() as {
      tema: string
      tom: string
      num_slides: number
      cta_tipo: string
      template_id?: string
      instructions?: string
    }

    if (!tema?.trim()) return json({ error: 'tema_required' }, 400)

    const tplId = template_id && TEMPLATE_CONFIGS[template_id] ? template_id : 'impacto'
    const tplCfg = TEMPLATE_CONFIGS[tplId]

    // ── Busca profile ─────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('voice_profile, visual_kit, niche, plan, carousels_used_this_month, carousels_limit')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404)

    // ── Memória: últimos 5 temas gerados pelo usuário ─────────────────
    const { data: recentCarousels } = await supabase
      .from('carousels')
      .select('tema, legenda')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    const temasRecentes = (recentCarousels ?? []).map((c: { tema: string }) => c.tema).filter(Boolean)

    // ── Verifica limite de carrosséis ─────────────────────────────────
    const { data: planLimits, error: planLimitsError } = await supabase
      .from('plan_limits')
      .select('carousels_per_month')
      .eq('plan', profile.plan)
      .single()

    if (planLimitsError || !planLimits) return json({ error: 'plan_limits_not_found' }, 500)

    if (profile.carousels_used_this_month >= planLimits.carousels_per_month) {
      return new Response(JSON.stringify({
        error: 'CAROUSEL_LIMIT_REACHED',
        message: `Limite de ${planLimits.carousels_per_month} carrosseis atingido este mês.`,
      }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    }

    // ── Extrai voice profile ──────────────────────────────────────────
    const vp = (profile.voice_profile ?? {}) as Record<string, unknown>
    const palavrasProibidas  = Array.isArray(vp.palavras_proibidas)  ? (vp.palavras_proibidas  as string[]).join(', ') : ''
    const palavrasDefinidoras = Array.isArray(vp.palavras_definidoras) ? (vp.palavras_definidoras as string[]).join(', ') : ''
    const palavrasChave      = Array.isArray(vp.palavras_chave)      ? (vp.palavras_chave      as string[]).join(', ') : ''
    const exemploTexto       = typeof vp.exemplo_texto  === 'string' ? vp.exemplo_texto   : ''
    const tomExtraido        = typeof vp.tom_extraido   === 'string' ? vp.tom_extraido    : ''
    const ritmoVoz           = typeof vp.ritmo          === 'string' ? vp.ritmo           : ''
    const personalidadeVoz   = typeof vp.personalidade  === 'string' ? vp.personalidade   : ''
    const tomVoz             = tomExtraido || (typeof vp.tom === 'string' ? vp.tom : tom)

    // ── Memória de contexto ───────────────────────────────────────────
    const memoriaCtx = temasRecentes.length
      ? `\nTEMAS JÁ CRIADOS PELO USUÁRIO (não repetir ângulo, encontrar perspectiva nova): ${temasRecentes.map((t, i) => `${i + 1}. "${t}"`).join('; ')}`
      : ''

    // ── Monta system prompt ───────────────────────────────────────────
    const systemPrompt = `Você é um estrategista de conteúdo especialista em carrosseis virais para Instagram no mercado brasileiro. Seu trabalho é gerar carrosseis que param o scroll, retêm a leitura e geram ação real.

━━━ ESTRATÉGIA DE VIRALIZAÇÃO (aplique sempre) ━━━

HOOK DO SLIDE 1 — os primeiros 3 segundos decidem tudo:
- Use tensão, paradoxo ou dado chocante. Nunca uma promessa.
- Estruturas que funcionam: "X não é o problema. Você está perdendo Y." / "Ninguém fala isso sobre X." / "Fiz X por 3 anos. Estava errado."
- O título da capa deve criar uma lacuna cognitiva que só fecha se a pessoa passar o slide.
- Máximo 6 palavras no título da capa. Sem ponto final na capa.

RETENÇÃO SLIDE A SLIDE — cada slide precisa puxar o próximo:
- A última frase de cada slide (exceto o último) deve obrigatoriamente abrir um loop, uma pergunta implícita ou uma tensão que só resolve no slide seguinte. Exemplos: "Mas tem um detalhe que a maioria ignora." / "E aqui é onde tudo muda." / "O problema não é o que você pensa."
- Use o padrão "setup no slide par, payoff no slide ímpar": slide 2 levanta a tensão, slide 3 resolve parcialmente e abre outra.
- Slide do meio (posição N/2): inserir o dado mais forte ou a virada emocional. É aqui que o usuário decide salvar ou sair.
- Nunca entregue tudo de uma vez. Cada slide é uma peça do quebra-cabeça.
- O leitor deve sentir que não pode parar no meio — cada slide cria dependência do próximo.

ESTRUTURA NARRATIVA OBRIGATÓRIA:
- Slide 1: gancho que rompe o padrão esperado
- Slides 2 a 3: contexto e problema real que o leitor já viveu
- Slides 4 a N-2: desenvolvimento com prova, dado concreto ou caso real
- Slide N-1: virada, insight ou reframe que muda a perspectiva
- Slide N: CTA que emerge naturalmente da narrativa, não colado no final

ALGORITMO DO INSTAGRAM 2025 — o que faz o carrossel ir longe:
- Salvamentos e compartilhamentos pesam mais que curtidas. Gere conteúdo que as pessoas querem guardar para reler.
- Tempo de leitura importa. Slides com corpo bem preenchido (não cheio, mas consistente) aumentam o tempo no post.
- Perguntas no último slide aumentam comentários, que aumentam alcance.
- Títulos que geram discordância ou identidade ("isso aconteceu comigo") disparam compartilhamento.

━━━ REGRAS DE COPY ━━━

TÍTULOS:
- Máximo 6 palavras na capa, máximo 8 nos demais slides.
- Declaração provocadora, paradoxo ou contradição inteligente.
- Nunca começar com: "Como", "Dicas", "Aprenda", "Conheça", "Descubra".
- Letra maiúscula só na primeira palavra e em nomes próprios. Nunca ALL CAPS no título (o template já define isso).
- Sem ponto final no título.

CORPO DOS SLIDES:
- Máximo ${tplCfg.body_max_lines} linhas por slide. Cada linha é uma frase completa com sujeito, verbo e objeto.
- OBRIGATÓRIO: após todo ponto final, a próxima palavra começa com letra maiúscula. Sem exceção.
- O corpo é uma narrativa contínua, não uma lista. Proibido usar itens separados por ponto, vírgula ou linha como se fossem bullet points. Proibido o formato "item 1 / item 2 / item 3".
- Linguagem de conversa real: como alguém que entende do assunto falando com um amigo, não ensinando.
- O texto pode tropeçar levemente como pensamento real, não como artigo editado e polido.
- Números concretos quando encaixam na narrativa. Dado de estudo cabe em uma frase, nunca vira aula.
- Verbos de ação. Frases curtas que respiram. Cada frase tem só uma ideia.

FORMATO DO CORPO — EXEMPLO CORRETO:
"Você passa horas fazendo isso toda semana. Não percebe porque virou rotina. Mas tem um número que muda tudo quando você calcula."

FORMATO DO CORPO — EXEMPLO ERRADO (nunca fazer):
"agendar posts: 4 horas\nemails de follow up: 2 horas\nrelatórios: 3 horas"

PROIBIDO em qualquer slide:
- Travessão (nem em títulos, nem no corpo)
- Ponto de exclamação
- Listas com itens separados por quebra de linha, dois-pontos ou barra
- "Portanto", "ademais", "vale destacar", "no mundo atual", "nos dias de hoje", "no cenário atual"
- Coaching language: "potencialize", "alavanque", "decole", "transforme sua vida", "sua melhor versão"
- Contraste artificial: "Não foi X. Foi Y." / "O problema nunca foi X. Foi Y."
- Aforismos redondos demais que parecem frase de calendário
- Linguagem genérica de IA: qualquer frase que possa ter sido escrita por qualquer pessoa sobre qualquer assunto

━━━ IDENTIDADE DO CRIADOR ━━━

Nicho: ${profile.niche ?? 'empreendedorismo'}
Tom de voz calibrado: ${tomVoz}
${ritmoVoz ? `Ritmo de escrita: ${ritmoVoz}` : ''}
${personalidadeVoz ? `Personalidade da voz: ${personalidadeVoz}` : ''}
${palavrasDefinidoras ? `Expressões e palavras que definem a voz: ${palavrasDefinidoras}` : ''}
${palavrasChave ? `Palavras-chave do posicionamento: ${palavrasChave}` : ''}
${palavrasProibidas ? `NUNCA usar (voz do criador): ${palavrasProibidas}` : ''}
${exemploTexto ? `Estilo de referência do criador:\n"${exemploTexto}"` : ''}
Template atual: ${tplId} — adapte a densidade do texto ao template (impacto = mais curto e visceral; storytelling = mais narrativo; dados = dado primeiro, desenvolvimento depois)
${memoriaCtx}

━━━ LEGENDA DO POST ━━━

A legenda segue a mesma voz e tem:
- Linha 1: hook forte (repete ou expande o gancho da capa, nunca copia igual)
- Desenvolvimento em 3 a 5 frases com a ideia central
- CTA natural que emerge do conteúdo
- 5 a 8 hashtags relevantes ao nicho no final

Responda APENAS com o JSON solicitado, sem texto adicional, sem markdown.`

    // ── num_slides: 0 = IA decide ─────────────────────────────────────
    const slidesInstruction = num_slides === 0
      ? `Escolha o número ideal de slides para este tema (entre 5 e 12). Ajuste à profundidade necessária.`
      : `Crie exatamente ${num_slides} slides.`

    const userPrompt = `Tema do carrossel: ${tema}
CTA desejado: ${cta_tipo}
${slidesInstruction}
${instructions ? `Instruções adicionais do criador: ${instructions}\n` : ''}
Retorne APENAS este JSON válido, sem markdown, sem explicação:
{
  "slides": [
    {"position": 1, "titulo": "...", "corpo": ""},
    {"position": 2, "titulo": "...", "corpo": "..."},
    {"position": N, "titulo": "...", "corpo": "..."}
  ],
  "legenda": "..."
}

Slide 1 deve ter corpo vazio (a capa só tem título). Todos os outros slides têm título e corpo.`

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
    const inputTokens  = claudeData.usage?.input_tokens ?? 0
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
        num_slides:     parsed.slides.length,
        slides_json:    parsed.slides,
        legenda:        parsed.legenda,
        has_watermark:  hasWatermark,
        template_style: tplId,
        status:         'draft',
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
      overlay_opacity:      isClaro ? 30 : tplCfg.overlay_opacity,
      title_uppercase:      tplCfg.title_uppercase,
      font_size_title:      adaptiveTitleFontSize(s.titulo, tplId),
      font_size_body:       tplCfg.font_size_body,
      title_line_height:    1.1,
      title_letter_spacing: tplCfg.title_letter_spacing,
      text_position:        tplCfg.text_position,
      padding_x:            20,
      block_spacing:        16,
    }))

    const { error: slidesError } = await supabase
      .from('carousel_slides')
      .insert(slideRows)

    if (slidesError) console.error('Slides insert error:', slidesError)

    // ── Marca carrossel como pronto ───────────────────────────────────
    await supabase
      .from('carousels')
      .update({ status: 'ready' })
      .eq('id', carousel.id)

    // ── Log de uso ────────────────────────────────────────────────────
    await supabase.from('usage_logs').insert({
      user_id: userId,
      action:  'generate_carousel',
      tokens_used: tokensUsed,
      cost_brl: costBrl,
    })

    // ── Incrementa contador de carrosséis ─────────────────────────────
    await supabase.rpc('increment_counter', {
      p_user_id: userId,
      p_field: 'carousels_used_this_month',
    })

    return json({
      carousel_id:   carousel.id,
      preview_token: carousel.preview_token,
      slides:        parsed.slides,
      legenda:       parsed.legenda,
      has_watermark: hasWatermark,
    })

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
