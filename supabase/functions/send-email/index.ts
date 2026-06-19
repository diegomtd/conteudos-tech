import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Cores e estilos do sistema ───────────────────────────────────────────────
// BG=#080808 | Accent=#C8FF00 | Texto=#FFFFFF | Muted=#888888
// Fontes: Impact (fallback de Bebas Neue) | Arial (fallback de DM Sans)

const S = {
  wrap:    'margin:0;padding:0;background:#080808;font-family:Arial,Helvetica,sans-serif;',
  outer:   'background:#080808;padding:48px 16px;',
  card:    'max-width:580px;width:100%;margin:0 auto;background:#0F0F0F;border-radius:16px;border:1px solid #1E1E1E;overflow:hidden;',
  header:  'background:#080808;padding:32px 40px 24px;border-bottom:1px solid #1E1E1E;text-align:center;',
  logo:    'font-family:Impact,"Arial Black",Arial,sans-serif;font-size:32px;font-weight:900;color:#C8FF00;letter-spacing:4px;margin:0;',
  tagline: 'font-size:12px;color:#555;margin:6px 0 0;letter-spacing:1px;text-transform:uppercase;',
  body:    'padding:40px;',
  h1:      'font-family:Impact,"Arial Black",Arial,sans-serif;font-size:26px;color:#FFFFFF;margin:0 0 16px;letter-spacing:1px;line-height:1.2;',
  p:       'font-size:15px;color:#AAAAAA;line-height:1.75;margin:0 0 20px;',
  label:   'font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;',
  item:    'padding:12px 16px;margin:0 0 8px;background:#141414;border-radius:8px;border-left:3px solid #C8FF00;font-size:14px;color:#DDDDDD;',
  cta:     'display:inline-block;background:#C8FF00;color:#080808;font-family:Impact,"Arial Black",Arial,sans-serif;font-size:16px;font-weight:900;letter-spacing:2px;text-decoration:none;padding:16px 48px;border-radius:8px;text-transform:uppercase;',
  footer:  'background:#080808;padding:24px 40px;border-top:1px solid #1E1E1E;text-align:center;',
  ftext:   'font-size:12px;color:#444;margin:0;line-height:1.8;',
  flink:   'color:#C8FF00;text-decoration:none;',
  badge:   'display:inline-block;background:#C8FF00;color:#080808;font-family:Impact,"Arial Black",Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:2px;padding:4px 12px;border-radius:4px;text-transform:uppercase;margin:0 0 24px;',
}

