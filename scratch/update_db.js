require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Updating names...");
  await supabase
    .from("tool_candidates")
    .update({ nombre: "Calculadora de comisiones" })
    .eq("slug", "calculadora-comisiones-mercadopago");

  await supabase
    .from("tool_candidates")
    .update({ nombre: "Generador de facturas" })
    .eq("slug", "generador-recibos");

  console.log("Deleting Punto de equilibrio...");
  await supabase
    .from("tool_candidates")
    .delete()
    .eq("slug", "calculadora-punto-equilibrio");

  console.log("Resetting votes...");
  const { data: candidates } = await supabase.from("tool_candidates").select("id");
  if (candidates) {
    for (const c of candidates) {
      await supabase.from("tool_candidates").update({ votos: 0 }).eq("id", c.id);
    }
  }

  console.log("Deleting tool_votes...");
  const { data: votes } = await supabase.from("tool_votes").select("id");
  if (votes) {
    for (const v of votes) {
      await supabase.from("tool_votes").delete().eq("id", v.id);
    }
  }

  console.log("Done.");
}

run().catch(console.error);
