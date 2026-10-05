export interface SubscriptionData {
  payerEmail: string
  returnUrl: string
  userId: string
  planTitle: string
  price: number
  frequency: number // 1 or 12
  frequencyType: 'months'
}

/**
 * Create a subscription checkout link
 */
export async function createSubscriptionCheckout(data: SubscriptionData) {
  try {
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
        external_reference: data.userId,
        reason: data.planTitle,
        auto_recurring: {
          frequency: data.frequency,
          frequency_type: data.frequencyType,
          transaction_amount: data.price,
          currency_id: "ARS"
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
  token: string,
  payerEmail: string,
  userId: string,
  preapprovalPlanId: string
}) {
  try {
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
        external_reference: data.userId,
        card_token_id: data.token, // This is the magic key for direct card payment
        status: "authorized",
        preapproval_plan_id: data.preapprovalPlanId
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
