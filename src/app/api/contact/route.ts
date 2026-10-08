import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/utils/rateLimit";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, mensaje, website } = await req.json();

    // Honeypot para evitar bots
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (mensaje.length < 10 || mensaje.length > 2000) {
      return NextResponse.json({ error: "El mensaje debe tener entre 10 y 2000 caracteres" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";

    // Supabase admin client for rate limit
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Límite estricto: 5 mensajes por hora por IP
    const { allowed, retryAfter } = await checkRateLimit(supabase, `contact_ip_1h_${ip}`, "contact", 5, 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados mensajes enviados. Probá nuevamente más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    if (resend) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "PlayComun Online <contacto@playcomun.com>";
      const toEmail = process.env.RESEND_TO_EMAIL || "soporte@playcomun.com";

      const htmlTemplate = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6d28d9; border-bottom: 2px solid #6d28d9; padding-bottom: 10px;">Nuevo mensaje de contacto</h2>
          
          <p style="font-size: 16px;"><strong>Nombre:</strong> ${nombre}</p>
          <p style="font-size: 16px;"><strong>Email:</strong> ${email}</p>
          
          <p style="font-size: 16px; margin-top: 20px;"><strong>Mensaje:</strong></p>
          <blockquote style="font-size: 16px; background-color: #f3f4f6; padding: 15px; border-left: 4px solid #6d28d9; margin-left: 0; white-space: pre-wrap;">
            ${mensaje}
          </blockquote>
          
          <p style="font-size: 14px; margin-top: 30px;">
            <strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}<br/>
            <strong>IP:</strong> ${ip}
          </p>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            Enviado desde el formulario de contacto de PlayComun Online
          </p>
        </div>
      `;

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        replyTo: email,
        subject: `Contacto de ${nombre} — PlayComun Online`,
        html: htmlTemplate,
      });

      if (emailError) {
        console.error("Resend error (Contact):", emailError);
        return NextResponse.json({ error: "Error al enviar el correo. Por favor, intentá más tarde." }, { status: 500 });
      }
    } else {
      console.warn("RESEND_API_KEY no configurada. El mensaje de contacto no se envió.");
      return NextResponse.json({ error: "El servicio de correos no está configurado en el servidor." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Mensaje enviado con éxito." });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
