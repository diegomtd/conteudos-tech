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

// Retorna a segunda-feira da semana atual (YYYY-MM-DD)
function getMondayDate(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Dom, 1=Seg ...
  const diff = (day === 0 ? -6 : 1 - day)
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Verifica se há usuários pagos suficientes ─────────────────────
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('plan', 'free')

    if (countError) return json({ error: 'db_error', detail: countError.message }, 500)

    if ((count ?? 0) < 10) {
      return json({ skipped: true, reason: 'not_enough_paid_users', paid_users: count })
    }

    // ── Busca nichos distintos ────────────────────────────────────────
    const { data: profiles, error: nichosError } = await supabase
      .from('profiles')
      .select('niche')
      .not('niche', 'is', null)
      .neq('niche', '')

    if (nichosError) return json({ error: 'db_error', detail: nichosError.message }, 500)

    const nichos = [...new Set((profiles ?? []).map((p) => p.niche).filter(Boolean))] as string[]

    if (nichos.length === 0) return json({ skipped: true, reason: 'no_niches_found' })

    const weekStart = getMondayDate()
    const created: string[] = []

    // ── Gera tendências por nicho ─────────────────────────────────────
    for (const nicho of nichos) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: `Você é um especialista em tendências de conteúdo para Instagram Brasil 2026.
Gere 10 sugestões de temas virais para criadores de conteúdo do nicho ${nicho}.
Considere o que está em alta no Brasil agora: comportamento humano, psicologia, empreendedorismo, questões sociais.

REGRAS:
- Temas diretos e específicos, não genéricos
- Zero travessão, zero ponto de exclamação
- Retorne APENAS um JSON array com strings, sem markdown, sem explicação`,
          messages: [{
            role: 'user',
            content: `Nicho: ${nicho}\nRetorne apenas o JSON array com 10 temas.`,
          }],
        }),
      })

      if (!claudeRes.ok) {
        console.error(`Claude error for nicho ${nicho}:`, await claudeRes.text())
        continue
      }

      const claudeData = await claudeRes.json()
      const rawContent = claudeData.content?.[0]?.text ?? '[]'

      let temas: string[]
      try {
        const clean = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
        temas = JSON.parse(clean)
        if (!Array.isArray(temas)) temas = []
      } catch {
        console.error(`JSON parse error for nicho ${nicho}:`, rawContent)
        continue
      }

      // ── UPSERT em weekly_trends ───────────────────────────────────
      const { error: upsertError } = await supabase
        .from('weekly_trends')
        .upsert(
          { nicho, week_start: weekStart, temas },
          { onConflict: 'nicho,week_start' },
        )

      if (upsertError) {
        console.error(`Upsert error for nicho ${nicho}:`, upsertError)
      } else {
        created.push(nicho)
      }
    }

    return json({ created: created.length, nichos: created, week_start: weekStart })

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
