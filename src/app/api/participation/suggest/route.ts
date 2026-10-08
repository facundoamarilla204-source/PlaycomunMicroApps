import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVoterHash } from "@/utils/voter";
import { cookies } from "next/headers";
import crypto from "crypto";
import { checkRateLimit } from "@/utils/rateLimit";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const { texto, website } = await req.json();
    
    // Honeypot check
    if (website) {
      return NextResponse.json({ success: true }); // Fake success for bots
    }

    if (!texto || texto.length < 5 || texto.length > 140) {
      return NextResponse.json({ error: "La sugerencia debe tener entre 5 y 140 caracteres" }, { status: 400 });
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
    // CONFIGURACIÓN DE RATE LIMITING (SUGERENCIAS)
    // ==========================================
    // Limitamos más estrictamente porque envía email y graba en BD
    
    // Límite por IP: 5 operaciones cada 10 minutos
    const { allowed: ip10mAllowed, retryAfter: ip10mRetry } = await checkRateLimit(supabase, `suggest_ip_10m_${ip}`, "suggest", 5, 10);
    if (!ip10mAllowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Probá nuevamente en unos minutos." }, { status: 429, headers: { "Retry-After": String(ip10mRetry) } });
    }

    // IP limit: 10 ops / 1 day (1440 min)
    const { allowed: ipDayAllowed, retryAfter: ipDayRetry } = await checkRateLimit(supabase, `suggest_ip_1d_${ip}`, "suggest", 10, 1440);
    if (!ipDayAllowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Probá nuevamente mañana." }, { status: 429, headers: { "Retry-After": String(ipDayRetry) } });
    }

    // Voter hash limit: 3 ops / 1 day
    const { allowed: hashAllowed, retryAfter: hashRetry } = await checkRateLimit(supabase, `suggest_hash_1d_${voterHash}`, "suggest", 3, 1440);
    if (!hashAllowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Probá nuevamente mañana." }, { status: 429, headers: { "Retry-After": String(hashRetry) } });
    }

    // Idempotency check: check if same text from same voter was submitted in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingSuggestion } = await supabase
      .from("tool_suggestions")
      .select("id")
      .eq("voter_hash", voterHash)
      .eq("texto", texto)
      .gte("created_at", oneHourAgo)
      .limit(1)
      .single();

    if (existingSuggestion) {
      // Idempotent success response without resending email
      return NextResponse.json({ success: true, message: "Recibimos tu propuesta anteriormente." });
    }

    // Insert suggestion
    const { data: suggestionData, error: insertError } = await supabase
      .from("tool_suggestions")
      .insert({ texto, voter_hash: voterHash, estado: "pendiente" })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Send Email via Resend
    if (resend) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || "PlayComun Online <propuestas@playcomun.com>";
        const toEmail = process.env.RESEND_TO_EMAIL || "soporte@playcomun.com"; // Found in contacto/page.tsx

        const htmlTemplate = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #6d28d9; border-bottom: 2px solid #6d28d9; padding-bottom: 10px;">Nueva propuesta de herramienta</h2>
            
            <p style="font-size: 16px;"><strong>Propuesta recibida:</strong></p>
            <blockquote style="font-size: 18px; font-style: italic; background-color: #f3f4f6; padding: 15px; border-left: 4px solid #6d28d9; margin-left: 0;">
              "${texto}"
            </blockquote>
            
            <p style="font-size: 14px;">
              <strong>Estado:</strong> Pendiente de revisión<br/>
              <strong>Fecha y hora de recepción:</strong> ${new Date(suggestionData.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}<br/>
              <strong>Identificador interno:</strong> ${suggestionData.id}
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              PlayComun Online &bull; <a href="https://www.playcomun.com" style="color: #6b7280;">playcomun.com</a>
            </p>
          </div>
        `;

        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: [toEmail],
          subject: "Nueva propuesta de herramienta — PlayComun Online",
          html: htmlTemplate,
        });

        if (emailError) {
          console.error("Resend error:", emailError);
          // Don't fail the request if email fails, it's already in DB
        }
      } catch (emailErr) {
        console.error("Error sending email:", emailErr);
        // Don't fail the request if email fails
      }
    } else {
      console.warn("RESEND_API_KEY no configurada. La sugerencia se guardó en la base de datos pero no se envió el email.");
    }

    const response = NextResponse.json({ success: true, message: "Gracias. Recibimos tu propuesta." });
    
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
