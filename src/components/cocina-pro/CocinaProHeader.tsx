'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ArrowLeft } from 'lucide-react'
import { AmasiaLogo } from '@/components/microapps/AmasiaLogo'
import { getActiveAmasiaNavItem } from '@/lib/gastronomia/navigation'

interface CocinaProHeaderProps {
  onOpenDrawer: () => void
  isDrawerOpen?: boolean
  userEmail?: string
}

export function CocinaProHeader({
  onOpenDrawer,
  isDrawerOpen = false,
}: CocinaProHeaderProps) {
  const pathname = usePathname()
  const activeItem = getActiveAmasiaNavItem(pathname)

  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 sm:px-4 py-2 flex items-center justify-between gap-2">
      {/* Botón de Menú y Marca / Sección */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95"
          aria-label="Abrir menú de navegación de Amasia"
          aria-expanded={isDrawerOpen}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/cocina-pro"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg group min-w-0"
        >
          <div className="h-8 w-8 shrink-0 flex items-center justify-center">
            <AmasiaLogo variant="symbol" className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 leading-tight block truncate font-['Fugaz_One']">
              Amasia
            </span>
            <span className="text-[10px] text-[#7f22fe] font-semibold leading-tight block truncate">
              {activeItem ? activeItem.name : 'Gestión gastronómica'}
            </span>
          </div>
        </Link>
      </div>

      {/* Acciones y enlace a Microapps */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>Pro</span>
        </span>

        <Link
          href="/microapps"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Volver a Microapps"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden xs:inline">Microapps</span>
        </Link>
      </div>
    </header>
  )
}
