import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
  if (!botToken) {
    // Token não configurado ainda — não é erro, apenas aguarda configuração
    console.log('[notify] TELEGRAM_BOT_TOKEN não configurado, pulando')
    return new Response(JSON.stringify({ ok: true, skipped: 'bot_token_not_configured' }), { status: 200 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - 2 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 16 * 60 * 1000)

  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select(`
      id, user_id, carousel_id, tema, scheduled_at, notify_minutes_before,
      profiles!inner(telegram_chat_id, display_name),
      carousels(preview_token, tema)
    `)
    .eq('status', 'pending')
    .eq('telegram_notified', false)
    .gte('scheduled_at', windowStart.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())

  if (error) {
    console.error('[notify] query error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!posts || posts.length === 0) {
    return new Response(JSON.stringify({ ok: true, notified: 0 }), { status: 200 })
  }

  let notified = 0
  const errors: { id: string; error: string }[] = []

  for (const post of posts) {
    const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
    const carousel = Array.isArray(post.carousels) ? post.carousels[0] : post.carousels
    const chatId = profile?.telegram_chat_id

    if (!chatId) continue

    const scheduledTime = new Date(post.scheduled_at)
    const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / 60000)
    const hora = scheduledTime.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    const tema = carousel?.tema ?? post.tema ?? 'seu post'
    const previewUrl = carousel?.preview_token
      ? `https://conteudos.tech/preview/${carousel.preview_token}`
      : null

    const timeLabel = minutesUntil <= 1 ? 'Hora de postar agora' : `${minutesUntil} minutos para postar`

    let text = `🚀 *${timeLabel}*\n\n`
    text += `📝 *Tema:* ${tema}\n`
    text += `🕐 *Horário:* ${hora}\n`
    if (previewUrl) text += `\n👆 [Ver carrossel](${previewUrl})`
    text += `\n\n_Abra o ConteudOS para postar_`

    try {
      const telegramRes = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: false }),
        }
      )

      if (telegramRes.ok) {
        await supabase.from('scheduled_posts').update({ telegram_notified: true }).eq('id', post.id)
        notified++
      } else {
        const err = await telegramRes.text()
        console.error(`[notify] telegram error ${post.id}:`, err)
        errors.push({ id: post.id, error: err })
      }
    } catch (e) {
      console.error(`[notify] exceção ${post.id}:`, e)
      errors.push({ id: post.id, error: String(e) })
    }
  }

  return new Response(
    JSON.stringify({ ok: true, notified, errors: errors.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
