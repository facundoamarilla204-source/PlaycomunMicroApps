import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVoterHash } from "@/utils/voter";
import { cookies } from "next/headers";
import crypto from "crypto";
import { checkRateLimit } from "@/utils/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json();
    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let voterId = cookieStore.get("voter_id")?.value;
    if (!voterId) {
      voterId = crypto.randomUUID();
    }

    const voterHash = getVoterHash(req);
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ==========================================
    // CONFIGURACIÓN DE RATE LIMITING (VOTOS)
    // ==========================================
    // Se considera una "operación" tanto votar como retirar un voto.
    // Límite por IP: 30 operaciones cada 10 minutos
    const { allowed: ipAllowed, retryAfter: ipRetry } = await checkRateLimit(supabase, `vote_ip_${ip}`, "vote", 30, 10);
    if (!ipAllowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Probá nuevamente en unos minutos." }, { status: 429, headers: { "Retry-After": String(ipRetry) } });
    }

    // Voter hash limit: 60 ops / 10 min
    const { allowed: hashAllowed, retryAfter: hashRetry } = await checkRateLimit(supabase, `vote_hash_${voterHash}`, "vote", 60, 10);
    if (!hashAllowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Probá nuevamente en unos minutos." }, { status: 429, headers: { "Retry-After": String(hashRetry) } });
    }

    // Toggle logic
    const { data: existing } = await supabase
      .from("tool_votes")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("voter_hash", voterHash)
      .single();

    let action = "added";

    if (existing) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("tool_votes")
        .delete()
        .eq("id", existing.id);
      
      if (deleteError) throw deleteError;
      action = "removed";
    } else {
      // Insert vote
      const { error: insertError } = await supabase
        .from("tool_votes")
        .insert({ candidate_id: candidateId, voter_hash: voterHash });

      if (insertError) {
        if (insertError.code === "23505") { // Unique violation means it was added concurrently
          // ignore, it's effectively added
        } else {
          throw insertError;
        }
      }
    }

    const response = NextResponse.json({ success: true, action });
    
    if (!cookieStore.has("voter_id")) {
      response.cookies.set("voter_id", voterId, {
        maxAge: 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
