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

// ── Google News RSS — sem API key, notícias reais em pt-BR ───────────
async function fetchGoogleNews(niche: string): Promise<string> {
  try {
    const q = encodeURIComponent(`${niche} Brasil`)
    const url = `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConteudOS/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return ''

    const xml = await res.text()
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

    const headlines: string[] = []
    for (const item of items.slice(0, 8)) {
      const rawTitle = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, '')
        ?.replace(/&amp;/g, '&')
        ?.replace(/&lt;/g, '<')
        ?.replace(/&gt;/g, '>')
        ?.replace(/&quot;/g, '"')
        ?.trim()
      // Remove " - Nome da Fonte" no final
      const title = rawTitle?.replace(/\s*-\s*[^-]{2,40}$/, '').trim()

      const pubRaw = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim()
      const date = pubRaw
        ? new Date(pubRaw).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : ''

      if (title && title.length > 10) {
        headlines.push(`- ${title}${date ? ` (${date})` : ''}`)
      }
    }

    if (headlines.length === 0) return ''
    return `\nNOTÍCIAS REAIS EM ALTA AGORA (fonte: Google News — use como gancho ou contexto real):\n${headlines.join('\n')}`
  } catch {
    return ''
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) return json({ error: 'unauthorized' }, 401)

    // ── Busca perfil + últimos temas + avaliados em paralelo ──────────
    const [profileRes, recentRes, perfRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('niche, voice_profile')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('carousels')
        .select('tema')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('carousels')
        .select('tema, tom, performance')
        .eq('user_id', user.id)
        .in('performance', ['alto', 'baixo'])
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const profile = profileRes.data ?? {}
    const niche = (profile as Record<string, unknown>).niche as string ?? 'empreendedorismo'
    const vp = ((profile as Record<string, unknown>).voice_profile ?? {}) as Record<string, unknown>

    const tomVoz = (vp.tom_extraido as string) || (vp.tom as string) || 'direto e provocador'
    const personalidade = (vp.personalidade as string) || ''
    const oQueIrrita = (vp.o_que_irrita as string) || ''
    const palavrasChave = Array.isArray(vp.palavras_chave)
      ? (vp.palavras_chave as string[]).join(', ')
      : ''
    const angulos = Array.isArray(vp.angulos) ? (vp.angulos as string[]) : []
    const comoConectar = (vp.como_conectar as string) || ''

    // ── Busca notícias em paralelo com processamento de dados ─────────
    const newsCtx = await fetchGoogleNews(niche)
    const hasNews = newsCtx.length > 0

    const ANGULO_LABELS: Record<string, string> = {
      tendencias: 'tendência ou padrão comportamental quente no nicho — ancore em notícia real se disponível',
      historico:  'personagem histórico ou figura amplamente conhecida como analogia atemporal',
      dados:      'dado ou estatística real que choca — extraia de notícia se disponível, nunca invente',
      noticias:   'notícia real linkada ao nicho — use APENAS fatos da lista de notícias fornecida',
      revelacao:  'revelação contraintuitiva — o oposto do que o mercado tradicional diz',
      provocacao: 'provocação e polêmica — questionar crenças estabelecidas no nicho',
      caso_real:  'caso real ou situação plausível — sem inventar nomes, empresas ou números falsos',
      bastidor:   'bastidor e processo pessoal do criador',
    }
    const angulosCtx = angulos.length > 0
      ? `\nÂNGULOS DE GANCHO QUE O CRIADOR PREFERE USAR:\n${angulos.map(a => `- ${ANGULO_LABELS[a] ?? a}`).join('\n')}\nPrioritize esses ângulos. Distribua entre eles nas 10 ideias.`
      : ''
    const conectarCtx = comoConectar
      ? `\nCOMO ELE CONECTA OS TEMAS AO SEU PRODUTO/POSICIONAMENTO: "${comoConectar}"\nCada pauta sugerida deve ter um ângulo natural para essa conexão.`
      : ''

    const temasRecentes = ((recentRes.data ?? []) as Array<{ tema: string }>)
      .map((c) => c.tema)
      .filter(Boolean)

    const memoriaCtx = temasRecentes.length
      ? `\nTEMAS JÁ POSTADOS (não repetir nem ângulo similar):\n${temasRecentes.map((t, i) => `${i + 1}. "${t}"`).join('\n')}`
      : ''

    // ── Aprendizado de performance: vencedores e fracos avaliados ─────
    const avaliados = ((perfRes.data ?? []) as Array<{ tema: string; tom: string | null; performance: string }>)
    const vencedores = avaliados.filter((c) => c.performance === 'alto' && c.tema)
    const fracos = avaliados.filter((c) => c.performance === 'baixo' && c.tema)

    const vencedoresCtx = vencedores.length
      ? `\nTEMAS QUE BOMBARAM (este criador validou que funcionam — replique o ÂNGULO, o gatilho psicológico e o tom que fizeram engajar, NUNCA o tema literal):\n${vencedores.map((c, i) => `${i + 1}. "${c.tema}"${c.tom ? ` (tom: ${c.tom})` : ''}`).join('\n')}\nAo distribuir os 6 tipos nas 10 ideias, favoreça o padrão psicológico desses vencedores.`
      : ''

    const fracosCtx = fracos.length
      ? `\nTEMAS QUE NÃO ENGAJARAM (evite repetir esse ângulo, gatilho e tom — não funcionaram com esta audiência):\n${fracos.map((c, i) => `${i + 1}. "${c.tema}"${c.tom ? ` (tom: ${c.tom})` : ''}`).join('\n')}`
      : ''

    // ── System prompt ─────────────────────────────────────────────────
    const systemPrompt = `Você é um estrategista de conteúdo sênior especializado em carrosseis virais para Instagram no Brasil. Você conhece profundamente psicologia de feed, gatilhos de salvamento e o que faz um criador de nicho crescer organicamente.

${hasNews
  ? 'Você recebeu notícias REAIS e atuais do Google News. Use-as como gancho ou contexto quando fizer sentido para o nicho. Cite o fato real — não invente detalhes além do que está na lista.'
  : 'Sugira temas atemporais ou padrões do nicho que funcionem independentemente de quando forem publicados. Nunca invente notícias, datas ou eventos específicos.'
}

Retorne APENAS JSON válido. Sem markdown. Sem texto fora do JSON.`

    const userPrompt = `Gere 10 ideias de carrossel para este criador:

NICHO: ${niche}
TOM DE VOZ: ${tomVoz}
${personalidade ? `PERSONALIDADE: ${personalidade}` : ''}
${palavrasChave ? `POSICIONAMENTO (palavras que usa): ${palavrasChave}` : ''}
${oQueIrrita ? `O QUE ELE ACHA QUE O MERCADO ERRA (use como ângulo ou ponto de vista): "${oQueIrrita}"` : ''}
${angulosCtx}
${conectarCtx}
${newsCtx}
${memoriaCtx}
${vencedoresCtx}
${fracosCtx}

REGRAS OBRIGATÓRIAS:
1. ESPECIFICIDADE: Cada ideia precisa de ângulo específico e situacional. RUIM: "Os erros de iniciantes". BOM: "O erro silencioso que fez meu negócio estagnar por 8 meses sem eu perceber".
2. HOOK (título da capa): máx 8 palavras, cria lacuna cognitiva forte, termina sem ponto final. Deve causar curiosidade imediata ou reconhecimento doloroso.
3. TITULO: o tema completo que será desenvolvido em carrossel (10 a 20 palavras). É o briefing para a IA gerar o conteúdo — deve ser rico, específico e contextualizado.
4. CONTEXTO: 1 frase (máx 18 palavras) explicando por que esse tema para o scroll AGORA — qual dor, desejo ou crença ele ativa nesse nicho.
5. TIPO: classifica a psicologia: curiosity_gap | pattern_interrupt | identity_mirror | revelation | social_proof | urgency
6. VARIEDADE: use os 6 tipos distribuídos nas 10 ideias. Não repita tipo mais de 2x seguidas.
7. PROIBIDO: títulos com "Como", "Dicas para", "Aprenda", "Descubra", "X motivos que". São genéricos demais.
8. Nunca sugira algo com ângulo similar ao que já foi postado (lista acima).
${hasNews ? '9. Para temas baseados em notícia real: inclua no titulo o fato específico da notícia. O criador vai linkar aquele evento ao seu nicho/posicionamento.' : ''}

Retorne este JSON exato:
{
  "temas": [
    {
      "titulo": "tema completo e rico para briefing da IA (10-20 palavras)",
      "hook": "manchete da capa provocativa (max 8 palavras)",
      "contexto": "por que para o scroll nesse nicho (max 18 palavras)",
      "tipo": "curiosity_gap|pattern_interrupt|identity_mirror|revelation|social_proof|urgency"
    }
  ]
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Claude error:', err)
      return json({ error: 'claude_error' }, 502)
    }

    const claudeData = await res.json()
    const raw = claudeData.content?.[0]?.text ?? ''

    let parsed: { temas: Array<{ titulo: string; hook: string; contexto: string; tipo: string }> }
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('Parse error. Raw:', raw)
      return json({ error: 'parse_error', raw }, 502)
    }

    return json({ ...parsed, _news: hasNews })

  } catch (err) {
    console.error('Unhandled:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
