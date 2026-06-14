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

    // ── Busca perfil + últimos temas usados em paralelo ──────────────
    const [profileRes, recentRes] = await Promise.all([
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

    const ANGULO_LABELS: Record<string, string> = {
      tendencias: 'tendências e assuntos virais da semana no Brasil',
      historico:  'personagens históricos ou figuras famosas como gancho de entrada',
      dados:      'dados, estatísticas e fatos chocantes que param o scroll',
      noticias:   'notícias e eventos recentes linkados ao nicho',
      revelacao:  'revelação contraintuitiva — o oposto do que o mercado tradicional diz',
      provocacao: 'provocação e polêmica — questionar crenças estabelecidas no nicho',
      caso_real:  'casos reais com resultados concretos e números',
      bastidor:   'bastidor e processo pessoal do criador',
    }
    const angulosCtx = angulos.length > 0
      ? `\nÂNGULOS DE GANCHO QUE O CRIADOR PREFERE USAR:\n${angulos.map(a => `- ${ANGULO_LABELS[a] ?? a}`).join('\n')}\nPrioritize esses ângulos na geração. Distribua entre eles nas 10 ideias.`
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

    // ── System prompt ─────────────────────────────────────────────────
    const systemPrompt = `Você é um estrategista de conteúdo sênior especializado em carrosseis virais para Instagram no Brasil. Você conhece profundamente psicologia de feed, gatilhos de salvamento e o que faz um criador de nicho crescer organicamente.

Retorne APENAS JSON válido. Sem markdown. Sem texto fora do JSON.`

    const userPrompt = `Gere 10 ideias de carrossel para este criador:

NICHO: ${niche}
TOM DE VOZ: ${tomVoz}
${personalidade ? `PERSONALIDADE: ${personalidade}` : ''}
${palavrasChave ? `POSICIONAMENTO (palavras que usa): ${palavrasChave}` : ''}
${oQueIrrita ? `O QUE ELE ACHA QUE O MERCADO ERRA (use como ângulo ou ponto de vista): "${oQueIrrita}"` : ''}
${angulosCtx}
${conectarCtx}
${memoriaCtx}

REGRAS OBRIGATÓRIAS:
1. ESPECIFICIDADE: Cada ideia precisa de ângulo específico e situacional. RUIM: "Os erros de iniciantes". BOM: "O erro silencioso que fez meu negócio estagnar por 8 meses sem eu perceber".
2. HOOK (título da capa): máx 8 palavras, cria lacuna cognitiva forte, termina sem ponto final. Deve causar curiosidade imediata ou reconhecimento doloroso.
3. TITULO: o tema completo que será desenvolvido em carrossel (10 a 20 palavras). É a briefing para a IA gerar o conteúdo — deve ser rico, específico e contextualizado.
4. CONTEXTO: 1 frase (máx 18 palavras) explicando por que esse tema para o scroll AGORA — qual dor, desejo ou crença ele ativa nesse nicho.
5. TIPO: classifica a psicologia: curiosity_gap | pattern_interrupt | identity_mirror | revelation | social_proof | urgency
6. VARIEDADE: use os 6 tipos distribuídos nas 10 ideias. Não repita tipo mais de 2x seguidas.
7. PROIBIDO: títulos com "Como", "Dicas para", "Aprenda", "Descubra", "X motivos que". São genéricos demais.
8. Nunca sugira algo com ângulo similar ao que já foi postado (lista acima).

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

    return json(parsed)

  } catch (err) {
    console.error('Unhandled:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
