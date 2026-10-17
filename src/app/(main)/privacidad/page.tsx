import { buildMetadata } from "@/lib/metadata"
import { Shield, Lock, Database, Eye, RefreshCw, FileText, Mail } from "lucide-react"
import Link from "next/link"

export const metadata = buildMetadata({
  title: "Política de privacidad y protección de datos",
  description: "Conocé cómo tratamos y protegemos tus datos en PlayComun Online. Información clara sobre almacenamiento local, servidores, pagos y derechos bajo la Ley 25.326.",
  path: "/privacidad",
})

export default function PrivacidadPage() {
  const lastUpdated = "16 de octubre de 2026"

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 mb-4">
            <Shield className="w-3.5 h-3.5" /> Transparencia y Privacidad
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Política de Privacidad
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Resumen ejecutivo destacado */}
        <div className="bg-white border border-purple-100 rounded-2xl p-6 sm:p-8 shadow-xs mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            Compromiso de privacidad de PlayComun Online
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            En PlayComun Online creemos en el control y la transparencia. Gran parte de nuestras herramientas de cálculo y utilidades operan exclusivamente en tu navegador, sin enviar datos a nuestros servidores. Cuando iniciás sesión o contratás una suscripción Pro, los datos se resguardan de forma segura conforme a la Ley 25.326 de Protección de los Datos Personales de la República Argentina.
          </p>
        </div>

        {/* Cuerpo del documento */}
        <article className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-12 shadow-xs space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">1</span>
              Responsable del tratamiento y contacto
            </h2>
            <p>
              El servicio <strong>PlayComun Online</strong> es operado con la finalidad de brindar microherramientas web de productividad, utilidades comerciales y cálculo para profesionales, negocios y creadores de contenido.
            </p>
            <p>
              Para cualquier consulta sobre el tratamiento de tus datos personales, ejercicio de derechos o aclaraciones sobre esta política, podés comunicarte directamente con nuestro canal de atención por correo electrónico a:{" "}
              <a href="mailto:playcomun.ok@gmail.com" className="text-purple-600 font-bold hover:underline">
                playcomun.ok@gmail.com
              </a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">2</span>
              Procesamiento en el navegador vs. procesamiento en servidores
            </h2>
            <p>
              Es fundamental distinguir cómo operan las diferentes funciones de nuestra plataforma:
            </p>
            <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-purple-200">
              <div>
                <strong className="text-slate-900 block font-semibold">Herramientas de ejecución local en el navegador:</strong>
                <p className="text-slate-600 text-sm">
                  Las calculadoras (porcentajes, cuotas, descuentos, margen comercial, IVA), los códigos QR estáticos y el recortador de audio procesan la información de manera local en tu propio dispositivo mediante tecnologías como WebAssembly y Canvas. Los valores calculados y los archivos de audio seleccionados no se suben a nuestros servidores permanentes.
                </p>
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">Herramientas con almacenamiento y procesamiento en la nube:</strong>
                <p className="text-slate-600 text-sm">
                  Cuando utilizás funciones vinculadas a tu cuenta (como el guardado de recetas, control de gastos, listas de precios, tandas de códigos QR dinámicos o historial de presupuestos comerciales), la información requerida se envía de forma encriptada y se almacena en nuestra base de datos para permitir la sincronización entre tus dispositivos.
                </p>
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">Conversión de documentos:</strong>
                <p className="text-slate-600 text-sm">
                  Las herramientas de conversión de formatos de oficina transmiten temporalmente los archivos a un servicio especializado para procesar la transformación de formato. Estos archivos se eliminan automáticamente tras finalizar la conversión o descarga.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">3</span>
              Datos recopilados según el uso de la plataforma
            </h2>
            <p>Recopilamos únicamente los datos necesarios para brindar los servicios solicitados:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm sm:text-base">
              <li>
                <strong className="text-slate-900">Al registrarte o iniciar sesión:</strong> Correo electrónico, contraseña encriptada (mediante Supabase Auth) y, de forma opcional, tu nombre completo para personalizar tu cuenta. Si utilizás inicio de sesión con Google, recibimos tu nombre, email y avatar provisto por el proveedor de autenticación.
              </li>
              <li>
                <strong className="text-slate-900">Al utilizar herramientas Pro:</strong> Datos que decidís guardar de forma activa, tales como ingredientes de recetas, movimientos de ingresos y gastos, productos de listas de precios, enlaces de destino para códigos QR dinámicos y datos comerciales para presupuestos.
              </li>
              <li>
                <strong className="text-slate-900">Al enviar consultas de contacto o solicitudes:</strong> Nombre, email, mensaje y los detalles necesarios para responder tu inquietud o gestionar trámites de arrepentimiento o baja.
              </li>
              <li>
                <strong className="text-slate-900">Registros técnicos mínimos:</strong> Dirección IP y agente de usuario con fines estrictos de seguridad, prevención de abuso en endpoints sensibles y cumplimiento de tasas de límite de solicitudes (rate limiting).
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">4</span>
              Tratamiento de pagos y Mercado Pago
            </h2>
            <p>
              La contratación y cobro recurrente de la suscripción PlayComun Pro se realiza a través de la pasarela de pagos <strong>Mercado Pago</strong>.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900 mb-1">Privacidad financiera estricta:</p>
              PlayComun Online <strong>no recopila, no procesa ni almacena números completos de tarjetas de crédito o débito, códigos de seguridad (CVV) ni contraseñas bancarias</strong>. La transacción se procesa directamente en los servidores seguros de Mercado Pago. PlayComun únicamente recibe un identificador de suscripción, el estado del cobro, el importe pagado y, si el proveedor lo envía, los últimos cuatro dígitos de la tarjeta para que puedas identificar tu medio de pago en tu panel de cuenta.
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">5</span>
              Proveedores de infraestructura y transferencias internacionales
            </h2>
            <p>
              Para prestar un servicio rápido, seguro y disponible de forma continua, nos apoyamos en proveedores tecnológicos de primer nivel:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
              <li>
                <strong className="text-slate-900">Vercel Inc.:</strong> Alojamiento de la aplicación web, entrega de contenido y ejecución de funciones de servidor.
              </li>
              <li>
                <strong className="text-slate-900">Supabase Inc.:</strong> Infraestructura de base de datos PostgreSQL, gestión de sesiones y almacenamiento con políticas de aislamiento de datos (Row Level Security).
              </li>
              <li>
                <strong className="text-slate-900">Mercado Pago:</strong> Procesamiento de pagos, suscripciones y facturación en moneda local.
              </li>
              <li>
                <strong className="text-slate-900">Resend Inc.:</strong> Servicio para el envío de notificaciones por correo electrónico (cuando está configurado).
              </li>
            </ul>
            <p className="text-xs text-slate-500">
              Estos proveedores pueden procesar información en servidores ubicados fuera de la República Argentina bajo estándares internacionales de protección y seguridad de datos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">6</span>
              Conservación de datos al finalizar una suscripción Pro
            </h2>
            <p>
              Una regla fundamental de PlayComun Online es que <strong>la pérdida, vencimiento o cancelación de una suscripción Pro no implica la eliminación automática de tu cuenta ni de los datos que hayas creado</strong>.
            </p>
            <p>
              Tus recetas guardadas, historial de presupuestos, tandas de códigos QR y registros de control de gastos permanecen resguardados de forma segura en la base de datos asociada a tu usuario. Cuando una función premium deje de estar disponible por encontrarse vencido el plan, los datos se mantienen conservados y recuperarás el acceso completo e inmediato a ellos al reactivar tu suscripción Pro, de acuerdo con los términos y políticas razonables de mantenimiento del servicio.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">7</span>
              Derechos del usuario (Ley 25.326 de la República Argentina)
            </h2>
            <p>
              Conforme a la Ley Nacional 25.326 de Protección de los Datos Personales, sos titular de los derechos de acceso, rectificación, actualización y supresión de tus datos personales:
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <strong className="text-slate-900">Acceso y rectificación:</strong> Podés consultar y modificar tu nombre y datos personales directamente desde la sección de configuración de tu cuenta en <Link href="/cuenta" className="text-purple-600 font-semibold hover:underline">Mi Cuenta</Link>.
              </p>
              <p>
                <strong className="text-slate-900">Supresión o eliminación de cuenta:</strong> Podés solicitar la eliminación definitiva de tu cuenta desde la sección correspondiente en tu panel de usuario o enviando un correo a <a href="mailto:playcomun.ok@gmail.com" className="text-purple-600 font-semibold hover:underline">playcomun.ok@gmail.com</a>. La supresión eliminará tus datos personales e historial operativo, salvo aquellos registros de comprobantes de pago que deban conservarse por imperio de obligaciones legales, fiscales o contables aplicables.
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">8</span>
              Medidas de seguridad y límites
            </h2>
            <p>
              Adoptamos medidas técnicas y organizativas para resguardar la integridad y confidencialidad de la información: comunicaciones bajo protocolo seguro HTTPS/TLS, autenticación criptográfica de contraseñas, políticas estrictas de aislamiento de datos en base de datos (Row Level Security en Supabase) y controles de acceso restringidos.
            </p>
            <p className="text-xs text-slate-500">
              Sin embargo, ningún método de transmisión por internet o almacenamiento electrónico es cien por ciento inexpugnable. Por ello, no es posible garantizar seguridad absoluta ante incidentes de fuerza mayor o vulneraciones globales fuera del control razonable de la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">9</span>
              Cookies y almacenamiento local
            </h2>
            <p>
              Utilizamos cookies esenciales y almacenamiento local del navegador (localStorage) para permitir el funcionamiento técnico del sitio:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
              <li>Mantener activa tu sesión de usuario autenticado de forma segura.</li>
              <li>Recordar preferencias locales en calculadoras y generadores en tu dispositivo.</li>
              <li>Prevenir ataques de falsificación de peticiones en sitios cruzados (CSRF).</li>
            </ul>
            <p className="text-xs text-slate-500">
              No utilizamos cookies de rastreo invasivo de terceros con fines de comercialización de perfiles publicitarios.
            </p>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Canal de consultas
            </h2>
            <p className="text-sm text-slate-600">
              Para ejercer cualquiera de tus derechos o solicitar aclaraciones sobre esta política, escribinos a:{" "}
              <a href="mailto:playcomun.ok@gmail.com" className="text-purple-600 font-bold hover:underline">
                playcomun.ok@gmail.com
              </a>
              .
            </p>
          </section>

        </article>

      </div>
    </div>
  )
}
