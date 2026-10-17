'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteUserAccount(confirmationText: string) {
  if (confirmationText !== 'ELIMINAR') {
    return { error: 'Debés escribir la palabra ELIMINAR para confirmar la acción.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No se encontró una sesión activa.' }
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Cancelar suscripción activa en Mercado Pago si existe
    const { data: activeSubs } = await adminSupabase
      .from('subscriptions')
      .select('id, provider_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    if (activeSubs && activeSubs.length > 0 && mpToken) {
      for (const sub of activeSubs) {
        if (sub.provider_subscription_id) {
          try {
            await fetch(`https://api.mercadopago.com/preapproval/${sub.provider_subscription_id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${mpToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'cancelled' }),
            })
          } catch (mpErr) {
            console.error('Error cancelando MP preapproval al eliminar cuenta:', mpErr)
          }
        }
      }
    }

    // 2. Registrar solicitud en consumer_requests para trazabilidad legal
    await adminSupabase.from('consumer_requests').insert({
      tracking_code: `ELIM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      request_type: 'eliminacion_cuenta',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      email: user.email || 'desconocido@playcomun.com',
      details: 'Eliminación voluntaria de cuenta solicitada desde el panel del usuario.',
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_notes: 'Cuenta eliminada vía panel de configuración.',
      user_id: user.id
    })

    // 3. Eliminar usuario en Supabase Auth (desencadena cascada según RLS y foreign keys)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      throw deleteError
    }

    // 4. Cerrar sesión del usuario en el navegador
    await supabase.auth.signOut()
  } catch (error: any) {
    console.error('Error eliminando cuenta:', error)
    return { error: 'Ocurrió un error al procesar la eliminación. Contactanos a playcomun.ok@gmail.com' }
  }

  revalidatePath('/', 'layout')
  redirect('/ingresar?success=Tu+cuenta+fue+eliminada+correctamente')
}
