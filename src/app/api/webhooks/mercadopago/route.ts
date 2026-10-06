import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------
function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // Skip in dev/environments without secret

  const signature = req.headers.get('x-signature')
  const reqId = req.headers.get('x-request-id')

  if (!signature || !reqId) return false

  try {
    const parts = signature.split(',')
    let ts = '', v1 = ''
    parts.forEach(part => {
      const [key, value] = part.split('=')
      if (key === 'ts') ts = value
      if (key === 'v1') v1 = value
    })
    const manifest = `id:${reqId};request-id:${reqId};ts:${ts};`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex')
    return v1 === expectedSignature
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Mercado Pago API helpers
// ---------------------------------------------------------------------------
const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!

async function mpGet(path: string) {
  const resp = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` }
  })
  if (!resp.ok) return null
  return resp.json()
}

// ---------------------------------------------------------------------------
// Core sync logic — idempotent, handles subscription + payment upserts
// ---------------------------------------------------------------------------
async function syncSubscription(adminSupabase: any, mpSubId: string) {
  const subDetails = await mpGet(`/preapproval/${mpSubId}`)
  if (!subDetails) return

  const userId = subDetails.external_reference
  if (!userId) return

  // Map MP status → internal status
  let newStatus: string
  switch (subDetails.status) {
    case 'authorized':
    case 'active':
      newStatus = 'active'
      break
    case 'paused':
      newStatus = 'paused'
      break
    case 'cancelled':
      newStatus = 'cancelled'
      break
    case 'pending':
      newStatus = 'trialing'
      break
    default:
      newStatus = 'active'
  }

  // Determine plan from preapproval_plan_id or frequency
  const mpPlanId = subDetails.preapproval_plan_id
  const isAnual = subDetails.auto_recurring?.frequency === 12
  const planCode = isAnual ? 'pro_yearly' : 'pro_monthly'

  const { data: plan } = await adminSupabase
    .from('plans')
    .select('id')
    .eq('code', planCode)
    .single()

  if (!plan) return

  const periodStart = subDetails.summarized?.last_charged_date || subDetails.date_created
  const periodEnd = subDetails.next_payment_date

  // Upsert subscription (idempotent on provider_subscription_id)
  const { data: existingSub } = await adminSupabase
    .from('subscriptions')
    .select('id')
    .eq('provider_subscription_id', mpSubId)
    .maybeSingle()

  let localSubId: string

  if (existingSub) {
    await adminSupabase
      .from('subscriptions')
      .update({
        provider_status: subDetails.status,
        status: newStatus,
        current_period_start: periodStart || undefined,
        current_period_end: periodEnd || undefined,
        cancelled_at: subDetails.status === 'cancelled' ? new Date().toISOString() : null,
      })
      .eq('id', existingSub.id)
    localSubId = existingSub.id
  } else {
    const { data: newSub, error: insertErr } = await adminSupabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        provider: 'mercadopago',
        provider_subscription_id: mpSubId,
        provider_plan_id: mpPlanId || null,
        provider_status: subDetails.status,
        status: newStatus,
        current_period_start: periodStart || null,
        current_period_end: periodEnd || null,
        cancelled_at: subDetails.status === 'cancelled' ? new Date().toISOString() : null,
      })
      .select('id')
      .single()

    if (insertErr || !newSub) return
    localSubId = newSub.id
  }

  // Register the payment if it was charged and not already recorded
  if (
    subDetails.summarized?.charged_quantity > 0 &&
    subDetails.summarized?.last_charged_amount > 0
  ) {
    const paymentKey = `sub_${mpSubId}_${subDetails.summarized.charged_quantity}`
    const { data: existingPayment } = await adminSupabase
      .from('payments')
      .select('id')
      .eq('provider_payment_id', paymentKey)
      .maybeSingle()

    if (!existingPayment) {
      await adminSupabase
        .from('payments')
        .insert({
          user_id: userId,
          subscription_id: localSubId,
          provider: 'mercadopago',
          provider_payment_id: paymentKey,
          amount: subDetails.summarized.last_charged_amount,
          currency: subDetails.auto_recurring?.currency_id || 'ARS',
          status: 'approved',
          payment_method: subDetails.payment_method_id || null,
          paid_at: subDetails.summarized.last_charged_date || new Date().toISOString(),
        })
    }
  }
}

async function syncPayment(adminSupabase: any, mpPaymentId: string) {
  const paymentDetails = await mpGet(`/v1/payments/${mpPaymentId}`)
  if (!paymentDetails) return

  // Find the subscription associated with this payment via metadata or external_reference
  const mpSubId = paymentDetails.metadata?.preapproval_id || paymentDetails.metadata?.subscription_id
  if (!mpSubId) return

  const { data: localSub } = await adminSupabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('provider_subscription_id', mpSubId)
    .maybeSingle()

  if (!localSub) return

  // Map MP payment status
  let payStatus: string
  switch (paymentDetails.status) {
    case 'approved':
      payStatus = 'approved'
      break
    case 'rejected':
      payStatus = 'rejected'
      break
    case 'refunded':
      payStatus = 'refunded'
      break
    case 'cancelled':
      payStatus = 'cancelled'
      break
    default:
      payStatus = 'pending'
  }

  // Upsert payment (idempotent on provider_payment_id)
  const { data: existingPayment } = await adminSupabase
    .from('payments')
    .select('id')
    .eq('provider_payment_id', String(mpPaymentId))
    .maybeSingle()

  if (existingPayment) {
    await adminSupabase
      .from('payments')
      .update({ status: payStatus })
      .eq('id', existingPayment.id)
  } else {
    await adminSupabase
      .from('payments')
      .insert({
        user_id: localSub.user_id,
        subscription_id: localSub.id,
        provider: 'mercadopago',
        provider_payment_id: String(mpPaymentId),
        amount: paymentDetails.transaction_amount,
        currency: paymentDetails.currency_id || 'ARS',
        status: payStatus,
        payment_method: paymentDetails.payment_method_id || null,
        paid_at: paymentDetails.date_approved || new Date().toISOString(),
      })
  }

  // If approved, ensure subscription is active and period is updated
  if (payStatus === 'approved') {
    await syncSubscription(adminSupabase, mpSubId)
  }

  // If rejected, mark subscription status if needed
  if (payStatus === 'rejected') {
    await adminSupabase
      .from('subscriptions')
      .update({ status: 'past_due', provider_status: 'past_due' })
      .eq('id', localSub.id)
  }
}

// ---------------------------------------------------------------------------
// Main webhook handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const isVerified = verifySignature(req, rawBody)

    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const topic = body.type || body.topic
    const eventId = body.id || body.data?.id

    // Admin Supabase client (bypasses RLS for webhook processing)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Idempotency: log webhook event and check for duplicates
    const { error: insertError } = await adminSupabase
      .from('webhook_events')
      .insert({
        provider: 'mercadopago',
        event_id: String(eventId),
        event_type: String(topic),
        payload: body
      })

    if (insertError?.code === '23505') {
      // Already processed (unique constraint violation)
      return NextResponse.json({ received: true, note: 'Already processed' })
    }

    // Handle subscription updates (preapproval)
    if (topic === 'subscription_preapproval') {
      const mpSubId = body.data?.id
      if (mpSubId) {
        await syncSubscription(adminSupabase, mpSubId)
      }
    }

    // Handle individual payment updates
    if (topic === 'payment') {
      const mpPaymentId = body.data?.id
      if (mpPaymentId) {
        await syncPayment(adminSupabase, mpPaymentId)
      }
    }

    // Mark webhook as processed
    await adminSupabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('provider', 'mercadopago')
      .eq('event_id', String(eventId))

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
