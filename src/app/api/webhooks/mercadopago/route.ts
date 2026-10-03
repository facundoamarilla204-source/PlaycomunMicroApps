import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { getSubscription } from '@/lib/mercadopago'

// Helper to verify MP webhook signature
function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // Skip if no secret set (e.g. dev)

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
  } catch (e) {
    return false
  }
}

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
    
    // Create admin supabase client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Log the webhook to ensure idempotency
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'mercadopago',
        event_id: String(eventId),
        event_type: String(topic),
        payload: body
      })

    // If it fails with unique constraint, we already processed it
    if (insertError && insertError.code === '23505') {
      return NextResponse.json({ received: true, note: 'Already processed' })
    }

    // Handle Subscription updates
    if (topic === 'subscription_preapproval') {
      const mpSubId = body.data.id
      const subDetails = await getSubscription(mpSubId)
      
      if (subDetails) {
        // Map MP status to our enum
        // MP statuses: pending, authorized, paused, cancelled
        let newStatus = 'active'
        if (subDetails.status === 'paused') newStatus = 'paused'
        if (subDetails.status === 'cancelled') newStatus = 'cancelled'
        if (subDetails.status === 'pending') newStatus = 'trialing'

        // external_reference contains the user_id (as set in our action)
        const userId = subDetails.external_reference;

        if (userId) {
          // Fetch the plan_id based on reason or frequency
          const isAnual = subDetails.auto_recurring?.frequency === 12;
          const { data: planData } = await supabase
            .from('plans')
            .select('id')
            .eq('code', isAnual ? 'pro_yearly' : 'pro_monthly')
            .single()

          const planId = planData?.id;

          if (planId) {
            // Upsert the subscription using provider_subscription_id
            const { data: existingSub } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('provider_subscription_id', mpSubId)
              .single()

            if (existingSub) {
              await supabase
                .from('subscriptions')
                .update({
                  provider_status: subDetails.status,
                  status: newStatus,
                  cancelled_at: subDetails.status === 'cancelled' ? new Date().toISOString() : null,
                })
                .eq('id', existingSub.id)
            } else {
              await supabase
                .from('subscriptions')
                .insert({
                  user_id: userId,
                  plan_id: planId,
                  provider: 'mercadopago',
                  provider_subscription_id: mpSubId,
                  provider_status: subDetails.status,
                  status: newStatus,
                  cancelled_at: subDetails.status === 'cancelled' ? new Date().toISOString() : null,
                })
            }
          }
        }
      }
    }

    // Handle payment updates
    if (topic === 'payment') {
      // Payment logic could be implemented here to update the payments table
      // In subscriptions, 'subscription_preapproval' is usually enough for access control
    }

    // Mark as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('provider', 'mercadopago')
      .eq('event_id', String(eventId))

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
