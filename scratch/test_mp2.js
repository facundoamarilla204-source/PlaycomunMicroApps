const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210',
});

const preapprovalPlan = new PreApprovalPlan(client);

async function test() {
  try {
    const response = await preapprovalPlan.get({ planId: "5b5d763dad834d3e9f7c69eb55475df0" });
    console.log(response.init_point);
  } catch (e) {
    console.error(e);
  }
}

test();
