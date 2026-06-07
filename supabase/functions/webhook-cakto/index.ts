import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Limites por plano — espelho do que está no banco (migration 20260513)
const PLAN_LIMITS: Record<string, { exports_limit: number; ai_images_limit: number }> = {
  construtor: { exports_limit: 999999, ai_images_limit: 20  },
  escala:     { exports_limit: 999999, ai_images_limit: 60  },
  agencia:    { exports_limit: 999999, ai_images_limit: 200 },
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 })
  }

  try {
    // ── Valida token do webhook ───────────────────────────────────────
    const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET') ?? ''
    const incomingToken = req.headers.get('x-kiwify-token') ?? ''

    if (!webhookSecret || incomingToken !== webhookSecret) {
      console.error('[webhook-cakto] token inválido')
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }

    // ── Parse do body ─────────────────────────────────────────────────
    const body = await req.json() as {
      event: string
      data: {
        customer: { email: string }
        product:  { id: string }
      }
    }

    // Só processa eventos de aprovação
    if (body.event !== 'order.approved') {
      console.log('[webhook-cakto] evento ignorado:', body.event)
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
    }

    const email     = body.data?.customer?.email
    const productId = body.data?.product?.id

    if (!email || !productId) {
      return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 })
    }

    // ── Mapeia product_id → plano ─────────────────────────────────────
    const productConstrutor   = Deno.env.get('CAKTO_PRODUCT_CONSTRUTOR')   ?? ''
    const productEscala       = Deno.env.get('CAKTO_PRODUCT_ESCALA')       ?? ''
    const productAgencia      = Deno.env.get('CAKTO_PRODUCT_AGENCIA')      ?? ''

    // Retrocompat: aceitar env vars antigas também
    const productCriadorLegacy      = Deno.env.get('CAKTO_PRODUCT_CRIADOR')      ?? ''
    const productProfissionalLegacy = Deno.env.get('CAKTO_PRODUCT_PROFISSIONAL') ?? ''

    let plan: string | null = null
    if (productId === productConstrutor || productId === productCriadorLegacy)        plan = 'construtor'
    if (productId === productEscala     || productId === productProfissionalLegacy)   plan = 'escala'
    if (productId === productAgencia)                                                  plan = 'agencia'

    if (!plan) {
      console.error('[webhook-cakto] product_id não mapeado:', productId)
      return new Response(JSON.stringify({ error: 'unknown_product', product_id: productId }), { status: 400 })
    }

    // ── Busca o usuário pelo email ────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('[webhook-cakto] erro ao listar usuários:', userError)
      return new Response(JSON.stringify({ error: 'auth_error' }), { status: 500 })
    }

    const user = userData.users.find((u) => u.email === email)

    if (!user) {
      console.error('[webhook-cakto] usuário não encontrado para email:', email)
      // Retorna 200 para evitar reenvio — o usuário pode ainda não ter se cadastrado
      return new Response(JSON.stringify({ ok: true, warning: 'user_not_found' }), { status: 200 })
    }

    // ── Atualiza o plano no profiles ──────────────────────────────────
    const limits = PLAN_LIMITS[plan]
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan:                plan,
        exports_limit:       limits.exports_limit,
        ai_images_limit:     limits.ai_images_limit,
        subscription_source: 'webhook',
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[webhook-cakto] erro ao atualizar profile:', updateError)
      return new Response(JSON.stringify({ error: 'db_update_error' }), { status: 500 })
    }

    console.log(`[webhook-cakto] plano atualizado: ${email} → ${plan}`)
    return new Response(JSON.stringify({ ok: true, plan }), { status: 200 })

  } catch (err) {
    console.error('[webhook-cakto] exceção:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
