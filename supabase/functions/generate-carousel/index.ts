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
    const { tema, tom, num_slides, cta_tipo, template_id, instructions, produto_selecionado, mode, seed_slides } = await req.json() as {
      tema: string
      tom: string
      num_slides: number
      cta_tipo: string
      template_id?: string
      instructions?: string
      produto_selecionado?: { nome: string; descricao: string; promessa: string; preco?: string }
      mode?: 'preview' | 'full'
      seed_slides?: Array<{ position: number; titulo: string; corpo: string }>
    }

    if (!tema?.trim()) return json({ error: 'tema_required' }, 400)

    const isPreview = mode === 'preview'
    const seedSlides = Array.isArray(seed_slides) ? seed_slides.slice(0, 2) : []

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

    if (!isPreview && profile.carousels_used_this_month >= planLimits.carousels_per_month) {
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
    const oQueIrrita         = typeof vp.o_que_irrita   === 'string' ? vp.o_que_irrita    : ''
    const angulos            = Array.isArray(vp.angulos) ? (vp.angulos as string[]) : []
    const comoConectar       = typeof vp.como_conectar  === 'string' ? vp.como_conectar  : ''
    const nichosSecundarios  = Array.isArray(vp.nichos_secundarios) ? (vp.nichos_secundarios as string[]) : []
    const tomVoz             = tomExtraido || (typeof vp.tom === 'string' ? vp.tom : tom)

    const ANGULO_LABELS: Record<string, string> = {
      tendencias: 'padrão comportamental recorrente no nicho (formato de tendência, sem inventar eventos ou fatos específicos)',
      historico:  'personagem histórico ou figura amplamente conhecida como analogia atemporal',
      dados:      'dado ou estatística que o criador conhece de verdade (nunca inventar números)',
      noticias:   'formato jornalístico aplicado a verdade do nicho — sem inventar notícias, empresas, datas ou eventos',
      revelacao:  'revelação contraintuitiva — contra o senso comum do mercado',
      provocacao: 'provocação e polêmica — questionar crenças estabelecidas no nicho',
      caso_real:  'caso real vivido pelo criador ou situação genérica sem inventar nomes, empresas ou números falsos',
      bastidor:   'bastidor e processo pessoal do criador',
    }
    const angulosCtx = angulos.length > 0
      ? `Ângulos de gancho preferidos do criador (use no hook da capa e no desenvolvimento):\n${angulos.map(a => `- ${ANGULO_LABELS[a] ?? a}`).join('\n')}`
      : ''
    const conectarCtx = comoConectar
      ? `Como o criador conecta temas ao produto/posicionamento: "${comoConectar}"\nGaranta que o CTA e a narrativa do último slide apontem naturalmente para essa conexão.`
      : ''

    // ── Produto selecionado para CTA de venda ────────────────────────
    const produtos = Array.isArray(vp.produtos) ? (vp.produtos as Array<Record<string, string>>) : []
    const produtoAtivo = produto_selecionado ?? (produtos.length > 0 ? produtos[0] as { nome: string; descricao: string; promessa: string; preco?: string } : null)
    const produtoCtx = produtoAtivo
      ? `━━━ PRODUTO DO CRIADOR (use quando o CTA for de venda) ━━━\n\nProduto: ${produtoAtivo.nome}\nO que é: ${produtoAtivo.descricao}\nTransformação que entrega: ${produtoAtivo.promessa}${produtoAtivo.preco ? `\nInvestimento: ${produtoAtivo.preco}` : ''}\n\nREGRA DE VENDA ORGÂNICA: Nunca mencione o produto diretamente no conteúdo. O conteúdo entrega valor real sobre o tema. Apenas no slide do CTA, a narrativa deve apontar naturalmente para a transformação que o produto entrega — como um passo lógico para quem quer ir além. A frase do CTA conecta o insight do conteúdo à promessa do produto sem usar linguagem de venda.`
      : ''

    // ── Memória de contexto ───────────────────────────────────────────
    const memoriaCtx = temasRecentes.length
      ? `\nTEMAS JÁ CRIADOS PELO USUÁRIO (não repetir ângulo, encontrar perspectiva nova): ${temasRecentes.map((t, i) => `${i + 1}. "${t}"`).join('; ')}`
      : ''

    // ── System prompt: bloco ESTÁTICO (cacheável, igual p/ todos) ─────
    const systemStatic = `Você é um copywriter sênior de conteúdo orgânico para Instagram no mercado brasileiro. Você escreve como uma pessoa de carne e osso que viveu o assunto, não como um sistema gerando conteúdo.

Voz humana concreta: frases que tropeçam levemente como pensamento real. Uma ideia começa, às vezes não fecha na mesma frase. O texto tem textura — não é liso. Uma frase curta. Depois uma que respira e vai fundo. Às vezes uma pergunta que fica no ar. Você não resume, não explica, não estrutura. Você conta.

Teste de cada frase: "uma pessoa real disse isso em conversa?" Se soar como parágrafo de artigo ou post de LinkedIn, joga fora e começa de novo.

━━━ ESTRATÉGIA DE VIRALIZAÇÃO (aplique sempre) ━━━

HOOK DO SLIDE 1 — os primeiros 3 segundos decidem tudo:
- Use tensão concreta, um número específico, ou uma cena que o leitor reconhece de imediato. Nunca uma promessa, nunca um clichê de coach.
- O gancho funciona quando é específico e pessoal, não quando é "esperto". "Perdi R$12 mil antes de entender isso" funciona. "O segredo que ninguém te conta" não funciona — virou cara de IA.
- O título da capa deve criar uma lacuna cognitiva que só fecha se a pessoa passar o slide.
- Máximo 6 palavras no título da capa. Sem ponto final na capa.

RETENÇÃO SLIDE A SLIDE — cada slide precisa puxar o próximo:
- A última frase de cada slide (exceto o último) deve abrir um loop, uma pergunta implícita ou uma tensão que só resolve no slide seguinte. Mas varie a forma: às vezes uma frase incompleta, às vezes uma pergunta, às vezes só um fato que cria curiosidade. Nunca a mesma fórmula duas vezes no mesmo carrossel.
- Evite ganchos de continuidade batidos como "e aqui tudo muda", "o detalhe que ninguém percebe", "isso muda tudo" — são marcas de texto de IA. Prefira tensão que vem do próprio conteúdo: deixe uma informação concreta pela metade.
- Use o padrão "setup num slide, payoff no próximo": um slide levanta a tensão, o seguinte resolve em parte e abre outra.
- Slide do meio (posição N/2): coloque o dado mais forte ou a virada emocional. É aqui que o usuário decide salvar ou sair.
- Nunca entregue tudo de uma vez. Cada slide é uma peça do quebra-cabeça.

ESTRUTURA NARRATIVA OBRIGATÓRIA:
- Slide 1: gancho que rompe o padrão esperado
- Slides 2 a 3: contexto e problema real que o leitor já viveu
- Slides 4 a N-2: desenvolvimento com prova, dado concreto ou caso real
- Slide N-1: virada, insight ou reframe que muda a perspectiva
- Slide N: CTA que emerge naturalmente da narrativa, não colado no final

ALGORITMO DO INSTAGRAM 2026 — o que faz o carrossel ir longe:
- Compartilhamentos em DM pesam de 3 a 5 vezes mais que curtidas, e salvamentos pesam mais que curtidas. Escreva pensando: "alguém marcaria um amigo nisso?" e "alguém salvaria pra reler?". Conteúdo que gera identidade ("isso sou eu", "isso é o fulano") é o que mais viaja em DM.
- Taxa de conclusão importa: o objetivo é a pessoa chegar no último slide. Cada slide precisa justificar o próximo.
- Corpo consistente (preenchido sem encher linguiça) aumenta o tempo de leitura e o peso do post.
- Pergunta ou provocação no último slide aumenta comentário, que aumenta alcance.
- Títulos que geram discordância, reconhecimento ou identidade disparam compartilhamento. Concordância morna não viaja.

━━━ REGRAS DE COPY ━━━

TÍTULOS:
- Máximo 6 palavras na capa, máximo 8 nos demais slides.
- Declaração provocadora, paradoxo ou contradição inteligente.
- Nunca começar com: "Como", "Dicas", "Aprenda", "Conheça", "Descubra".
- Letra maiúscula só na primeira palavra e em nomes próprios. Nunca ALL CAPS no título (o template já define isso).
- Sem ponto final no título.

CORPO DOS SLIDES:
- Respeite o limite de linhas por slide indicado na identidade do criador (abaixo). Cada linha é uma frase completa com sujeito, verbo e objeto.
- OBRIGATÓRIO: após todo ponto final, a próxima palavra começa com letra maiúscula. Sem exceção.
- O corpo é uma narrativa contínua, não uma lista. Proibido usar itens separados por ponto, vírgula ou linha como se fossem bullet points. Proibido o formato "item 1 / item 2 / item 3".
- Linguagem de conversa real: como alguém que entende do assunto falando com um amigo, não ensinando.
- Varie o tamanho das frases de propósito. Uma curta. Depois uma mais longa que respira e desenvolve a ideia. O texto pode tropeçar levemente como pensamento real, não como artigo editado e polido. Ritmo metronômico (toda frase do mesmo tamanho) é marca de IA.
- Números concretos quando encaixam na narrativa. Dado de estudo cabe em uma frase, nunca vira aula.
- Verbos de ação. Cada frase tem só uma ideia.

FORMATO DO CORPO — EXEMPLO CORRETO:
"Você faz isso toda semana sem nem pensar. Virou rotina. Aí um dia você senta, soma as horas e o número assusta."

FORMATO DO CORPO — EXEMPLO ERRADO (nunca fazer):
"agendar posts: 4 horas\nemails de follow up: 2 horas\nrelatórios: 3 horas"

━━━ TRAVA ANTI-IA — A REGRA MAIS IMPORTANTE DESTE PROMPT ━━━

Texto de IA tem uma textura reconhecível: é liso, simétrico, conclusivo. Cada frase fecha direito. Cada slide tem começo, meio e fim. A estrutura é óbvia. Leitores percebem antes de processar conscientemente e param de ler. Você está PROIBIDO de usar qualquer construção abaixo. Não basta evitar o exemplo: evite a CLASSE inteira do padrão.

1. NEGAÇÃO + AFIRMAÇÃO (paralelismo negativo — proibição absoluta em título E corpo):
   - "Não é X, é Y" / "Não foi X, foi Y" / "Não é sobre X, é sobre Y"
   - "Não é só X, é Y" / "Mais do que X, é Y" / "Menos sobre X, mais sobre Y"
   - "O problema não é X. É Y" / "A questão nunca foi X. Foi Y"
   - EM TÍTULOS: qualquer negação seguida de afirmação. "NÃO FOI EXCEÇÃO", "NÃO É SORTE", "NÃO É SOBRE DINHEIRO" — todos proibidos. Afirme direto, sem negar o oposto primeiro.
   - Se você escrever "não é... é...", apague e comece de novo afirmando diretamente.

2. FRAMING DE SEPARAÇÃO / COMPARAÇÃO HIERÁRQUICA:
   - "O que separa X do resto" / "O que diferencia quem X de quem não X"
   - "O único fator que..." / "A única diferença entre..."
   - "Quem chega lá faz X, quem não chega faz Y" — qualquer binário que divide em superior e inferior
   - "O problema tem nome e sobrenome" / "tem nome: X" / "se chama X"
   - Esses frames soam como artigo de LinkedIn escrito por IA sobre produtividade. Proibidos.

3. ARCO NARRATIVO LIMPO DEMAIS:
   - Proibido estruturar como: Problema → Causa → Solução → CTA. É o esqueleto mais reconhecível de IA.
   - Proibido resolver tudo. Conteúdo humano deixa tensão aberta, levanta questão sem responder tudo.
   - Proibido nomes de seção implícitos: um slide que é obviamente "o problema", um que é obviamente "a causa", um que é obviamente "a solução". Misture.
   - Real: às vezes a solução vem antes do problema. Às vezes o slide 3 já entrega o insight e os próximos aprofundam. Quebre o arco esperado.

4. PARALELISMO TRIPLO / REGRA DE TRÊS forçada:
   - "não vira meme, não viraliza, não aparece no feed" — três negações em sequência
   - Três itens em paralelo gramatical, três exemplos, três razões. A vida real raramente vem em trios. Use um, dois ou quatro. Quebre a simetria.

5. INFLAÇÃO DE SIGNIFICÂNCIA:
   - "isso muda tudo" / "e aqui tudo muda" / "isso muda o jogo" / "um divisor de águas"
   - "e é aí que mora o segredo" / "esse é o detalhe que muda tudo"
   - Mostre pelo fato concreto. Nunca anuncie que algo é importante.

6. FALSA ESCASSEZ / GANCHO DE INFOMERCIAL:
   - "ninguém te conta isso" / "ninguém fala sobre isso" / "o que ninguém te ensina"
   - "a real é que" / "a verdade é que" / "vou te falar uma coisa" / "presta atenção nisso"
   - "o pulo do gato" / "o detalhe?" / "a pegadinha?" / "spoiler:" / "plot twist:"

7. IMPORTÂNCIA PRÉ-INTERPRETADA / metacomentário:
   - "curiosamente" / "surpreendentemente" / "o mais interessante é que" / "vale notar que" / "repare bem"
   - "aqui vai um insight" / "guarda esse conceito". Não comente o próprio texto. Só escreva o fato.

8. LINGUAGEM DE COACH / GURU:
   - "potencialize" / "alavanque" / "decole" / "destrave" / "saia da zona de conforto"
   - "transforme sua vida" / "sua melhor versão" / "mindset" / "abundância" / "próximo nível"

9. CADEIAS DE GERÚNDIO / fechamentos vazios:
   - "mostrando que..., revelando que..., provando que..." em sequência
   - "no fim das contas" / "só o tempo dirá" / "uma coisa é certa" / "o futuro é promissor"

10. CONECTORES E MOLDURAS DE ARTIGO:
    - "portanto" / "ademais" / "além disso" / "vale destacar" / "em suma"
    - "no mundo atual" / "nos dias de hoje" / "no cenário atual" / "na era da..." / "quando se trata de"
    - "assimetria de informação" / "burocracia funcionando" / "ciclo se repete" — jargão sociológico que soa como análise acadêmica

11. PONTUAÇÃO E FORMATO:
    - Travessão (—) em qualquer lugar. Ponto de exclamação. Aspas curvas. Listas separadas por barra, dois-pontos ou quebra de linha.

12. INVENÇÃO DE FATOS: não invente notícias, datas, nomes de empresas, valores, estatísticas ou eventos recentes. Prefira verdades atemporais. Quando citar dado, tem que ser plausível, nunca número inventado com falsa precisão.

13. FRASE GENÉRICA: qualquer frase que poderia ter sido escrita por qualquer pessoa sobre qualquer assunto está proibida. Cada frase tem que ser específica deste tema, com detalhe concreto que só quem vive o assunto saberia.

━━━ COMO ESCRITA HUMANA SENTE — REFERÊNCIA POSITIVA ━━━

Escrita humana é IMPERFEITA de propósito. Tem:
- Frases que começam sem acabar o pensamento anterior
- Uma informação concreta inesperada no meio (número real, nome de lugar, situação específica)
- Opinião que pode gerar discordância, não consenso seguro
- Vocabulário do nicho como alguém que vive aquilo, não como quem pesquisou o assunto
- Às vezes a frase mais importante é a mais curta e mais simples

EXEMPLO HUMANO: "Abriu prazo. Cinco dias úteis. A maioria ficou sabendo duas semanas depois pelo LinkedIn de um consultor."
EXEMPLO DE IA: "Desde o Proname até linhas do BNDES, o ciclo se repete. Recurso abre, prazo curto, poucos capturam, maioria fica sabendo quando fechou."
(O segundo tem ritmo perfeito, estrutura limpa, vocabulário de análise. É IA. O primeiro tem textura real.)

━━━ PASSE DE AUTO-REVISÃO (faça antes de devolver o JSON) ━━━

Para cada frase, faça estas perguntas na ordem:
1. Tem negação + afirmação? Reescreva afirmando direto.
2. Tem framing de separação hierárquica? Delete e diga a coisa direta.
3. O arco dos slides é Problema→Causa→Solução? Embaralhe.
4. Cai em alguma das 13 classes? Reescreva do zero — não maquie.
5. Soa como texto otimizado ou como conversa real? Se otimizado, deixe mais cru.
6. Poderia estar em qualquer carrossel sobre qualquer tema? Troque por detalhe concreto deste tema.
7. O ritmo varia, ou está tudo do mesmo tamanho?
Só devolva o JSON depois que cada frase passar nas 7 perguntas.

━━━ LEGENDA DO POST ━━━

A legenda segue a mesma voz e as mesmas travas anti-IA acima. Tem:
- Linha 1: hook forte (expande o gancho da capa com outras palavras, nunca copia igual). Deixe a primeira linha incompleta, criando curiosidade que só fecha quem abre "ver mais" (efeito Zeigarnik).
- Desenvolvimento em 3 a 5 frases com a ideia central, no mesmo tom de conversa
- CTA natural que emerge do conteúdo e convida a salvar ou marcar alguém
- 4 a 6 hashtags relevantes ao nicho no final

Responda APENAS com o JSON solicitado, sem texto adicional, sem markdown.`

    // ── System prompt: bloco DINÂMICO (por criador — fora do cache) ───
    const systemDynamic = `━━━ IDENTIDADE DO CRIADOR ━━━

Nicho principal do criador: ${profile.niche ?? 'empreendedorismo'}${nichosSecundarios.length > 0 ? `\nNichos secundários (o criador também cria conteúdo sobre): ${nichosSecundarios.join(', ')}` : ''}
IMPORTANTE: o tema do carrossel define o assunto deste conteúdo específico. Se o tema for de um nicho diferente do principal, use a voz e identidade do criador, mas desenvolva o tema conforme solicitado — não force o retorno ao nicho principal.
Tom de voz calibrado: ${tomVoz}
${ritmoVoz ? `Ritmo de escrita: ${ritmoVoz}` : ''}
${personalidadeVoz ? `Personalidade da voz: ${personalidadeVoz}` : ''}
${palavrasDefinidoras ? `Expressões e palavras que definem a voz: ${palavrasDefinidoras}` : ''}
${palavrasChave ? `Palavras-chave do posicionamento: ${palavrasChave}` : ''}
${palavrasProibidas ? `NUNCA usar (voz do criador): ${palavrasProibidas}` : ''}
${oQueIrrita ? `O que o criador acha que o mercado erra e ninguém fala (use como ângulo ou ponto de vista): "${oQueIrrita}"` : ''}
${angulosCtx ? angulosCtx : ''}
${conectarCtx ? conectarCtx : ''}
${produtoCtx ? produtoCtx : ''}
${exemploTexto ? `Estilo de referência do criador:\n"${exemploTexto}"` : ''}
Template atual: ${tplId} — adapte a densidade do texto ao template (impacto = mais curto e visceral; storytelling = mais narrativo; dados = dado primeiro, desenvolvimento depois)
Máximo de ${tplCfg.body_max_lines} linhas por slide.
${memoriaCtx}`

    // ── num_slides: 0 = IA decide ─────────────────────────────────────
    const slidesInstruction = isPreview
      ? `Crie EXATAMENTE 2 slides: o slide 1 (capa, corpo vazio) e o slide 2 (primeiro slide de conteúdo, com título e corpo). Não retorne mais nada além desses 2 slides — é uma prévia da ideia.`
      : seedSlides.length > 0
        ? `Os ${seedSlides.length} primeiros slides JÁ ESTÃO ESCRITOS e NÃO devem ser reescritos:\n${seedSlides.map(s => `Slide ${s.position}: "${s.titulo}"${s.corpo ? ` — ${s.corpo}` : ' (capa, corpo vazio)'}`).join('\n')}\nContinue a narrativa a partir do slide ${seedSlides.length + 1}${num_slides ? ` até completar ${num_slides} slides no total` : ''}, mantendo exatamente a mesma voz, tom e arco. Retorne SOMENTE os slides a partir do slide ${seedSlides.length + 1} (não inclua os já escritos).`
        : num_slides === 0
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
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: [
          { type: 'text', text: systemStatic, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: systemDynamic },
        ],
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
    const tokensUsed = (claudeData.usage?.input_tokens ?? 0) + (claudeData.usage?.cache_creation_input_tokens ?? 0) + (claudeData.usage?.cache_read_input_tokens ?? 0) + (claudeData.usage?.output_tokens ?? 0)

    // ── Parse JSON retornado ──────────────────────────────────────────
    let parsed: { slides: Array<{ position: number; titulo: string; corpo: string }>; legenda: string }
    try {
      const clean = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('JSON parse error. Raw:', rawContent)
      return json({ error: 'invalid_claude_response', raw: rawContent }, 502)
    }

    // ── Custo estimado (Sonnet 4.6: $3 in / $15 out por M; cache: write 1.25x, read 0.1x) ──
    const inputTokens   = claudeData.usage?.input_tokens ?? 0
    const outputTokens  = claudeData.usage?.output_tokens ?? 0
    const cacheWriteTok = claudeData.usage?.cache_creation_input_tokens ?? 0
    const cacheReadTok  = claudeData.usage?.cache_read_input_tokens ?? 0
    const costUsd = (inputTokens * 3 + cacheWriteTok * 3 * 1.25 + cacheReadTok * 3 * 0.1 + outputTokens * 15) / 1_000_000
    const costBrl = costUsd * 5.8

    // ── Modo PREVIEW: salva no cache, NÃO persiste carrossel nem cota ──
    if (isPreview) {
      const previewSlides = parsed.slides.slice(0, 2)
      await supabase.from('topic_previews').upsert({
        user_id:     userId,
        tema,
        tom:         tom ?? null,
        template_id: tplId,
        slides:      previewSlides,
        created_at:  new Date().toISOString(),
      }, { onConflict: 'user_id,tema' })

      await supabase.from('usage_logs').insert({
        user_id: userId, action: 'preview_carousel', tokens_used: tokensUsed, cost_brl: costBrl,
      })

      return json({ slides: previewSlides, tom: tom ?? null, template_id: tplId })
    }

    // ── Modo SEED: prepende os 2 slides da prévia (verbatim) à continuação ──
    if (seedSlides.length > 0) {
      let cont = parsed.slides
      // Se a IA repetiu os slides já escritos, descarta a sobreposição
      if (cont.length > 0 && cont[0].titulo.trim() === seedSlides[0].titulo.trim()) {
        cont = cont.slice(seedSlides.length)
      }
      parsed.slides = [
        ...seedSlides.map((s, i) => ({ position: i + 1, titulo: s.titulo, corpo: s.corpo })),
        ...cont.map((s, i) => ({ position: seedSlides.length + 1 + i, titulo: s.titulo, corpo: s.corpo })),
      ]
    }

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
