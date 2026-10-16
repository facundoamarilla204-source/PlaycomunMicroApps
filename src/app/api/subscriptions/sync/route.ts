import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { syncUserSubscriptions } from '@/lib/subscription-sync'

/**
 * POST /api/subscriptions/sync
 *
 * Consulta el estado real de la suscripción en Mercado Pago y lo sincroniza
 * de forma autoritativa con Supabase.
 *
 * Body opcional: { preapproval_id?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createAuthClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json().catch(() => ({}))
    const preapprovalId = body.preapproval_id

    const result = await syncUserSubscriptions(adminSupabase, user.id, preapprovalId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[sync] Error al sincronizar suscripciones:', error)
    return NextResponse.json(
      { error: 'Error al sincronizar', detail: error.message },
      { status: 500 }
    )
  }
}
