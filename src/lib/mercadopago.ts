export interface SubscriptionData {
  planType: 'mensual' | 'anual'
  payerEmail: string
  returnUrl: string
  userId: string
}

/**
 * Create a subscription checkout link
 */
export async function createSubscriptionCheckout(data: SubscriptionData) {
  try {
    const isAnual = data.planType === 'anual'
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210'
    
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado')
    }

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payer_email: data.payerEmail,
        back_url: data.returnUrl,
        reason: `Suscripcion PlayComun Pro - ${isAnual ? 'Anual' : 'Mensual'}`,
        external_reference: data.userId,
        auto_recurring: {
          frequency: isAnual ? 12 : 1,
          frequency_type: "months",
          transaction_amount: isAnual ? 59000 : 5900,
          currency_id: "ARS",
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MercadoPago API Error:', errorText)
      throw new Error(`Error MP: ${errorText}`)
    }
    
    const responseData = await response.json()

    return {
      initPoint: responseData.init_point,
      id: responseData.id
    }
  } catch (error: any) {
    console.error('Error creating MP subscription:', error)
    throw error
  }
}

export async function createSubscriptionWithCard(data: {
  planType: 'mensual' | 'anual',
  token: string,
  payerEmail: string,
  userId: string,
}) {
  try {
    const isAnual = data.planType === 'anual'
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210'
    
    if (!mpToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado')
    }

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payer_email: data.payerEmail,
        back_url: "https://www.playcomun.com/cuenta/suscripcion?success=true",
        reason: `Suscripcion PlayComun Pro - ${isAnual ? 'Anual' : 'Mensual'}`,
        external_reference: data.userId,
        card_token_id: data.token, // This is the magic key for direct card payment
        status: "authorized",
        auto_recurring: {
          frequency: isAnual ? 12 : 1,
          frequency_type: "months",
          transaction_amount: isAnual ? 59000 : 5900,
          currency_id: "ARS",
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MercadoPago API Error (Card):', errorText)
      throw new Error(`Error MP: ${errorText}`)
    }
    
    return await response.json()
  } catch (error: any) {
    console.error('Error creating MP card subscription:', error)
    throw error
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(id: string) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210'
    const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error getting MP subscription:', error)
    return null
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(id: string) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210'
    const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: 'cancelled' })
    })
    if (!response.ok) throw new Error('Error al cancelar')
    return await response.json()
  } catch (error) {
    console.error('Error canceling MP subscription:', error)
    throw new Error('No se pudo cancelar la suscripción')
  }
}
