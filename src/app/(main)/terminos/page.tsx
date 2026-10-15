import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "Términos y condiciones",
  description: "Términos y condiciones de uso de PlayComun Herramientas.",
  path: "/terminos",
})

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] py-12 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col gap-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Términos de Servicio
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Última actualización: Octubre 2026
          </p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none bg-white p-8 sm:p-12 border border-border/60 rounded-3xl shadow-sm">
          <p>
            Al acceder y utilizar PlayComun, aceptás cumplir con los siguientes Términos y Condiciones de uso. Si no estás de acuerdo con alguna parte de estos términos, por favor no utilices nuestro sitio web.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Uso del Servicio</h2>
          <p>
            Nuestras herramientas están proporcionadas para uso personal y profesional. Está prohibido el uso de nuestros servicios para cualquier propósito ilegal o no autorizado.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Cuentas de Usuario</h2>
          <p>
            Al crear una cuenta, sos responsable de mantener la seguridad de tu contraseña y cuenta. Nos reservamos el derecho de suspender o cancelar cuentas que violen nuestros términos o realicen un uso indebido de los recursos del servidor.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Propiedad Intelectual</h2>
          <p>
            El diseño, código, logotipos y todo el contenido del sitio web son propiedad intelectual de PlayComun y están protegidos por las leyes de derechos de autor aplicables.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Limitación de Responsabilidad</h2>
          <p>
            Aunque nos esforzamos por garantizar la precisión de nuestras herramientas (calculadoras, generadores, utilidades), PlayComun se proporciona "tal cual" sin garantías de ningún tipo. No seremos responsables por pérdidas, daños o decisiones comerciales basadas en los resultados generados por nuestras herramientas.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado del sitio después de cualquier cambio constituye tu aceptación de los nuevos términos.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Contacto</h2>
          <p>
            Para consultas sobre estos términos, por favor comunicate a <strong>soporte@playcomun.com</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
