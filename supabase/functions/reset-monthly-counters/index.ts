import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase
      .from('profiles')
      .update({
        exports_used_this_month:    0,
        ai_images_used_this_month:  0,
      })
      .gte('id', '00000000-0000-0000-0000-000000000000') // filtra todos os registros

    if (error) {
      console.error('[reset-monthly-counters] erro:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    console.log('[reset-monthly-counters] contadores zerados com sucesso')
    return new Response(JSON.stringify({ ok: true }), { status: 200 })

  } catch (err) {
    console.error('[reset-monthly-counters] exceção:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
