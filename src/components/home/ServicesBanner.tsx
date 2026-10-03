import { siteConfig } from "@/config/site"
import { ArrowRight } from "lucide-react"

export default function ServicesBanner() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-[#F9F9FB] p-10 sm:p-14">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            
            <div className="max-w-xl relative z-10">
              <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest text-brand">
                ¿NECESITÁS ALGO A MEDIDA?
              </span>
              <h2 className="mb-5 text-4xl sm:text-5xl font-extrabold tracking-tighter text-[#0F172A] leading-[1.1] text-balance">
                También desarrollamos aplicaciones web y SaaS
              </h2>
              <p className="mb-8 text-lg text-foreground-muted leading-relaxed max-w-md text-balance">
                Si tenés una idea o necesitás una solución personalizada, podemos ayudarte.
              </p>
              <a
                href={siteConfig.mainSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 font-medium text-white shadow-sm shadow-brand/20 transition-all duration-300 hover:bg-brand-hover hover:shadow-md hover:shadow-brand/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                Ver el portfolio
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="flex justify-center lg:justify-end relative h-full min-h-[280px]">
              {/* Illustration container */}
              <div className="relative w-full max-w-md flex items-center justify-center">
                
                {/* Background decorative UI elements */}
                <div className="absolute left-0 top-8 flex flex-col gap-3 opacity-60 mix-blend-multiply">
                  <div className="h-10 w-24 rounded-lg bg-[#E0E7FF] border border-[#C7D2FE] p-2 flex flex-col gap-1.5 shadow-sm transform -translate-x-4">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#A5B4FC]"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-[#A5B4FC]"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-[#A5B4FC]"></div>
                    </div>
                    <div className="h-1.5 w-12 rounded-full bg-[#A5B4FC]"></div>
                  </div>
                  <div className="h-16 w-32 rounded-lg bg-[#E0E7FF] border border-[#C7D2FE] p-3 flex flex-col gap-2 shadow-sm transform translate-x-2">
                    <div className="h-1.5 w-8 rounded-full bg-[#A5B4FC]"></div>
                    <div className="h-1.5 w-full rounded-full bg-[#A5B4FC]"></div>
                    <div className="h-1.5 w-16 rounded-full bg-[#A5B4FC]"></div>
                  </div>
                  <div className="h-8 w-20 rounded-lg bg-[#E0E7FF] border border-[#C7D2FE] p-2 flex items-center shadow-sm transform translate-x-6">
                    <div className="h-1.5 w-12 rounded-full bg-[#A5B4FC]"></div>
                  </div>
                </div>

                {/* Main Code Window */}
                <div className="relative z-10 w-72 rounded-xl bg-white shadow-2xl shadow-brand/10 ring-1 ring-black/5 transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500">
                  {/* Window Header */}
                  <div className="flex items-center gap-2 rounded-t-xl bg-brand px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/30"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-white/30"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-white/30"></div>
                  </div>
                  {/* Window Body */}
                  <div className="flex h-40 items-center justify-center p-6 text-brand">
                    <span className="font-mono text-6xl font-bold tracking-tighter opacity-90">
                      &lt;/&gt;
                    </span>
                  </div>
                </div>

                {/* Hand-drawn text and arrow overlay */}
                <div className="absolute -right-8 top-1/4 translate-x-8 hidden lg:flex flex-col items-center">
                  <p 
                    className="text-xl text-brand text-center max-w-[140px] leading-tight rotate-[6deg] drop-shadow-sm"
                    style={{ fontFamily: '"Caveat", "Comic Sans MS", cursive' }}
                  >
                    Tu idea, nuestra tecnología
                  </p>
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 60 45"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-brand drop-shadow-sm -ml-16 mt-1 rotate-[-15deg]"
                  >
                    <path
                      d="M58 2C45 10 25 15 5 35"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 35C12 35 18 31 18 31"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 35C5 28 8 20 8 20"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
