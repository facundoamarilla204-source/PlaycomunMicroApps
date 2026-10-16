import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  verifyMercadoPagoSignature,
  syncSubscriptionFromMp,
  syncPaymentFromMp,
  syncAuthorizedPaymentFromMp
} from '@/lib/subscription-sync'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let body: any = {}
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = {}
    }

    const searchParams = req.nextUrl.searchParams
    const eventId = searchParams.get('data.id') || searchParams.get('id') || body.data?.id || body.id

    // Verificar firma HMAC-SHA256 de Mercado Pago
    const isVerified = verifyMercadoPagoSignature(
      req.headers,
      searchParams,
      body.data?.id || body.id
    )

    if (!isVerified) {
      console.warn('[webhook] Firma de Mercado Pago inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const topic = body.type || body.topic || searchParams.get('type') || searchParams.get('topic')

    // Cliente admin de Supabase (bypassea RLS para procesar webhooks)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Idempotencia: registrar evento de webhook
    if (eventId) {
      const { error: insertError } = await adminSupabase
        .from('webhook_events')
        .insert({
          provider: 'mercadopago',
          event_id: String(eventId),
          event_type: String(topic || 'unknown'),
          payload: body
        })

      if (insertError?.code === '23505') {
        // Evento ya procesado previamente
        return NextResponse.json({ received: true, note: 'Already processed' })
      }
    }

    // 1. Evento de suscripción (preapproval)
    if (topic === 'subscription_preapproval') {
      const mpSubId = body.data?.id || searchParams.get('data.id') || searchParams.get('id')
      if (mpSubId) {
        await syncSubscriptionFromMp(adminSupabase, String(mpSubId))
      }
    }

    // 2. Evento de cobro recurrente automático (autorización de cuota mensual)
    if (topic === 'subscription_authorized_payment') {
      const authPaymentId = body.data?.id || searchParams.get('data.id') || searchParams.get('id')
      if (authPaymentId) {
        await syncAuthorizedPaymentFromMp(adminSupabase, String(authPaymentId))
      }
    }

    // 3. Evento de pago individual (payment)
    if (topic === 'payment') {
      const mpPaymentId = body.data?.id || searchParams.get('data.id') || searchParams.get('id')
      if (mpPaymentId) {
        await syncPaymentFromMp(adminSupabase, String(mpPaymentId))
      }
    }

    // Marcar evento como procesado
    if (eventId) {
      await adminSupabase
        .from('webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('provider', 'mercadopago')
        .eq('event_id', String(eventId))
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[webhook] Error procesando webhook de Mercado Pago:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
