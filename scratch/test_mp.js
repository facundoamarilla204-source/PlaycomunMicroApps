const { MercadoPagoConfig, PreApproval } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210',
});

const preapproval = new PreApproval(client);

async function test() {
  try {
    const response = await preapproval.create({
      body: {
        preapproval_plan_id: "5b5d763dad834d3e9f7c69eb55475df0", // Monthly ID we generated
        payer_email: "test@playcomun.com",
        back_url: "https://www.google.com",
        reason: "Suscripción PlayComun Pro",
        // Test with and without auto_recurring
      }
    });
    console.log(response);
  } catch (e) {
    console.error(e);
  }
}

test();
