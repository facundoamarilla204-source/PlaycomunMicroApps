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
        preapproval_plan_id: "5b5d763dad834d3e9f7c69eb55475df0",
        payer_email: "test@playcomun.com",
        back_url: "https://www.playcomun.com/cuenta",
        reason: "Suscripción PlayComun Pro",
        external_reference: "USER_ID_123"
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
