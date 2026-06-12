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
        .limit(10),
    ])

    const profile = profileRes.data ?? {}
    const niche = (profile as Record<string, unknown>).niche as string ?? 'empreendedorismo'
    const vp = ((profile as Record<string, unknown>).voice_profile ?? {}) as Record<string, unknown>

    const tomVoz = (vp.tom_extraido as string) || (vp.tom as string) || 'direto e provocador'
    const personalidade = (vp.personalidade as string) || ''
    const palavrasChave = Array.isArray(vp.palavras_chave)
      ? (vp.palavras_chave as string[]).join(', ')
      : ''

    const temasRecentes = ((recentRes.data ?? []) as Array<{ tema: string }>)
      .map((c) => c.tema)
      .filter(Boolean)

    const memoriaCtx = temasRecentes.length
      ? `\nTEMAS JÁ POSTADOS (não repetir, nem ângulo similar): ${temasRecentes.map((t, i) => `${i + 1}. "${t}"`).join('; ')}`
      : ''

    // ── System prompt ─────────────────────────────────────────────────
    const systemPrompt = `Você é um estrategista de pauta para Instagram no mercado brasileiro. Seu trabalho é gerar ideias de carrossel que param o scroll, geram salvamento e fazem o criador se sentir representado no tema sugerido.

Retorne APENAS JSON válido. Sem markdown. Sem explicação.`

    const userPrompt = `Gere 10 ideias de carrossel para o seguinte criador:

Nicho: ${niche}
Tom de voz: ${tomVoz}
${personalidade ? `Personalidade: ${personalidade}` : ''}
${palavrasChave ? `Palavras-chave do posicionamento: ${palavrasChave}` : ''}
${memoriaCtx}

REGRAS:
- Cada ideia precisa ter um ângulo específico, não genérico. "Os erros de iniciantes" é genérico. "O erro que cometi no mês 3 que me fez perder 200 seguidores em um dia" é específico.
- O titulo é o tema completo como será passado para geração (2 a 15 palavras). Não é o título do slide — é o assunto a ser desenvolvido em carrossel.
- O hook é uma prévia de como ficaria o título da capa (máximo 6 palavras, cria lacuna cognitiva, sem ponto final).
- O tipo classifica a psicologia por trás do hook. Escolha um: curiosity_gap, pattern_interrupt, identity_mirror, revelation, social_proof, urgency.
- Os temas devem variar entre os 6 tipos para cobrir diferentes emoções do feed.
- Nunca use título com "Como", "Dicas", "Aprenda", "Descubra", "X motivos".
- Nunca sugira algo semelhante ao que já foi postado (lista acima).

Retorne este JSON exato:
{
  "temas": [
    { "titulo": "string com o tema completo", "hook": "string do hook da capa (max 6 palavras)", "tipo": "curiosity_gap|pattern_interrupt|identity_mirror|revelation|social_proof|urgency" }
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
        max_tokens: 1024,
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

    let parsed: { temas: Array<{ titulo: string; hook: string; tipo: string }> }
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
