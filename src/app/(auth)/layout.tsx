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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      router.push('/')
    }
  }

  const illustrationSrc = pathname === '/registro' ? '/ilustracion_registro.png' : '/ilustracion_iniciosesion.png'

  return (
    <div 
      className="min-h-screen bg-[#1c1c1e] p-4 sm:p-6 md:p-10 flex items-center justify-center font-sans"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px] relative z-10">
        {/* Top Navigation inside card */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95">
            <img src="/logotemanegro.png" alt={siteConfig.name} className="h-10 w-auto" />
          </Link>
          <Link 
            href="/" 
            className="text-sm text-foreground-muted hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
        </div>

        {/* Content split */}
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Left Column (Forms) */}
          <div className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
            {children}
          </div>

          {/* Right Column (Benefits & Illustration) */}
          <div className="flex-1 bg-[#F8F7FC] p-6 sm:p-10 md:p-12 flex flex-col justify-center hidden md:flex">
            <div className="max-w-md mx-auto w-full">
              <div 
                className="aspect-[4/3] rounded-2xl mb-8 relative transition-all duration-500 scale-[1.25]"
                style={{
                  backgroundImage: `url(${illustrationSrc})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Benefits */}
              <div className="px-4">
                <h3 className="font-semibold text-lg text-foreground mb-4">Tu espacio de herramientas</h3>
                <ul className="space-y-3">
                  {[
                    "Guardá tus favoritas",
                    "Usalas desde cualquier dispositivo",
                    "Gratis y sin tarjeta",
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground-muted text-sm">
                      <div className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-brand">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {benefit}
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
