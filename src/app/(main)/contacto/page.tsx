import { Mail, MessageSquare, MapPin } from "lucide-react"

export const metadata = {
  title: "Contacto | PlayComun",
  description: "Contactate con el equipo de PlayComun",
}

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] py-12 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Contacto
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            ¿Tenés alguna duda, sugerencia o problema? Escribinos.
          </p>
        </div>

        <div className="bg-white border border-border/60 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-900">Nuestros Canales</h2>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand flex-shrink-0 mt-1">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Email</h3>
                  <p className="text-slate-500 text-sm mb-2">Para consultas generales y soporte técnico.</p>
                  <a href="mailto:soporte@playcomun.com" className="text-brand font-medium hover:underline">
                    soporte@playcomun.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand flex-shrink-0 mt-1">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Redes Sociales</h3>
                  <p className="text-slate-500 text-sm mb-2">Seguinos para enterarte de nuevas herramientas.</p>
                  <a href="#" className="text-brand font-medium hover:underline">
                    @PlayComun
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8">
              <h3 className="font-bold text-slate-900 mb-4">Preguntas Frecuentes</h3>
              <ul className="space-y-4">
                <li>
                  <strong className="block text-sm text-slate-900 mb-1">¿Las herramientas son gratuitas?</strong>
                  <span className="text-sm text-slate-500 block">Sí, todo nuestro catálogo actual es 100% gratuito.</span>
                </li>
                <li>
                  <strong className="block text-sm text-slate-900 mb-1">¿Necesito cuenta para usarlas?</strong>
                  <span className="text-sm text-slate-500 block">No, pero te permite guardar favoritas.</span>
                </li>
                <li>
                  <strong className="block text-sm text-slate-900 mb-1">Encontré un error, ¿qué hago?</strong>
                  <span className="text-sm text-slate-500 block">Por favor, envianos un email con los detalles.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
