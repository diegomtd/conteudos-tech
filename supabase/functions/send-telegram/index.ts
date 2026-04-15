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
    // ── Auth ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'missing_authorization' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'invalid_token' }, 401)

    // ── Parse body ────────────────────────────────────────────────────
    const { user_id, message_type, carousel_id, scheduled_at } = await req.json() as {
      user_id: string
      message_type: 'post_reminder' | 'export_ready' | 'limit_warning'
      carousel_id?: string
      scheduled_at?: string
    }

    // ── Busca telegram_chat_id ────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('user_id', user_id)
      .single()

    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404)
    if (!profile.telegram_chat_id) return json({ error: 'telegram_not_configured' }, 400)

    // ── Busca dados do carrossel se necessário ────────────────────────
    let tema = ''
    let previewUrl = ''

    if (carousel_id && (message_type === 'post_reminder' || message_type === 'export_ready')) {
      const { data: carousel } = await supabase
        .from('carousels')
        .select('tema, preview_token')
        .eq('id', carousel_id)
        .single()

      if (carousel) {
        tema = carousel.tema
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!.replace('/rest/v1', '').replace('https://', '')
        previewUrl = `https://conteudos.tech/preview/${carousel.preview_token}`
      }
    }

    // ── Monta mensagem ────────────────────────────────────────────────
    let text = ''

    if (message_type === 'post_reminder') {
      const hora = scheduled_at
        ? new Date(scheduled_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
        : ''
      text = `Hora de postar\n\nTema: ${tema}\nHorário: ${hora}\n\nVer carrossel: ${previewUrl}`
    } else if (message_type === 'export_ready') {
      text = `Carrossel pronto para download\n\nTema: ${tema}`
    } else if (message_type === 'limit_warning') {
      text = `Você usou 80% das exportações deste mês`
    } else {
      return json({ error: 'invalid_message_type' }, 400)
    }

    // ── Envia via Telegram Bot API ────────────────────────────────────
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id,
        text,
        parse_mode: 'HTML',
      }),
    })

    if (!telegramRes.ok) {
      const err = await telegramRes.text()
      console.error('Telegram API error:', err)
      return json({ error: 'telegram_send_failed', detail: err }, 502)
    }

    return json({ success: true })

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
