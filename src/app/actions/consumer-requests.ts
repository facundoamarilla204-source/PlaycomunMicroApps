'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/utils/rateLimit'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const OFFICIAL_EMAIL = 'playcomun.ok@gmail.com'

export interface ConsumerRequestInput {
  requestType: 'arrepentimiento' | 'baja_servicio' | 'eliminacion_cuenta' | 'consulta_legal'
  fullName: string
  email: string
  phone?: string
  details?: string
  paymentReference?: string
  website?: string // Honeypot
}

export interface ConsumerRequestResult {
  success: boolean
  trackingCode?: string
  error?: string
  message?: string
  isDuplicate?: boolean
}

export interface ConsumerRequestStatusResult {
  success: boolean
  error?: string
  request?: {
    trackingCode: string
    requestType: string
    status: 'received' | 'in_review' | 'resolved' | 'rejected'
    createdAt: string
    resolvedAt: string | null
    resolutionNotes: string | null
  }
}

function generateTrackingCode(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${dateStr}-${randomChars}`
}

/**
 * Registra y procesa una solicitud de consumidor (arrepentimiento, baja de servicio, etc.)
 * con validaciones exhaustivas, protección contra spam/bots, rate limiting y persistencia atómica.
 */
export async function submitConsumerRequest(data: ConsumerRequestInput): Promise<ConsumerRequestResult> {
  try {
    // 1. Detección y descarte silencioso de bots mediante honeypot
    if (data.website && data.website.trim().length > 0) {
      console.warn('Bot submission blocked via honeypot in consumer_request')
      return {
        success: true,
        trackingCode: generateTrackingCode('PET'),
        message: 'Solicitud registrada correctamente.'
      }
    }

    // 2. Normalización y validación estricta de campos
    const fullName = data.fullName?.trim()
    const email = data.email?.trim().toLowerCase()
    const phone = data.phone ? data.phone.trim().slice(0, 30) : null
    const details = data.details ? data.details.trim().slice(0, 2000) : null
    let paymentReference = data.paymentReference ? data.paymentReference.trim().slice(0, 100) : null

    if (!fullName || fullName.length < 3) {
      return { success: false, error: 'El nombre completo debe tener al menos 3 caracteres.' }
    }
    if (fullName.length > 100) {
      return { success: false, error: 'El nombre no puede exceder los 100 caracteres.' }
    }

    if (!email) {
      return { success: false, error: 'El correo electrónico es requerido.' }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(email) || email.length > 255) {
      return { success: false, error: 'Por favor, ingresá una dirección de correo electrónico válida.' }
    }

    const validTypes = ['arrepentimiento', 'baja_servicio', 'eliminacion_cuenta', 'consulta_legal']
    if (!validTypes.includes(data.requestType)) {
      return { success: false, error: 'Tipo de solicitud inválido.' }
    }

    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = (headerList.get('user-agent') || 'unknown').slice(0, 255)

    // 3. Cliente de administración de Supabase
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Rate limiting: Máximo 5 solicitudes por hora por dirección IP
    try {
      const rateLimitRes = await checkRateLimit(
        adminSupabase,
        `consumer_req_${ip.split(',')[0].trim()}`,
        'consumer_request',
        5,
        60
      )
      if (!rateLimitRes.allowed) {
        return {
          success: false,
          error: 'Demasiadas solicitudes enviadas recientemente desde tu conexión. Por favor aguardá antes de reintentar o comunicate a playcomun.ok@gmail.com'
        }
      }
    } catch (rlErr) {
      console.warn('Rate limit check skipped/failed:', rlErr)
    }

    // 5. Prevención de envíos duplicados inmediatos (idempotencia en ventana de 2 minutos)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: recentDup } = await adminSupabase
      .from('consumer_requests')
      .select('tracking_code, created_at')
      .eq('email', email)
      .eq('request_type', data.requestType)
      .gte('created_at', twoMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentDup) {
      return {
        success: true,
        trackingCode: recentDup.tracking_code,
        message: 'Tu solicitud ya había sido recibida previamente con este mismo código de seguimiento.',
        isDuplicate: true
      }
    }

    // 6. Detectar si el usuario está autenticado en la sesión y resolver suscripción
    let currentUserId: string | null = null
    let activeSub: {
      id: string
      provider_subscription_id: string | null
      current_period_end: string | null
    } | null = null

    try {
      const authSupabase = await createClient()
      const { data: authData } = await authSupabase.auth.getUser()
      if (authData?.user) {
        currentUserId = authData.user.id

        // Buscar suscripción activa o con renovación pendiente
        const { data: subFound } = await adminSupabase
          .from('subscriptions')
          .select('id, provider_subscription_id, current_period_end')
          .eq('user_id', authData.user.id)
          .in('status', ['active', 'trialing', 'past_due'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (subFound) {
          activeSub = subFound
          if (!paymentReference && subFound.provider_subscription_id) {
            paymentReference = `MP: ${subFound.provider_subscription_id}`
          }
        }
      }
    } catch {
      // Usuario anónimo o llamada pública
    }

    // 7. Generación de código oficial de seguimiento
    const prefixMap: Record<string, string> = {
      arrepentimiento: 'ARR',
      baja_servicio: 'BAJ',
      eliminacion_cuenta: 'ELIM',
      consulta_legal: 'LEG'
    }
    const prefix = prefixMap[data.requestType] || 'PET'
    const trackingCode = generateTrackingCode(prefix)

    // 8. Determinación de estado inicial y ejecución de baja en Mercado Pago si corresponde
    let initialStatus: 'received' | 'in_review' | 'resolved' = 'received'
    let resolutionNotes: string | null = null
    let resolvedAt: string | null = null
    let customSuccessMessage = 'Solicitud registrada correctamente. Conservá tu código de identificación.'

    if (data.requestType === 'baja_servicio') {
      if (activeSub?.provider_subscription_id && currentUserId) {
        const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
        if (mpToken) {
          try {
            const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${activeSub.provider_subscription_id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${mpToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status: 'cancelled' })
            })

            if (mpResponse.ok) {
              // Actualizar la suscripción local preservando current_period_end
              await adminSupabase
                .from('subscriptions')
                .update({
                  status: 'cancelled',
                  provider_status: 'cancelled',
                  cancelled_at: new Date().toISOString()
                })
                .eq('id', activeSub.id)

              initialStatus = 'resolved'
              resolvedAt = new Date().toISOString()
              resolutionNotes = `Renovación automática cancelada en Mercado Pago exitosamente. Acceso Pro preservado hasta el fin del período pagado (${activeSub.current_period_end || 'fin del ciclo'}).`
              customSuccessMessage = 'Tu solicitud fue procesada y la renovación en Mercado Pago quedó cancelada. Conservás tu acceso Pro hasta el final de tu período pagado.'
            } else {
              const errText = await mpResponse.text()
              console.error('Error cancelando en Mercado Pago API:', errText)
              initialStatus = 'in_review'
              resolutionNotes = `Solicitud registrada. La cancelación automática en Mercado Pago devolvió un error (${mpResponse.status}). Pendiente de procesamiento administrativo manual.`
              customSuccessMessage = 'Tu solicitud fue registrada. Debido a un problema temporal con el proveedor de pagos, nuestro equipo completará la cancelación en Mercado Pago manualmente.'
            }
          } catch (mpEx: any) {
            console.error('Excepción al conectar con Mercado Pago:', mpEx)
            initialStatus = 'in_review'
            resolutionNotes = `Solicitud registrada. Error de red al comunicar con Mercado Pago: ${mpEx?.message || String(mpEx)}. Pendiente de procesamiento administrativo manual.`
          }
        }
      } else if (!currentUserId) {
        resolutionNotes = 'Solicitud de baja registrada por usuario sin sesión iniciada. Requiere validación de titularidad de la suscripción antes de la cancelación definitiva.'
      }
    } else if (data.requestType === 'arrepentimiento') {
      resolutionNotes = 'Solicitud de revocación registrada dentro del plazo legal. En revisión para verificación de cobro, gestión de reembolso y ajuste de suscripción.'
    }

    // 9. Persistencia obligatoria en Supabase
    const { error: dbError } = await adminSupabase
      .from('consumer_requests')
      .insert({
        tracking_code: trackingCode,
        request_type: data.requestType,
        full_name: fullName,
        email,
        phone,
        details,
        payment_reference: paymentReference,
        status: initialStatus,
        resolution_notes: resolutionNotes,
        resolved_at: resolvedAt,
        notification_status: resend ? 'pending' : 'not_configured',
        user_id: currentUserId,
        ip_address: ip,
        user_agent: userAgent
      })

    if (dbError) {
      console.error('CRITICAL: Error guardando consumer_request en base de datos:', dbError)
      return {
        success: false,
        error: 'No se pudo guardar la solicitud en el sistema debido a un error de base de datos. Por favor intentá nuevamente o escribinos a playcomun.ok@gmail.com'
      }
    }

    // 10. Envío de emails mediante Resend con trazabilidad de entrega
    let notificationStatus: 'pending' | 'sent' | 'failed' | 'not_configured' = resend ? 'pending' : 'not_configured'
    let notificationError: string | null = null

    if (resend) {
      const typeTitleMap: Record<string, string> = {
        arrepentimiento: 'Revocación de contratación (Botón de arrepentimiento)',
        baja_servicio: 'Baja de suscripción Pro (Botón de baja de servicio)',
        eliminacion_cuenta: 'Solicitud de eliminación de cuenta',
        consulta_legal: 'Consulta legal / Derechos de datos'
      }
      const requestTitle = typeTitleMap[data.requestType] || 'Solicitud de usuario'
      const fromEmail = process.env.RESEND_FROM_EMAIL || `PlayComun Online <${OFFICIAL_EMAIL}>`
      const toEmail = process.env.RESEND_TO_EMAIL || OFFICIAL_EMAIL

      try {
        const [internalRes, userRes] = await Promise.allSettled([
          resend.emails.send({
            from: fromEmail,
            to: [toEmail],
            replyTo: email,
            subject: `[${trackingCode}] Nueva solicitud: ${requestTitle}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px;">
                  ${requestTitle}
                </h2>
                <p><strong>Código de trámite:</strong> <span style="font-family: monospace; font-size: 16px; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${trackingCode}</span></p>
                <p><strong>Nombre:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
                ${paymentReference ? `<p><strong>Referencia o suscripción:</strong> ${paymentReference}</p>` : ''}
                <p><strong>Estado inicial:</strong> ${initialStatus}</p>
                ${resolutionNotes ? `<p><strong>Notas:</strong> ${resolutionNotes}</p>` : ''}
                <p><strong>Detalle:</strong></p>
                <blockquote style="background: #f8fafc; border-left: 4px solid #7c3aed; padding: 12px; margin: 0; white-space: pre-wrap;">
                  ${details || 'Sin observaciones adicionales.'}
                </blockquote>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
                  Fecha y hora: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}<br/>
                  IP: ${ip}
                </p>
              </div>
            `
          }),
          resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: `Constancia de trámite [${trackingCode}]: PlayComun Online`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <div style="background: #7c3aed; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 20px;">PlayComun Online</h1>
                </div>
                <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #0f172a; margin-top: 0;">Constancia de recepción de solicitud</h2>
                  <p>Hola ${fullName},</p>
                  <p>Confirmamos la recepción de tu solicitud de <strong>${requestTitle}</strong>.</p>
                  <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #6d28d9; font-weight: bold; text-transform: uppercase;">Código de seguimiento</p>
                    <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #4c1d95;">${trackingCode}</p>
                  </div>
                  <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                    Conforme a la normativa aplicable (Ley 24.240 y Disposición 954/2025), este número acredita tu solicitud. Nuestro equipo gestionará tu petición a la brevedad.
                  </p>
                  <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 12px; font-size: 13px; color: #475569; margin: 16px 0;">
                    <strong>Aviso importante:</strong> La solicitud de arrepentimiento o baja de servicio no elimina automáticamente tu cuenta de usuario ni borra tus documentos guardados en PlayComun. Si tenés dudas podés responder a este correo a <a href="mailto:${OFFICIAL_EMAIL}">${OFFICIAL_EMAIL}</a>.
                  </div>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                    PlayComun Online • playcomun.ok@gmail.com
                  </p>
                </div>
              </div>
            `
          })
        ])

        const userOk = userRes.status === 'fulfilled' && !userRes.value.error
        const internalOk = internalRes.status === 'fulfilled' && !internalRes.value.error

        if (userOk && internalOk) {
          notificationStatus = 'sent'
        } else {
          notificationStatus = 'failed'
          const userErrMsg = userRes.status === 'rejected' ? String(userRes.reason) : userRes.value?.error?.message
          const intErrMsg = internalRes.status === 'rejected' ? String(internalRes.reason) : internalRes.value?.error?.message
          notificationError = `Cliente: ${userErrMsg || 'OK'} | Interno: ${intErrMsg || 'OK'}`
          console.warn('Fallo parcial o total en envío de emails Resend:', notificationError)
        }
      } catch (sendEx: any) {
        notificationStatus = 'failed'
        notificationError = sendEx?.message || String(sendEx)
        console.error('Error al conectar con proveedor de email Resend:', sendEx)
      }

      // Actualizar estado de notificación en Supabase
      await adminSupabase
        .from('consumer_requests')
        .update({
          notification_status: notificationStatus,
          notification_error: notificationError,
          notification_sent_at: notificationStatus === 'sent' ? new Date().toISOString() : null
        })
        .eq('tracking_code', trackingCode)
    }

    return {
      success: true,
      trackingCode,
      message: customSuccessMessage
    }
  } catch (err: any) {
    console.error('Error inesperado en submitConsumerRequest:', err)
    return {
      success: false,
      error: 'Ocurrió un error inesperado al procesar tu solicitud. Por favor comunicate a playcomun.ok@gmail.com'
    }
  }
}

