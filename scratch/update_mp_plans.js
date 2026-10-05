const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210";

async function updatePlan(id, newAmount) {
  const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      auto_recurring: {
        transaction_amount: newAmount,
        currency_id: "ARS"
      }
    })
  });
  
  if (!response.ok) {
    console.error(`Failed to update ${id}`, await response.text());
    return;
  }
  
  const data = await response.json();
  console.log(`Updated ${id} successfully! New amount: ${data.auto_recurring.transaction_amount}`);
}

async function main() {
  await updatePlan("5b5d763dad834d3e9f7c69eb55475df0", 100);
  await updatePlan("21174900dccf40ab9d244591d2e07129", 150);
}

main();
