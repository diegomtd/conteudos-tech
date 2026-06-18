import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Extrai texto de uma URL via fetch simples
async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConteudOS/1.0)' }
    })
    if (!res.ok) return ''
    const html = await res.text()
    // Remove tags HTML e extrai texto puro
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // Limita para nao explodir o contexto do Claude
    return text
  } catch {
    return ''
  }
}

// Detecta tipo de URL
function detectUrlType(url: string): 'youtube' | 'instagram' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('instagram.com')) return 'instagram'
  return 'other'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const base64Url = token.split('.')[1]
    const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')))
    const userId = payload.sub
    if (!userId) return json({ error: 'unauthorized' }, 401)

    const { url, texto } = await req.json() as { url?: string; texto?: string }

    if (!url && !texto) return json({ error: 'url_or_texto_required' }, 400)

    let conteudo = texto ?? ''
    let tipo = 'texto'

    // Se veio URL, tenta extrair o texto
    if (url) {
      tipo = detectUrlType(url)
      console.log('[analyze] tipo:', tipo, 'url:', url)

      if (tipo === 'youtube') {
        // YouTube: extrai titulo e descricao da pagina
        const extracted = await extractTextFromUrl(url)
        const titleMatch = extracted.match(/"title":"([^"]+)"/)
        const descMatch = extracted.match(/"shortDescription":"([^"]+)"/)
        conteudo = [
          titleMatch?.[1] ?? '',
          descMatch?.[1]?.slice(0, 2000) ?? extracted.slice(0, 2000)
        ].filter(Boolean).join('\n\n')
      } else if (tipo === 'instagram') {
        // Instagram: extrai og:description
        const extracted = await extractTextFromUrl(url)
        const ogDesc = extracted.match(/og:description.*?content="([^"]+)"/)
        conteudo = ogDesc?.[1] ?? extracted.slice(0, 2000)
      } else {
        conteudo = await extractTextFromUrl(url)
      }

      if (!conteudo) {
        return json({
          error: 'extraction_failed',
          tema: url,
          hacks: [],
          sugestao: 'Nao foi possivel extrair o conteudo automaticamente. Cole o texto manualmente.',
          manual: true
        })
      }
    }

    // Analisa o conteudo com Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1536,
        system: `Voce e um especialista em psicologia viral e marketing de conteudo para Instagram Brasil.
Analise o conteudo recebido e identifique:
1. O tema central (uma frase curta e direta)
2. Os hacks psicologicos usados (Curiosity Gap, Pattern Interrupt, Identity Mirror, Zeigarnik Effect, Social Proof, etc)
3. Uma sugestao de tema para um carrossel baseado nesse conteudo
4. A ESTRUTURA do conteudo como esqueleto de carrossel: 5 a 8 slides, cada um com o papel (Hook, Contexto, Desenvolvimento, Virada, Prova, CTA, etc) e um resumo curto do que aquele slide faz (max 15 palavras). Esse esqueleto sera reaproveitado para modelar um novo carrossel.

Retorne APENAS JSON valido sem markdown:
{
  "tema": "tema central identificado",
  "hacks": ["hack1", "hack2"],
  "sugestao": "sugestao de tema para carrossel",
  "resumo": "resumo do que torna esse conteudo viral em 1 frase",
  "estrutura": [
    { "papel": "Hook", "resumo": "o que esse slide faz" },
    { "papel": "Contexto", "resumo": "o que esse slide faz" }
  ]
}`,
        messages: [{ role: 'user', content: `Analise este conteudo:\n\n${conteudo.slice(0, 4000)}` }]
      })
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      console.error('[analyze] claude error:', err)
      return json({ error: 'claude_error' }, 502)
    }

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content?.[0]?.text ?? '{}'

    let analysis: Record<string, unknown>
    try {
      const clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      analysis = JSON.parse(clean)
    } catch {
      analysis = { tema: url ?? 'conteudo analisado', hacks: [], sugestao: rawText.slice(0, 200) }
    }

    // Salva na tabela content_analyses
    await supabase.from('content_analyses').insert({
      user_id: userId,
      input_url: url ?? null,
      input_text: texto ?? null,
      analysis_json: analysis
    })

    return json({ success: true, ...analysis })

  } catch (err) {
    console.error('[analyze] unhandled:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
