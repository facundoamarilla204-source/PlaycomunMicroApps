'use client'

import Link from 'next/link'
import { ChefHat, ArrowLeft, ShieldCheck, User as UserIcon } from 'lucide-react'

export function CocinaProHeader({
  title,
  subtitle,
  userEmail,
}: {
  title?: string
  subtitle?: string
  userEmail?: string
}) {
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between">
        {/* Lado izquierdo: Mobile branding o título desktop */}
        <div className="flex items-center gap-3">
          {/* Logo visible solo en mobile */}
          <div className="md:hidden flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ChefHat className="h-4.5 w-4.5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                Cocina Pro
              </span>
              <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                Gestión gastronómica
              </span>
            </div>
          </div>

          {/* Título en desktop */}
          <div className="hidden md:block">
            {title && (
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-slate-700 leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Lado derecho: Estado Pro y atajos */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>Pro</span>
          </span>

          <Link
            href="/microapps"
            className="text-xs font-semibold text-slate-700 hover:text-brand transition-colors hidden sm:inline-flex items-center gap-1 py-1 px-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Microapps</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
