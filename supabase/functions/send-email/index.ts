import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Templates HTML ────────────────────────────────────────────────────────────

function templateWelcome(name: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Bem-vindo ao ConteúdOS</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#080808;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
        <span style="font-size:28px;font-weight:900;color:#C8FF00;letter-spacing:2px;">CONTEÚDOS</span>
        <p style="color:#888;font-size:13px;margin:4px 0 0;">Carrosseis virais com IA para Instagram</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:40px;">
        <h1 style="font-size:24px;color:#111;margin:0 0 16px;">Olá, ${name}! Seja bem-vindo 🎯</h1>
        <p style="font-size:16px;color:#444;line-height:1.7;margin:0 0 16px;">
          Sua conta está pronta. Você agora tem acesso ao ConteúdOS — a plataforma que transforma seu conhecimento em carrosseis que viram, de verdade.
        </p>
        <p style="font-size:16px;color:#444;line-height:1.7;margin:0 0 24px;">
          Com o plano gratuito você pode:
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
          <tr><td style="padding:6px 0;font-size:15px;color:#222;">✅ Gerar carrosseis com IA</td></tr>
          <tr><td style="padding:6px 0;font-size:15px;color:#222;">✅ Usar templates virais prontos</td></tr>
          <tr><td style="padding:6px 0;font-size:15px;color:#222;">✅ Visualizar seu tabuleiro de conteúdo</td></tr>
          <tr><td style="padding:6px 0;font-size:15px;color:#222;">✅ 3 imagens IA por mês</td></tr>
        </table>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td align="center">
            <a href="https://app.conteudos.tech" style="display:inline-block;background:#C8FF00;color:#080808;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.5px;">
              Acessar o ConteúdOS →
            </a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
        <p style="font-size:13px;color:#999;margin:0;">
          Você está recebendo este e-mail porque criou uma conta no ConteúdOS.<br/>
          <a href="https://conteudos.tech" style="color:#C8FF00;text-decoration:none;">conteudos.tech</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

const PLAN_NAMES: Record<string, string> = {
  construtor: 'Construtor',
  escala:     'Escala',
  agencia:    'Agência',
}

const PLAN_BENEFITS: Record<string, string[]> = {
  construtor: ['30 carrosseis/mês', 'Exportação ilimitada', '20 imagens IA/mês', 'Sem marca d\'água'],
  escala:     ['100 carrosseis/mês', 'Calendário editorial', 'Notificações Telegram', '60 imagens IA/mês'],
  agencia:    ['Carrosseis ilimitados', '5 subcontas', 'Suporte prioritário', '200 imagens IA/mês'],
}

function templateUpgrade(name: string, plan: string): string {
  const planName = PLAN_NAMES[plan] ?? plan
  const benefits = PLAN_BENEFITS[plan] ?? []

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Plano ${planName} ativo!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#080808;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
        <span style="font-size:28px;font-weight:900;color:#C8FF00;letter-spacing:2px;">CONTEÚDOS</span>
        <p style="color:#888;font-size:13px;margin:4px 0 0;">Carrosseis virais com IA para Instagram</p>
      </td></tr>

      <!-- Badge do plano -->
      <tr><td style="background:#C8FF00;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#080808;text-transform:uppercase;letter-spacing:1px;">Plano ativado</p>
        <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#080808;">${planName} ✅</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:40px;">
        <h1 style="font-size:22px;color:#111;margin:0 0 16px;">Boa, ${name}! Seu upgrade está confirmado.</h1>
        <p style="font-size:16px;color:#444;line-height:1.7;margin:0 0 24px;">
          O plano <strong>${planName}</strong> foi ativado na sua conta. A partir de agora você tem acesso a tudo isso:
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
          ${benefits.map(b => `<tr><td style="padding:6px 0;font-size:15px;color:#222;">✅ ${b}</td></tr>`).join('')}
        </table>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td align="center">
            <a href="https://app.conteudos.tech" style="display:inline-block;background:#C8FF00;color:#080808;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.5px;">
              Abrir o ConteúdOS →
            </a>
          </td></tr>
        </table>
        <p style="font-size:14px;color:#888;margin:32px 0 0;text-align:center;">
          Dúvidas? Responda este e-mail ou fale no suporte.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
        <p style="font-size:13px;color:#999;margin:0;">
          Cobrança gerenciada pela Cakto. Em caso de problemas, acesse<br/>
          <a href="https://conteudos.tech" style="color:#C8FF00;text-decoration:none;">conteudos.tech</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ─── Handler principal ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const resendKey  = Deno.env.get('RESEND_API_KEY')  ?? ''
  const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL') ?? 'ConteúdOS <oi@conteudos.tech>'

  if (!resendKey) {
    console.error('[send-email] RESEND_API_KEY não configurado')
    return json({ error: 'email_not_configured' }, 500)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let body: { type: string; email: string; name?: string; plan?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const { type, email, name, plan } = body

  if (!type || !email || !email.includes('@')) {
    return json({ error: 'missing_fields' }, 400)
  }

  // ── Valida que o email existe em profiles (proteção contra spam) ─────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('display_name, plan, created_at')
    .eq('email', email)
    .single()

  if (profileErr || !profile) {
    console.warn('[send-email] email não encontrado em profiles:', email)
    return json({ ok: true, skipped: 'user_not_found' })
  }

  const recipientName = name ?? profile.display_name ?? email.split('@')[0]

  let subject: string
  let html: string

  if (type === 'welcome') {
    // Só envia se profile foi criado há menos de 15 minutos (evita re-envio)
    const ageMs = Date.now() - new Date(profile.created_at).getTime()
    if (ageMs > 15 * 60 * 1000) {
      console.log('[send-email] welcome pulado — profile antigo:', email)
      return json({ ok: true, skipped: 'profile_too_old' })
    }
    subject = 'Bem-vindo ao ConteúdOS 🎯'
    html    = templateWelcome(recipientName)

  } else if (type === 'upgrade') {
    const targetPlan = plan ?? profile.plan
    if (!targetPlan || targetPlan === 'free') {
      return json({ ok: true, skipped: 'plan_is_free' })
    }
    const planLabel = PLAN_NAMES[targetPlan] ?? targetPlan
    subject = `Seu plano ${planLabel} está ativo ✅`
    html    = templateUpgrade(recipientName, targetPlan)

  } else {
    return json({ error: 'unknown_type' }, 400)
  }

  // ── Envia via Resend ─────────────────────────────────────────────────────
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[send-email] Resend error:', data)
      return json({ error: 'resend_error', detail: data }, 502)
    }

    console.log(`[send-email] enviado (${type}) para ${email}, id:`, data.id)
    return json({ ok: true, id: data.id })

  } catch (e) {
    console.error('[send-email] exceção:', e)
    return json({ error: 'send_failed', detail: String(e) }, 500)
  }
})
