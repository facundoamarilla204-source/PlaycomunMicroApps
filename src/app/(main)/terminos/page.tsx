import { buildMetadata } from "@/lib/metadata"
import { Scale, CheckCircle2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { LegalHeader } from "@/components/legal/LegalHeader"
import { LegalTableOfContents, TocItem } from "@/components/legal/LegalTableOfContents"
import { LegalSection } from "@/components/legal/LegalSection"

export const metadata = buildMetadata({
  title: "Términos y condiciones de servicio",
  description: "Términos y condiciones generales de uso de PlayComun Online. Reglas de uso, suscripción Pro, pagos, cancelaciones y derechos del consumidor.",
  path: "/terminos",
})

const TOC_ITEMS: TocItem[] = [
  { id: "aceptacion", number: 1, title: "Aceptación y descripción" },
  { id: "modalidades", number: 2, title: "Modalidades de servicio" },
  { id: "contratacion", number: 3, title: "Contratación y pagos" },
  { id: "cancelacion", number: 4, title: "Cancelación y vigencia" },
  { id: "arrepentimiento", number: 5, title: "Botón de arrepentimiento" },
  { id: "baja-cuenta", number: 6, title: "Baja y eliminación de cuenta" },
  { id: "arca", number: 7, title: "Documentos comerciales y ARCA" },
  { id: "seguridad", number: 8, title: "Usos prohibidos y seguridad" },
  { id: "propiedad", number: 9, title: "Propiedad intelectual" },
  { id: "contacto-legal", number: 10, title: "Disponibilidad y contacto" },
]

export default function TerminosPage() {
  const lastUpdated = "16 de octubre de 2026"

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado con breadcrumbs y metadatos limpios */}
        <LegalHeader
          badgeLabel="Condiciones de uso"
          badgeIcon={<Scale className="w-3.5 h-3.5" aria-hidden="true" />}
          title="Términos y Condiciones"
          description="Condiciones generales que regulan el acceso, suscripciones Pro, modalidades de pago y garantías comerciales de PlayComun Online."
          lastUpdated={lastUpdated}
          breadcrumbs={[{ label: "Términos y condiciones" }]}
        />

        {/* Resumen de derechos y principios esenciales */}
        <div className="bg-white border border-purple-200/80 rounded-2xl p-6 sm:p-7 shadow-xs mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-700 flex-shrink-0" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Garantías de uso y principios transparentes
            </h2>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-700">
            <li className="flex items-start gap-2.5">
              <span className="text-purple-700 font-bold mt-0.5">•</span>
              <span><strong>Vigencia completa de tu período pagado:</strong> Si cancelás la renovación automática de PlayComun Pro, conservás el acceso premium hasta el último día del ciclo ya abonado.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-purple-700 font-bold mt-0.5">•</span>
              <span><strong>Tus datos se conservan:</strong> La finalización de una suscripción no elimina tu cuenta ni borra tus recetas, presupuestos o códigos QR guardados.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-purple-700 font-bold mt-0.5">•</span>
              <span><strong>Operaciones independientes:</strong> Cancelar una renovación, solicitar arrepentimiento de compra o dar de baja una cuenta son trámites claramente diferenciados.</span>
            </li>
          </ul>
        </div>

        {/* Índice de navegación interactivo */}
        <LegalTableOfContents items={TOC_ITEMS} />

        {/* Cuerpo del documento */}
        <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs space-y-8">
          
          <LegalSection id="aceptacion" number={1} title="Aceptación y descripción de la plataforma">
            <p>
              Bienvenido a <strong>PlayComun Online</strong>. Al acceder a este sitio web, registrar una cuenta de usuario o contratar una suscripción Pro, aceptás estos Términos y Condiciones generales. Si no estás de acuerdo con alguna de estas pautas, te solicitamos no utilizar nuestros servicios.
            </p>
            <p>
              PlayComun Online es una plataforma digital que ofrece un catálogo de microherramientas web orientadas a cálculos comerciales, utilidades de oficina, generación de códigos QR, conversión de archivos y administración operativa para profesionales, negocios y emprendedores.
            </p>
          </LegalSection>

          <LegalSection id="modalidades" number={2} title="Modalidades de servicio: Plan Básico y Suscripción Pro">
            <p>
              La plataforma ofrece dos niveles de servicio claramente diferenciados:
            </p>
            <div className="space-y-3.5 pl-3 sm:pl-4 border-l-2 border-purple-300 text-sm sm:text-base text-slate-700">
              <div>
                <strong className="text-slate-900 block font-semibold">Plan Básico (Sin costo):</strong>
                Permite el uso sin cargo de calculadoras comerciales (cuotas con interés, porcentajes, descuentos, margen de ganancia, IVA), herramientas estándar de audio y generadores estáticos sin necesidad obligatoria de suscripción paga.
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">PlayComun Pro (Suscripción paga):</strong>
                Desbloquea almacenamiento en la nube para recetas y costeo de ingredientes, historial guardado de presupuestos comerciales, tandem de códigos QR dinámicos editables y exportación a formatos avanzados con soporte prioritario.
              </div>
            </div>
          </LegalSection>

          <LegalSection id="contratacion" number={3} title="Contratación, precios, facturación y pagos">
            <p>
              Los precios de la suscripción PlayComun Pro se informan en Pesos Argentinos (ARS) en nuestra sección de <Link href="/planes" className="text-purple-700 font-semibold underline hover:text-purple-900">Planes</Link> e incluyen los impuestos aplicables. Las modalidades disponibles son mensual y anual.
            </p>
            <p>
              El procesamiento de pagos y renovaciones se ejecuta a través de la infraestructura segura de <strong>Mercado Pago</strong> mediante débitos automáticos. PlayComun no almacena números de tarjeta, códigos de seguridad (CVV) ni contraseñas bancarias.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 space-y-2">
              <p className="font-bold text-slate-900">Estados de pago y regularización:</p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li><strong>Aprobado:</strong> La pasarela confirma el cobro y la cuenta activa su estado Pro de forma sincronizada.</li>
                <li><strong>Pendiente:</strong> Se aguarda la confirmación final por parte del emisor bancario o billetera.</li>
                <li><strong>Cobro fallido y período de tolerancia:</strong> Si un cobro de renovación automática es rechazado temporalmente por fondos insuficientes, el sistema mantiene el acceso Pro durante tres (3) días corridos mientras la pasarela reintenta la operación.</li>
                <li><strong>Rechazado o revertido:</strong> Si la operación fracasa definitivamente, el acceso Pro queda suspendido hasta la actualización del medio de pago.</li>
              </ul>
            </div>
          </LegalSection>

          <LegalSection id="cancelacion" number={4} title="Regla de cancelación: vigencia del período ya abonado">
            <p>
              En PlayComun Online garantizamos el respeto total de lo que abonaste:
            </p>
            <div className="p-4 sm:p-5 bg-purple-50/80 border border-purple-200 rounded-xl text-sm sm:text-base text-purple-950">
              Cuando cancelás la renovación automática desde tu panel en{" "}
              <Link href="/cuenta/suscripcion" className="text-purple-800 underline font-bold hover:text-purple-950">
                Mi suscripción
              </Link>
              , <strong>mantenés tu acceso premium activo hasta el último día del ciclo que ya pagaste</strong>. No se aplican penalidades ni se efectuarán nuevos débitos.
            </div>
            <p className="text-sm text-slate-600">
              Detener la renovación automática no significa perder tus datos ni eliminar tu cuenta de la plataforma.
            </p>
          </LegalSection>

          <LegalSection id="arrepentimiento" number={5} title="Revocación de la contratación (Botón de arrepentimiento)">
            <p>
              Conforme al artículo 34 de la Ley 24.240 de Defensa del Consumidor, la Resolución 424/2020 y la Disposición 954/2025, tenés derecho a revocar la contratación realizada a distancia dentro del plazo de diez (10) días corridos contados desde la suscripción.
            </p>
            <p>
              Para ejercer este derecho, podés ingresar al{" "}
              <Link href="/arrepentimiento" className="text-purple-700 font-bold underline hover:text-purple-900">
                Botón de arrepentimiento
              </Link>
              . No se exige clave previa para iniciar la solicitud. Dentro de las 24 horas hábiles de recibida la petición, el sistema emitirá un código de constancia y seguimiento.
            </p>
          </LegalSection>

          <LegalSection id="baja-cuenta" number={6} title="Botón de baja de servicio y eliminación de cuenta">
            <p>
              En cumplimiento de la Resolución 271/2020 de la Secretaría de Comercio Interior y la Disposición 954/2025, tenés a tu disposición el{" "}
              <Link href="/baja-servicio" className="text-purple-700 font-bold underline hover:text-purple-900">
                Botón de baja de servicio
              </Link>
              . Si estás autenticado, podés detener la renovación con un clic en tu panel de cuenta.
            </p>
            <p>
              Por otra parte, la <strong>eliminación de cuenta</strong> es un derecho contemplado bajo la Ley 25.326. Si decidís eliminar tu usuario desde <Link href="/cuenta" className="text-purple-700 font-bold underline hover:text-purple-900">Mi Cuenta</Link>, se suprimirán tus credenciales, perfil y listas personales, cancelando toda suscripción vinculada en Mercado Pago.
            </p>
          </LegalSection>

          <LegalSection id="arca" number={7} title="Aviso legal sobre documentos comerciales y ARCA">
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 text-amber-950 text-sm sm:text-base space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" aria-hidden="true" />
                <span>Naturaleza operativa y no fiscal de los documentos</span>
              </div>
              <p>
                Los presupuestos, notas de pedido, cotizaciones o listas elaboradas en PlayComun <strong>son documentos comerciales internos para gestión presupuestaria y organización operativa</strong>.
              </p>
              <p className="font-bold">
                PlayComun Online no emite facturas electrónicas oficiales ni comprobantes fiscales autorizados por la Agencia de Recaudación y Control Aduanero (ARCA).
              </p>
              <p className="text-xs sm:text-sm text-amber-900/90">
                Cada usuario es responsable de emitir sus facturas ante los organismos tributarios y cumplir con los regímenes vigentes de facturación oficial en su jurisdicción.
              </p>
            </div>
          </LegalSection>

          <LegalSection id="seguridad" number={8} title="Usos prohibidos y protección contra abusos">
            <p>
              Queda estrictamente prohibido utilizar los servicios de PlayComun Online para:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>Configurar códigos QR que redirijan a enlaces de suplantación de identidad (phishing), distribución de malware o sitios ilegales.</li>
              <li>Intentar descompilar, sobrecargar, vulnerar o perjudicar la infraestructura técnica y servidores del servicio.</li>
              <li>Ejecutar automatizaciones abusivas que degraden la velocidad de respuesta para el resto de la comunidad.</li>
            </ul>
            <p className="text-xs sm:text-sm text-slate-600">
              PlayComun Online se reserva el derecho de inhabilitar de inmediato enlaces fraudulentos o restringir accesos que comprometan la seguridad de la plataforma.
            </p>
          </LegalSection>

          <LegalSection id="propiedad" number={9} title="Propiedad intelectual y autoría de los resultados">
            <p>
              El código de la aplicación, elementos de diseño gráfico, marcas y logotipos de PlayComun Online son propiedad de sus titulares y están resguardados por las normas de propiedad intelectual aplicables.
            </p>
            <p>
              Los resultados generados legítimamente por el usuario (cálculos matemáticos, imágenes de códigos QR, documentos PDF de presupuesto o archivos transformados) son de exclusiva propiedad y responsabilidad de quien los crea.
            </p>
          </LegalSection>

          <LegalSection id="contacto-legal" number={10} title="Disponibilidad, modificaciones y canal de consultas">
            <p>
              Trabajamos para brindar alta confiabilidad y disponibilidad técnica. No obstante, el servicio puede presentar interrupciones transitorias originadas en tareas de mantenimiento o contingencias de conectividad.
            </p>
            <p>
              Cualquier modificación a estos términos se publicará con indicación de su fecha de vigencia. Para consultas legales o administrativas, nuestro canal de atención es:{" "}
              <a href="mailto:playcomun.ok@gmail.com" className="text-purple-700 font-bold underline hover:text-purple-900">
                playcomun.ok@gmail.com
              </a>.
            </p>
          </LegalSection>

        </article>

      </div>
    </div>
  )
}