// ─── Template: Boas-vindas ────────────────────────────────────────────────────
function templateWelcome(name: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/>
<title>Bem-vindo ao ConteudOS</title>
</head>
<body style="${S.wrap}">
<div style="${S.outer}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table cellpadding="0" cellspacing="0" style="${S.card}">

  <!-- Header -->
  <tr><td style="${S.header}">
    <p style="${S.logo}">CONTEUDOS</p>
    <p style="${S.tagline}">Carrosseis virais com IA</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="${S.body}">
    <p style="${S.badge}">Conta criada</p>
    <h1 style="${S.h1}">Bem-vindo, ${name}.</h1>
    <p style="${S.p}">
      Seu acesso está pronto. Agora você consegue criar carrosseis para o Instagram com IA — copy estratégica, design profissional e imagens geradas automaticamente.
    </p>

    <p style="${S.label}">O que você pode fazer agora (plano gratuito):</p>
    <div style="${S.item}">Gerar até 3 carrosseis com IA por mês</div>
    <div style="${S.item}">3 imagens IA de fundo por mês</div>
    <div style="${S.item}">Visualizar e editar todos os slides</div>
    <div style="${S.item}">Exportar como PNG (com marca d'água)</div>

    <p style="${S.p}" style="margin-top:16px;">
      Quer exportar sem marca d'água, gerar mais carrosseis e ter acesso ao calendário editorial? Conheça os planos pagos dentro do app.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="https://app.conteudos.tech" style="${S.cta}">Acessar o app →</a>
    </td></tr></table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="${S.footer}">
    <p style="${S.ftext}">
      Você recebeu este e-mail porque criou uma conta no ConteudOS.<br/>
      <a href="https://conteudos.tech" style="${S.flink}">conteudos.tech</a>
      &nbsp;·&nbsp;
      <a href="mailto:oi@conteudos.tech" style="${S.flink}">oi@conteudos.tech</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</div>
</body>
</html>`
}

// ─── Dados dos planos ─────────────────────────────────────────────────────────
const PLAN_META: Record<string, {
  name: string
  price: string
  color: string
  headline: string
  items: string[]
  note: string
}> = {
  construtor: {
    name:     'Construtor',
    price:    'R$ 47/mês',
    color:    '#C8FF00',
    headline: 'Seu plano Construtor está ativo.',
    items: [
      '50 carrosseis gerados com IA por mês',
      'Exportação PNG sem marca d\'água',
      '20 imagens IA de fundo por mês',
      'Acesso a todos os templates virais',
    ],
    note: 'Ideal para criadores que publicam de 3 a 5 vezes por semana.',
  },
  escala: {
    name:     'Escala',
    price:    'R$ 97/mês',
    color:    '#C8FF00',
    headline: 'Seu plano Escala está ativo.',
    items: [
      '150 carrosseis gerados com IA por mês',
      'Exportação PNG sem marca d\'água',
      '60 imagens IA de fundo por mês',
      'Calendário editorial integrado',
      'Notificações de postagem via Telegram',
    ],
    note: 'Para quem produz conteúdo todos os dias e quer consistência.',
  },
  agencia: {
    name:     'Agência',
    price:    'R$ 197/mês',
    color:    '#C8FF00',
    headline: 'Seu plano Agência está ativo.',
    items: [
      '300 carrosseis gerados com IA por mês',
      'Exportação PNG sem marca d\'água',
      '150 imagens IA de fundo por mês',
      'Calendário editorial integrado',
      'Notificações de postagem via Telegram',
      '3 perfis de cliente separados',
      'Suporte prioritário',
    ],
    note: 'Para agências e produtores que gerenciam múltiplos perfis.',
  },
}

// ─── Template: Confirmação de upgrade ────────────────────────────────────────
function templateUpgrade(name: string, plan: string): string {
  const meta = PLAN_META[plan] ?? {
    name: plan, price: '', color: '#C8FF00',
    headline: `Seu plano ${plan} está ativo.`,
    items: [], note: '',
  }

  const itemsHtml = meta.items
    .map(i => `<div style="${S.item}">${i}</div>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/>
<title>Plano ${meta.name} ativo</title>
</head>
<body style="${S.wrap}">
<div style="${S.outer}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table cellpadding="0" cellspacing="0" style="${S.card}">

  <!-- Header -->
  <tr><td style="${S.header}">
    <p style="${S.logo}">CONTEUDOS</p>
    <p style="${S.tagline}">Carrosseis virais com IA</p>
  </td></tr>

  <!-- Banner do plano -->
  <tr><td style="background:#C8FF00;padding:20px 40px;text-align:center;">
    <p style="margin:0;font-size:11px;font-weight:700;color:#080808;text-transform:uppercase;letter-spacing:3px;">Upgrade confirmado</p>
    <p style="margin:6px 0 0;font-family:Impact,'Arial Black',Arial,sans-serif;font-size:36px;font-weight:900;color:#080808;letter-spacing:2px;">PLANO ${meta.name.toUpperCase()}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#333;">${meta.price} · cobrado pela Cakto</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="${S.body}">
    <h1 style="${S.h1}">Boa, ${name}.<br/>${meta.headline}</h1>
    <p style="${S.p}">
      A partir de agora você tem acesso completo a tudo isso:
    </p>

    <p style="${S.label}">Incluído no seu plano:</p>
    ${itemsHtml}

    ${meta.note ? `<p style="font-size:13px;color:#555;margin:20px 0 32px;font-style:italic;">${meta.note}</p>` : ''}

    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:8px 0 24px;">
      <a href="https://app.conteudos.tech" style="${S.cta}">Abrir o ConteudOS →</a>
    </td></tr></table>

    <p style="${S.p}" style="font-size:13px;color:#555;">
      Dúvidas ou problemas? Responda este e-mail ou fale em <a href="mailto:oi@conteudos.tech" style="color:#C8FF00;">oi@conteudos.tech</a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="${S.footer}">
    <p style="${S.ftext}">
      Cobrança gerenciada pela Cakto. Para cancelar ou alterar o plano,<br/>
      acesse o link de gerenciamento enviado pela Cakto no momento da compra.<br/>
      <a href="https://conteudos.tech" style="${S.flink}">conteudos.tech</a>
      &nbsp;·&nbsp;
      <a href="mailto:oi@conteudos.tech" style="${S.flink}">oi@conteudos.tech</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</div>
</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const resendKey = Deno.env.get('RESEND_API_KEY')  ?? ''
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'ConteudOS <oi@conteudos.tech>'

  if (!resendKey) {
    console.error('[send-email] RESEND_API_KEY nao configurado')
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

  // Valida que o email existe em profiles (proteção contra spam)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('display_name, plan, created_at')
    .eq('email', email)
    .single()

  if (profileErr || !profile) {
    console.warn('[send-email] email nao encontrado em profiles:', email)
    return json({ ok: true, skipped: 'user_not_found' })
  }

  const recipientName = name ?? profile.display_name ?? email.split('@')[0]

  let subject: string
  let html: string

  if (type === 'welcome') {
    const ageMs = Date.now() - new Date(profile.created_at).getTime()
    if (ageMs > 15 * 60 * 1000) {
      return json({ ok: true, skipped: 'profile_too_old' })
    }
    subject = 'Bem-vindo ao ConteudOS — seu acesso esta pronto'
    html    = templateWelcome(recipientName)

  } else if (type === 'upgrade') {
    const targetPlan = plan ?? profile.plan
    if (!targetPlan || targetPlan === 'free') {
      return json({ ok: true, skipped: 'plan_is_free' })
    }
    const meta = PLAN_META[targetPlan]
    subject = meta
      ? `Plano ${meta.name} ativo — bem-vindo ao proximo nivel`
      : `Seu plano ${targetPlan} esta ativo`
    html = templateUpgrade(recipientName, targetPlan)

  } else {
    return json({ error: 'unknown_type' }, 400)
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
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
    console.error('[send-email] excecao:', e)
    return json({ error: 'send_failed', detail: String(e) }, 500)
  }
})
