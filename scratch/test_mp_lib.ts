import { createSubscriptionCheckout } from "../src/lib/mercadopago.ts";

process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210";

async function test() {
  try {
    const result = await createSubscriptionCheckout({
      planType: 'mensual',
      payerEmail: 'test@playcomun.com',
      userId: 'test_user_123',
      returnUrl: 'https://www.playcomun.com/cuenta'
    });
    console.log("Success:", result);
  } catch (e) {
    console.error("Failed:", e);
  }
}

test();
