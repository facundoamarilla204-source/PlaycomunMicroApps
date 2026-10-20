import { buildMetadata } from "@/lib/metadata"
import { Shield, Lock, Laptop, Cloud, FileCode } from "lucide-react"
import Link from "next/link"
import { LegalHeader } from "@/components/legal/LegalHeader"
import { LegalTableOfContents, TocItem } from "@/components/legal/LegalTableOfContents"
import { LegalSection } from "@/components/legal/LegalSection"

export const metadata = buildMetadata({
  title: "Política de privacidad y protección de datos",
  description: "Conocé cómo tratamos y protegemos tus datos en PlayComun Online. Información clara sobre almacenamiento local, servidores, pagos y derechos bajo la Ley 25.326.",
  path: "/privacidad",
})

const TOC_ITEMS: TocItem[] = [
  { id: "responsable", number: 1, title: "Responsable y contacto" },
  { id: "procesamiento", number: 2, title: "Procesamiento local vs nube" },
  { id: "datos-recopilados", number: 3, title: "Datos recopilados" },
  { id: "pagos", number: 4, title: "Pagos y Mercado Pago" },
  { id: "infraestructura", number: 5, title: "Proveedores de infraestructura" },
  { id: "conservacion", number: 6, title: "Conservación de datos Pro" },
  { id: "derechos", number: 7, title: "Derechos bajo la Ley 25.326" },
  { id: "seguridad-datos", number: 8, title: "Medidas de seguridad" },
  { id: "cookies", number: 9, title: "Cookies y almacenamiento" },
]

