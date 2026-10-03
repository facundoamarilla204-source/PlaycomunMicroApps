import * as fs from "fs";

const accessToken = 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210';

async function test() {
  try {
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payer_email: "test@playcomun.com",
        reason: "Suscripción PlayComun Pro",
        external_reference: "USER_ID_123",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 5900,
          currency_id: "ARS"
        }
      })
    });
    
    if (!response.ok) {
      console.error(await response.text());
    } else {
      const data = await response.json();
      console.log("Success:", data.init_point);
    }
  } catch (e) {
    console.error(e);
  }
}

test();
