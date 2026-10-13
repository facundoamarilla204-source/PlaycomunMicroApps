"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { siteConfig } from "@/config/site"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const illustrationSrc = pathname === '/registro' ? '/ilustracion_registro.png' : '/ilustracion_iniciosesion.png'

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 sm:py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
        {/* Top Header inside card */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:opacity-90 active:scale-95">
            <img src="/logotemanegro.png" alt={siteConfig.name} className="h-9 w-auto" />
          </Link>
          <Link 
            href="/" 
            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors p-2 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a las herramientas</span>
          </Link>
        </div>

        {/* Content split */}
        <div className="flex flex-1 flex-col md:flex-row items-stretch">
          {/* Left Column (Forms) */}
          <div className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
            {children}
          </div>

          {/* Right Column (Benefits & Illustration) */}
          <div className="flex-1 bg-gradient-to-br from-purple-50/50 via-slate-50/60 to-purple-50/30 p-8 sm:p-10 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center hidden md:flex">
            <div className="max-w-sm mx-auto w-full space-y-6">
              <div className="flex items-center justify-center py-2">
                <img 
                  src={illustrationSrc} 
                  alt="PlayComun" 
                  className="max-h-60 w-auto object-contain drop-shadow-sm select-none"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>

              {/* Benefits */}
              <div className="p-5 bg-white/90 rounded-2xl border border-purple-100/70 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900">
                  Tu cuenta gratuita en PlayComun
                </h3>
                <ul className="space-y-2.5">
                  {[
                    "Acceso permanente a todas tus calculadoras",
                    "Guardá herramientas favoritas en tu barra rápida",
                    "Sin tarjeta de crédito obligatoria",
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-600 text-xs font-medium">
                      <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
