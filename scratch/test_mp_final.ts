import { createSubscriptionCheckout } from "../src/lib/mercadopago.ts";
import { PreApproval, MercadoPagoConfig } from 'mercadopago';
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
env.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) process.env[k.trim()] = v.trim();
});

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const preapproval = new PreApproval(client)

async function test() {
  console.log("Testing with token:", process.env.MERCADOPAGO_ACCESS_TOKEN ? "Found" : "Missing");
  try {
    const response = await preapproval.create({
      body: {
        back_url: 'http://localhost:3000/cuenta?success=true',
        reason: 'Suscripcion Pro',
        external_reference: '1234',
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 5900,
          currency_id: "ARS",
        }
      }
    });
    console.log("SUCCESS! Init point:", response.init_point);
  } catch (e: any) {
    console.error("FAILED!");
    console.error(e.message);
    if (e.cause) console.error("Cause:", e.cause);
    if (e.status) console.error("Status:", e.status);
    console.error(e);
  }
}

test();
