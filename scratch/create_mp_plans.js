const accessToken = "APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210";

async function createPlan(name, frequency, amount) {
  const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reason: name,
      auto_recurring: {
        frequency: frequency,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "ARS"
      },
      back_url: "https://www.playcomun.com/cuenta"
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create plan ${name}: ${errorText}`);
    return null;
  }
  
  const data = await response.json();
  return data.id;
}

async function main() {
  console.log("Creando Plan Mensual...");
  const monthlyId = await createPlan("PlayComun Pro - Mensual", 1, 5900);
  
  console.log("Creando Plan Anual...");
  const yearlyId = await createPlan("PlayComun Pro - Anual", 12, 59000); 
  
  console.log(`\nNEXT_PUBLIC_MP_MONTHLY_PLAN_ID="${monthlyId}"`);
  console.log(`NEXT_PUBLIC_MP_YEARLY_PLAN_ID="${yearlyId}"`);
}

main();
