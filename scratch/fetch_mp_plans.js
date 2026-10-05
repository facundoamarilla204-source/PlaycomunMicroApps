const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "APP_USR-7697561520946621-100315-cf3b2d893218149eb689843517e82dce-600217210";

async function fetchPlans() {
  const response = await fetch("https://api.mercadopago.com/preapproval_plan/search?status=active", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    }
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

fetchPlans();