export default function PrivacidadPage() {
  const lastUpdated = "16 de octubre de 2026"

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado con breadcrumbs y metadatos */}
        <LegalHeader
          badgeLabel="Protección de datos personales"
          badgeIcon={<Shield className="w-3.5 h-3.5" aria-hidden="true" />}
          title="Política de Privacidad"
          description="Explicación clara sobre el tratamiento de datos, herramientas con procesamiento en tu navegador, seguridad de pagos y derechos amparados por la Ley 25.326."
          lastUpdated={lastUpdated}
          breadcrumbs={[{ label: "Política de privacidad" }]}
        />

        {/* Resumen de compromiso */}
        <div className="bg-white border border-purple-200/80 rounded-2xl p-6 sm:p-7 shadow-xs mb-8 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-700 flex-shrink-0" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Privacidad por diseño en PlayComun Online
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            Gran parte de nuestras herramientas de cálculo y utilidades operan directamente en tu navegador, sin enviar datos a servidores remotos. Cuando iniciás sesión o contratás una suscripción Pro, los datos guardados se protegen conforme a las exigencias de la Ley 25.326 de Protección de los Datos Personales de la República Argentina.
          </p>
        </div>

        {/* Índice interactivo */}
        <LegalTableOfContents items={TOC_ITEMS} />

        {/* Cuerpo del documento */}
        <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs space-y-8">
          
          <LegalSection id="responsable" number={1} title="Responsable del tratamiento y canal oficial">
            <p>
              El servicio <strong>PlayComun Online</strong> brinda microherramientas web de productividad, utilidades comerciales y cálculo para profesionales, creadores y pymes.
            </p>
            <p>
              Para cualquier consulta sobre el tratamiento de tus datos personales, ejercicio de tus derechos legales o dudas sobre esta política, podés escribirnos al correo:{" "}
              <a href="mailto:playcomun.ok@gmail.com" className="text-purple-700 font-bold underline hover:text-purple-900">
                playcomun.ok@gmail.com
              </a>.
            </p>
          </LegalSection>

          <LegalSection id="procesamiento" number={2} title="Procesamiento en tu navegador vs almacenamiento en la nube">
            <p>
              Para mayor transparencia, diferenciamos con precisión cómo funciona cada tipo de herramienta:
            </p>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
                  <Laptop className="w-4 h-4 text-purple-700" aria-hidden="true" />
                  <span>1. Herramientas con ejecución local (En tu dispositivo)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Las calculadoras comerciales (cuotas con interés, margen de ganancia, porcentajes, IVA), los códigos QR estáticos y el recortador de audio operan dentro de tu propio navegador mediante tecnologías web estándar. Los cálculos y los archivos de audio seleccionados no se envían a nuestros servidores permanentes.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-purple-950 text-sm sm:text-base">
                  <Cloud className="w-4 h-4 text-purple-700" aria-hidden="true" />
                  <span>2. Herramientas con almacenamiento en la nube (Funciones Pro)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Al utilizar funciones asociadas a tu cuenta (como el guardado de recetas y costos, historial de presupuestos comerciales o tandas de códigos QR dinámicos), los datos que decidís guardar se transmiten de forma cifrada para posibilitar la sincronización entre tus dispositivos.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
                  <FileCode className="w-4 h-4 text-purple-700" aria-hidden="true" />
                  <span>3. Conversión de archivos</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Las utilidades de conversión de formatos de oficina transfieren temporalmente el archivo a un servicio de procesamiento técnico seguro. El archivo convertido se descarga a tu equipo y se suprime automáticamente del entorno de trabajo una vez concluida la tarea.
                </p>
              </div>
            </div>
          </LegalSection>

          <LegalSection id="datos-recopilados" number={3} title="Datos que recopilamos según tu interacción">
            <p>
              Recopilamos únicamente la información necesaria para el funcionamiento de los servicios solicitados:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 text-sm sm:text-base">
              <li>
                <strong className="text-slate-900">Registro e inicio de sesión:</strong> Correo electrónico y credenciales seguras mediante Supabase Auth. Si iniciás sesión con Google, recibimos tu nombre, email y avatar provisto por Google OAuth.
              </li>
              <li>
                <strong className="text-slate-900">Información guardada por el usuario Pro:</strong> Ingredientes, cantidades y costos de recetas, clientes y conceptos de presupuestos, o destinos web de tus códigos QR dinámicos.
              </li>
              <li>
                <strong className="text-slate-900">Consultas de soporte:</strong> Nombre, email y texto del mensaje para responder tus inquietudes o gestionar trámites de arrepentimiento o baja.
              </li>
              <li>
                <strong className="text-slate-900">Registros técnicos de seguridad:</strong> Dirección IP y agente de usuario con fines estrictos de protección frente a abusos, prevención de fraudes y límites de solicitudes.
              </li>
            </ul>
          </LegalSection>

          <LegalSection id="pagos" number={4} title="Tratamiento de pagos y Mercado Pago">
            <p>
              El cobro de la suscripción PlayComun Pro se ejecuta a través de la pasarela de pagos <strong>Mercado Pago</strong>.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-sm text-slate-700 space-y-2">
              <p className="font-bold text-slate-900">Resguardo estricto de datos financieros:</p>
              <p className="leading-relaxed">
                PlayComun Online <strong>no recopila, no procesa ni almacena números completos de tarjetas de crédito o débito, códigos de seguridad (CVV) ni contraseñas bancarias</strong>. La transacción se procesa directamente en los servidores de Mercado Pago bajo estándares de seguridad PCI-DSS. PlayComun solo recibe el estado de la suscripción, identificador de operación y, si está disponible, los últimos cuatro dígitos de la tarjeta para que puedas identificar tu medio de pago en tu panel.
              </p>
            </div>
          </LegalSection>

          <LegalSection id="infraestructura" number={5} title="Proveedores de infraestructura y transferencias">
            <p>
              Para asegurar alta disponibilidad y protección técnica, trabajamos con infraestructura de primer nivel:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 text-sm sm:text-base">
              <li>
                <strong className="text-slate-900">Vercel Inc.:</strong> Alojamiento de la aplicación web, entrega global de contenido y funciones de servidor.
              </li>
              <li>
                <strong className="text-slate-900">Supabase Inc.:</strong> Base de datos PostgreSQL con aislamiento estricto de información mediante políticas de seguridad por fila (Row Level Security).
              </li>
              <li>
                <strong className="text-slate-900">Mercado Pago:</strong> Procesamiento de transacciones y cobros periódicos en moneda local.
              </li>
              <li>
                <strong className="text-slate-900">Resend Inc.:</strong> Entrega segura de correos transaccionales y notificaciones de cuenta.
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-slate-600">
              Estos proveedores pueden procesar información en centros de datos ubicados en el exterior bajo rigurosos protocolos internacionales de ciberseguridad.
            </p>
          </LegalSection>

          <LegalSection id="conservacion" number={6} title="Conservación de datos al finalizar una suscripción Pro">
            <p>
              En PlayComun Online, <strong>la finalización o cancelación de una suscripción Pro no provoca la eliminación de tu cuenta ni el borrado de tus registros</strong>.
            </p>
            <p>
              Tus recetas, presupuestos y códigos QR guardados permanecen resguardados de forma segura en la base de datos asociada a tu perfil. Cuando una herramienta requiera plan Pro activo, tus datos se mantienen intactos y podrás volver a operar con ellos en cuanto reactives tu suscripción.
            </p>
          </LegalSection>

          <LegalSection id="derechos" number={7} title="Derechos del titular de los datos (Ley 25.326 - Argentina)">
            <p>
              De acuerdo con la Ley Nacional 25.326 de Protección de los Datos Personales, tenés reconocidos los derechos de acceso, rectificación, actualización y supresión de tus datos personales:
            </p>
            <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-purple-300 text-sm sm:text-base text-slate-700">
              <div>
                <strong className="text-slate-900 block font-semibold">Acceso y rectificación:</strong>
                Podés verificar y actualizar tu información de perfil directamente en la sección <Link href="/cuenta" className="text-purple-700 font-bold underline hover:text-purple-900">Mi Cuenta</Link>.
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">Supresión o baja de cuenta:</strong>
                Podés solicitar la eliminación definitiva de tu usuario desde la configuración de tu cuenta o mediante correo a <a href="mailto:playcomun.ok@gmail.com" className="text-purple-700 font-bold underline hover:text-purple-900">playcomun.ok@gmail.com</a>. Esto borrará tus datos y cancelará toda renovación vinculada en Mercado Pago, conservándose únicamente los registros contables que la legislación fiscal exija mantener archivados.
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 pt-2">
              La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
            </p>
          </LegalSection>

          <LegalSection id="seguridad-datos" number={8} title="Medidas de seguridad y límites">
            <p>
              Implementamos salvaguardas técnicas y organizativas para proteger la confidencialidad de tus datos: tráfico cifrado de extremo a extremo mediante HTTPS/TLS, autenticación criptográfica de contraseñas, políticas de aislamiento por usuario en base de datos y control de accesos restringido.
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              A pesar de estas previsiones, ningún sistema conectado a internet resulta completamente invulnerable frente a contingencias extremas fuera del control razonable de la plataforma.
            </p>
          </LegalSection>

          <LegalSection id="cookies" number={9} title="Cookies y almacenamiento local">
            <p>
              Utilizamos cookies técnicas y almacenamiento local en el navegador (localStorage) con fines estrictamente funcionales:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-sm sm:text-base">
              <li>Mantener activa tu sesión de usuario autenticado de forma segura.</li>
              <li>Recordar preferencias y valores temporales en calculadoras dentro de tu dispositivo.</li>
              <li>Prevenir ataques de falsificación de peticiones en sitios cruzados (CSRF).</li>
            </ul>
            <p className="text-xs sm:text-sm text-slate-600">
              No empleamos cookies de rastreo publicitario invasivo ni comercializamos perfiles de navegación con redes de anuncios de terceros.
            </p>
          </LegalSection>

        </article>

      </div>
    </div>
  )
}
