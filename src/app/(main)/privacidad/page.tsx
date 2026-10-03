export const metadata = {
  title: "Política de Privacidad | PlayComun",
  description: "Política de Privacidad de PlayComun",
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] py-12 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col gap-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Política de Privacidad
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Última actualización: Octubre 2026
          </p>
        </div>

        <div className="prose prose-slate prose-lg max-w-none bg-white p-8 sm:p-12 border border-border/60 rounded-3xl shadow-sm">
          <p>
            En PlayComun valoramos tu privacidad. Esta política de privacidad describe qué información recopilamos, cómo la usamos y cómo la protegemos cuando utilizás nuestros servicios.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Información que recopilamos</h2>
          <p>
            Al registrarte, recopilamos información básica como tu nombre y dirección de correo electrónico. También podemos recopilar datos de uso anónimos para mejorar la calidad de nuestras herramientas y la experiencia de usuario.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Uso de la información</h2>
          <p>
            Utilizamos tu información personal exclusivamente para brindarte acceso a tu cuenta, permitirte guardar herramientas favoritas y comunicarnos con vos sobre actualizaciones de nuestros servicios.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Protección de datos</h2>
          <p>
            Implementamos medidas de seguridad de la industria para proteger tu información contra acceso no autorizado, alteración, divulgación o destrucción. No vendemos, intercambiamos ni transferimos tu información a terceros externos sin tu consentimiento.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Cookies</h2>
          <p>
            Nuestro sitio utiliza cookies para mejorar tu experiencia, mantener tu sesión iniciada de manera segura y analizar el tráfico de nuestro sitio. Podés configurar tu navegador para que rechace las cookies, aunque esto podría afectar el funcionamiento de algunas partes del sitio.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Contacto</h2>
          <p>
            Si tenés preguntas sobre esta política de privacidad, por favor contactanos a <strong>soporte@playcomun.com</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
