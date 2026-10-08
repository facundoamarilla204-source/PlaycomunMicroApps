import { siteConfig } from "@/config/site"
import { ArrowRight, ExternalLink } from "lucide-react"

export default function ServicesBanner() {
  return (
    <section id="servicios" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-[#F9F9FB] p-10 sm:p-14">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
            
            <div className="max-w-xl">
              <img src="/otter-hero.png" alt="PlayComun Nutria" className="mb-8 h-32 w-auto object-contain drop-shadow-sm" />
              <h2 className="mb-5 text-4xl sm:text-5xl font-extrabold text-[#0F172A] leading-[1.1] text-balance">
                También desarrollamos software a medida
              </h2>
              <p className="mb-8 text-lg text-foreground-muted leading-relaxed max-w-md text-balance">
                Creamos herramientas específicas para tu operación diaria. Sistemas de gestión, automatización de procesos y plataformas SaaS.
              </p>
              <a
                href={siteConfig.organization.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 font-semibold text-white shadow-sm transition-all duration-300 hover:bg-brand-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                Ver más proyectos
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <p className="mt-8 text-sm font-medium text-foreground-subtle">
                Hecho en Argentina por <a href={siteConfig.organization.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">PlayComun</a>.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {/* FitAdmi Project */}
              <a 
                href="https://fitadmi.vercel.app" 
                target="_blank" 
                rel="noreferrer"
                className="group block rounded-2xl border border-border bg-white p-6 transition-all hover:border-brand/40 hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors">FitAdmi</h3>
                  <ExternalLink className="h-5 w-5 text-foreground-subtle group-hover:text-brand transition-colors" />
                </div>
                <p className="text-foreground-muted">
                  Plataforma integral de gestión para gimnasios y centros de entrenamiento. Control de cuotas, accesos y rutinas.
                </p>
                <div className="mt-4 text-sm font-medium text-brand">fitadmi.vercel.app</div>
              </a>

              {/* Mercury Project */}
              <a 
                href="https://mercuryeventos.online" 
                target="_blank" 
                rel="noreferrer"
                className="group block rounded-2xl border border-border bg-white p-6 transition-all hover:border-brand/40 hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors">Mercury</h3>
                  <ExternalLink className="h-5 w-5 text-foreground-subtle group-hover:text-brand transition-colors" />
                </div>
                <p className="text-foreground-muted">
                  Sistema de gestión y acreditación para eventos. Venta de entradas, control de accesos QR y estadísticas en tiempo real.
                </p>
                <div className="mt-4 text-sm font-medium text-brand">mercuryeventos.online</div>
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