/**
 * Reintenta el despacho de notificación por email para una solicitud cuyo envío original falló.
 * Garantiza que no se generen registros duplicados y deja asentada la respuesta del proveedor.
 */
export async function retryConsumerRequestNotification(trackingCode: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: request, error } = await adminSupabase
      .from('consumer_requests')
      .select('*')
      .eq('tracking_code', trackingCode)
      .maybeSingle()

    if (error || !request) {
      return { success: false, message: 'Solicitud no encontrada.', error: error?.message }
    }

    if (!resend) {
      return { success: false, message: 'El proveedor de email (Resend) no está configurado.' }
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || `PlayComun Online <${OFFICIAL_EMAIL}>`
    const toEmail = process.env.RESEND_TO_EMAIL || OFFICIAL_EMAIL

    const userRes = await resend.emails.send({
      from: fromEmail,
      to: [request.email],
      subject: `Constancia de trámite [${request.tracking_code}]: PlayComun Online (Reintento)`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2>Constancia de solicitud: ${request.tracking_code}</h2>
          <p>Hola ${request.full_name},</p>
          <p>Te reenviamos la constancia oficial de tu solicitud de <strong>${request.request_type}</strong> registrada en PlayComun Online.</p>
          <p><strong>Estado:</strong> ${request.status}</p>
          <p>Para consultas comunicate a <a href="mailto:${toEmail}">${toEmail}</a>.</p>
        </div>
      `
    })

    if (userRes.error) {
      await adminSupabase
        .from('consumer_requests')
        .update({
          notification_status: 'failed',
          notification_error: `Reintento falló: ${userRes.error.message}`
        })
        .eq('tracking_code', trackingCode)
      return { success: false, message: 'El reintento fue rechazado por el proveedor de email.', error: userRes.error.message }
    }

    await adminSupabase
      .from('consumer_requests')
      .update({
        notification_status: 'sent',
        notification_error: null,
        notification_sent_at: new Date().toISOString()
      })
      .eq('tracking_code', trackingCode)

    return { success: true, message: 'Notificación reenviada con éxito.' }
  } catch (ex: any) {
    return { success: false, message: 'Error al reintentar envío.', error: ex?.message || String(ex) }
  }
}

/**
 * Consulta segura del estado de una solicitud existente mediante el par código de trámite + email.
 * Protegido contra enumeración: requiere coincidencia estricta de ambos datos.
 */
export async function getConsumerRequestStatus(trackingCode: string, email: string): Promise<ConsumerRequestStatusResult> {
  try {
    const cleanCode = trackingCode?.trim().toUpperCase()
    const cleanEmail = email?.trim().toLowerCase()

    if (!cleanCode || !cleanEmail) {
      return { success: false, error: 'Código de seguimiento y correo electrónico son requeridos.' }
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await adminSupabase
      .from('consumer_requests')
      .select('tracking_code, request_type, status, created_at, resolved_at, resolution_notes')
      .eq('tracking_code', cleanCode)
      .eq('email', cleanEmail)
      .maybeSingle()

    if (error) {
      console.error('Error consultando consumer_requests:', error)
      return { success: false, error: 'Error al consultar la base de datos.' }
    }

    if (!data) {
      return {
        success: false,
        error: 'No se encontró ninguna solicitud con ese código y correo electrónico. Verificá los datos ingresados.'
      }
    }

    return {
      success: true,
      request: {
        trackingCode: data.tracking_code,
        requestType: data.request_type,
        status: data.status as 'received' | 'in_review' | 'resolved' | 'rejected',
        createdAt: data.created_at,
        resolvedAt: data.resolved_at,
        resolutionNotes: data.resolution_notes
      }
    }
  } catch (err: any) {
    console.error('Error inesperado en getConsumerRequestStatus:', err)
    return { success: false, error: 'Error al consultar el estado de la solicitud.' }
  }
}
