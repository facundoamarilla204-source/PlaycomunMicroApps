import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!

/**
 * POST /api/subscriptions/sync
 *
 * Consulta el estado real de la suscripción en Mercado Pago y lo sincroniza
 * con Supabase. Diseñado para ser llamado cuando el usuario regresa al site
 * después de pagar, antes de que el webhook haya llegado.
 *
 * Body: { preapproval_id?: string } — si se pasa, verifica ese ID puntual.
 * Si no se pasa, busca todas las suscripciones autorizadas del usuario en MP.
 *
 * Idempotente: si ya existe la suscripción en Supabase, solo actualiza el
 * estado sin crear duplicados.
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar sesión del usuario
    const authSupabase = await createAuthClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Supabase admin para bypassar RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json().catch(() => ({}))
    const preapprovalId: string | undefined = body.preapproval_id

    let mpSubscriptions: any[] = []

    if (preapprovalId) {
      // Verificar suscripción específica
      const resp = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` }
      })
      if (resp.ok) {
        const sub = await resp.json()
        // Solo procesar si pertenece a este usuario
        if (sub.external_reference === user.id) {
          mpSubscriptions = [sub]
        }
      }
    } else {
      // Buscar todas las suscripciones del usuario en MP por external_reference
      const resp = await fetch(
        `https://api.mercadopago.com/preapproval/search?external_reference=${user.id}&limit=10`,
        { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
      )
      if (resp.ok) {
        const data = await resp.json()
        mpSubscriptions = (data.results || []).filter(
          (s: any) => s.status === 'authorized' || s.status === 'active'
        )
      }
    }

    if (mpSubscriptions.length === 0) {
      return NextResponse.json({ synced: false, message: 'No hay suscripciones activas en Mercado Pago' })
    }

    let synced = false
    let syncedSubscriptionId: string | null = null

    for (const mpSub of mpSubscriptions) {
      const mpSubId = mpSub.id || mpSub.subscription_id
      const mpStatus = mpSub.status // authorized | active | paused | cancelled | pending

      if (mpStatus !== 'authorized' && mpStatus !== 'active') continue

      // Determinar el plan de PlayComun según el preapproval_plan_id de MP
      const mpPlanId = mpSub.preapproval_plan_id
      const isAnual = mpSub.auto_recurring?.frequency === 12
      const planCode = isAnual ? 'pro_yearly' : 'pro_monthly'

      const { data: plan } = await adminSupabase
        .from('plans')
        .select('id')
        .eq('code', planCode)
        .single()

      if (!plan) continue

      // Calcular fechas de período
      const periodStart = mpSub.summarized?.last_charged_date || mpSub.date_created
      const periodEnd = mpSub.next_payment_date

      // Upsert subscription (idempotente por provider_subscription_id)
      const { data: existingSub } = await adminSupabase
        .from('subscriptions')
        .select('id, status')
        .eq('provider_subscription_id', mpSubId)
        .maybeSingle()

      let localSubId: string

      if (existingSub) {
        // Actualizar si cambió algo
        await adminSupabase
          .from('subscriptions')
          .update({
            provider_status: mpStatus,
            status: 'active',
            current_period_start: periodStart || undefined,
            current_period_end: periodEnd || undefined,
          })
          .eq('id', existingSub.id)
        localSubId = existingSub.id
      } else {
        // Crear nueva subscripción
        const { data: newSub, error: insertErr } = await adminSupabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: plan.id,
            provider: 'mercadopago',
            provider_subscription_id: mpSubId,
            provider_plan_id: mpPlanId || null,
            provider_status: mpStatus,
            status: 'active',
            current_period_start: periodStart || null,
            current_period_end: periodEnd || null,
          })
          .select('id')
          .single()

        if (insertErr || !newSub) continue
        localSubId = newSub.id
      }

      // Registrar el pago si se cobró y no existe
      if (mpSub.summarized?.charged_quantity > 0 && mpSub.summarized?.last_charged_amount > 0) {
        const paymentKey = `sub_${mpSubId}_${mpSub.summarized.charged_quantity}`
        const { data: existingPayment } = await adminSupabase
          .from('payments')
          .select('id')
          .eq('provider_payment_id', paymentKey)
          .maybeSingle()

        if (!existingPayment) {
          await adminSupabase
            .from('payments')
            .insert({
              user_id: user.id,
              subscription_id: localSubId,
              provider: 'mercadopago',
              provider_payment_id: paymentKey,
              amount: mpSub.summarized.last_charged_amount,
              currency: mpSub.auto_recurring?.currency_id || 'ARS',
              status: 'approved',
              payment_method: mpSub.payment_method_id || null,
              paid_at: mpSub.summarized.last_charged_date || mpSub.date_created,
            })
        }
      }

      synced = true
      syncedSubscriptionId = localSubId
    }

    return NextResponse.json({
      synced,
      subscriptionId: syncedSubscriptionId,
      message: synced
        ? 'Suscripción sincronizada correctamente'
        : 'No se encontraron suscripciones para sincronizar'
    })
  } catch (error: any) {
    console.error('[sync] Error:', error)
    return NextResponse.json({ error: 'Error al sincronizar', detail: error.message }, { status: 500 })
  }
}
