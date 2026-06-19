import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Limites por plano — espelho do banco (migration 20260513)
const PLAN_LIMITS: Record<string, { exports_limit: number; ai_images_limit: number }> = {
  construtor: { exports_limit: 999999, ai_images_limit: 20  },
  escala:     { exports_limit: 999999, ai_images_limit: 60  },
  agencia:    { exports_limit: 999999, ai_images_limit: 200 },
}

const FREE_LIMITS = { exports_limit: 0, ai_images_limit: 3 }

// Eventos que cancelam a assinatura e rebaixam para free
const CANCEL_EVENTS = new Set([
  'order.refunded',
  'order.cancelled',
  'order.chargedback',
  'subscription.cancelled',
  'subscription.expired',
  'subscription.overdue',
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  try {
    // ── 1. Valida token ──────────────────────────────────────────────
    const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET') ?? ''
    const incomingToken = req.headers.get('x-kiwify-token') ?? ''

    if (!webhookSecret || incomingToken !== webhookSecret) {
      console.error('[cakto] token inválido')
      return json({ error: 'unauthorized' }, 401)
    }

    // ── 2. Parse ─────────────────────────────────────────────────────
    const body = await req.json() as {
      event:     string
      event_id?: string
      data: {
        customer: { email: string }
        product:  { id: string }
        order?:   { id: string }
      }
    }

    const event     = body.event
    const email     = body.data?.customer?.email?.toLowerCase().trim()
    const productId = body.data?.product?.id
    const eventId   = body.event_id ?? body.data?.order?.id ?? null

    if (!email) return json({ error: 'missing_email' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 3. Idempotência — rejeita evento duplicado ───────────────────
    if (eventId) {
      const { error: dupError } = await supabase
        .from('webhook_events')
        .insert({ event_id: eventId, event_type: event, email })

      if (dupError?.code === '23505') {
        console.log('[cakto] evento duplicado ignorado:', eventId)
        return json({ ok: true, skipped: 'duplicate' })
      }
    }

    // ── 4. Lookup rápido do user_id (O(1) via index em auth.users) ───
    const { data: userId, error: uidError } = await supabase
      .rpc('get_uid_by_email', { p_email: email })

    if (uidError || !userId) {
      // Usuário pode não ter se cadastrado ainda — não reenviar
      console.warn('[cakto] usuário não encontrado:', email)
      return json({ ok: true, warning: 'user_not_found' })
    }

    // ── 5. Cancelamento / reembolso → rebaixa para free ─────────────
    if (CANCEL_EVENTS.has(event)) {
      const { error } = await supabase
        .from('profiles')
        .update({
          plan:                'free',
          exports_limit:       FREE_LIMITS.exports_limit,
          ai_images_limit:     FREE_LIMITS.ai_images_limit,
          subscription_source: 'webhook_cancel',
        })
        .eq('user_id', userId)

      if (error) {
        console.error('[cakto] erro ao rebaixar plano:', error)
        return json({ error: 'db_update_error' }, 500)
      }

      console.log(`[cakto] rebaixado para free: ${email} (evento: ${event})`)
      return json({ ok: true, action: 'downgraded_to_free' })
    }

    // ── 6. Ignora eventos que não sejam aprovação ────────────────────
    if (event !== 'order.approved') {
      console.log('[cakto] evento ignorado:', event)
      return json({ ok: true, skipped: true })
    }

    if (!productId) return json({ error: 'missing_product_id' }, 400)

    // ── 7. Mapeia product_id → plano ─────────────────────────────────
    const pConstrutor          = Deno.env.get('CAKTO_PRODUCT_CONSTRUTOR')   ?? ''
    const pEscala              = Deno.env.get('CAKTO_PRODUCT_ESCALA')       ?? ''
    const pAgencia             = Deno.env.get('CAKTO_PRODUCT_AGENCIA')      ?? ''
    const pCriadorLegacy       = Deno.env.get('CAKTO_PRODUCT_CRIADOR')      ?? ''
    const pProfissionalLegacy  = Deno.env.get('CAKTO_PRODUCT_PROFISSIONAL') ?? ''

    let plan: string | null = null
    if (productId === pConstrutor  || productId === pCriadorLegacy)       plan = 'construtor'
    if (productId === pEscala      || productId === pProfissionalLegacy)  plan = 'escala'
    if (productId === pAgencia)                                            plan = 'agencia'

    if (!plan) {
      console.error('[cakto] product_id não mapeado:', productId)
      return json({ error: 'unknown_product', product_id: productId }, 400)
    }

    // ── 8. Atualiza plano no profiles ─────────────────────────────────
    const limits = PLAN_LIMITS[plan]
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan,
        exports_limit:       limits.exports_limit,
        ai_images_limit:     limits.ai_images_limit,
        subscription_source: 'webhook',
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('[cakto] erro ao atualizar profile:', updateError)
      return json({ error: 'db_update_error' }, 500)
    }

    console.log(`[cakto] plano ativado: ${email} → ${plan}`)
    return json({ ok: true, plan })

  } catch (err) {
    console.error('[cakto] exceção não tratada:', err)
    return json({ error: String(err) }, 500)
  }
})
