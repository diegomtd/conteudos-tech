import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { texto, niche } = await req.json() as { texto: string; niche?: string }

    if (!texto?.trim() || texto.trim().length < 30) {
      return json({ error: 'texto_too_short' }, 400)
    }

    const systemPrompt = `Você é um especialista em análise de voz de marca pessoal para criadores de conteúdo brasileiros.
Dado um texto escrito por um criador, extraia o DNA da escrita dele de forma precisa e específica.
Responda APENAS com JSON válido, sem markdown, sem explicação.`

    const userPrompt = `Analise o texto abaixo e extraia o perfil de voz do criador.
Nicho: ${niche ?? 'não informado'}

TEXTO:
"""
${texto.substring(0, 1500)}
"""

Retorne este JSON exato:
{
  "tom": "descrição em até 20 palavras do tom real detectado — específico, não genérico. Ex: 'direto e cru, com humor sutil, fala como quem já errou e aprendeu'",
  "ritmo": "descrição do ritmo e estrutura das frases. Ex: 'frases curtas que respiram, poucas vírgulas, sem rodeios'",
  "expressoes_marcantes": ["array com até 6 expressões, gírias ou padrões linguísticos reais detectados no texto ou consistentes com esse estilo"],
  "o_que_evitar": ["array com até 5 padrões que NÃO aparecem no texto e que quebraria a voz — frases corporativas, coaching language, etc"],
  "personalidade": "uma frase que captura a personalidade por trás da escrita — como esse criador se posiciona no mundo"
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
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Claude error:', err)
      return json({ error: 'claude_error' }, 502)
    }

    const data = await res.json()
    const raw = data.content?.[0]?.text ?? ''

    let parsed: {
      tom: string
      ritmo: string
      expressoes_marcantes: string[]
      o_que_evitar: string[]
      personalidade: string
    }

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
