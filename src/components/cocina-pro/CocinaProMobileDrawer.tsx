'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  X,
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AmasiaLogo } from '@/components/microapps/AmasiaLogo'
import {
  AMASIA_NAV_GROUPS,
  isAmasiaItemActive,
  type AmasiaNavItem,
} from '@/lib/gastronomia/navigation'

interface CocinaProMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export function CocinaProMobileDrawer({
  isOpen,
  onClose,
  userEmail,
}: CocinaProMobileDrawerProps) {
  const pathname = usePathname()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Manejo de tecla Escape y bloqueo de scroll del fondo
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Bloquear scroll del documento
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    // Enfocar botón de cierre al abrir
    setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 50)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación completo de Amasia"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          {/* Backdrop con desenfoque suave y captura de clic exterior */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Panel deslizante lateral */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Cabecera del Drawer */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <Link
                href="/cocina-pro"
                onClick={onClose}
                className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg group min-w-0"
              >
                <div className="h-9 w-9 shrink-0 flex items-center justify-center">
                  <AmasiaLogo variant="symbol" className="h-9 w-9" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight font-['Fugaz_One'] truncate">
                    Amasia
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block leading-tight truncate">
                    Gestión gastronómica
                  </span>
                </div>
              </Link>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar menú de navegación"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista completa de módulos agrupados */}
            <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
              {AMASIA_NAV_GROUPS.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item: AmasiaNavItem) => {
                      const Icon = item.icon
                      const active = isAmasiaItemActive(item, pathname)

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all duration-150 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.99] ${
                            active
                              ? 'bg-purple-50 text-purple-950 font-bold border border-purple-200 shadow-2xs'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                active
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.75} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-semibold block leading-tight truncate">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-600 font-normal block leading-tight mt-0.5 truncate">
                                {item.description}
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            className={`h-4 w-4 shrink-0 ${
                              active ? 'text-purple-600' : 'text-slate-300'
                            }`}
                          />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pie de navegación móvil */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>Suscripción Pro Activa</span>
                </span>
              </div>

              {userEmail && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white text-slate-700 text-xs truncate border border-slate-200/70">
                  <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate font-medium">{userEmail}</span>
                </div>
              )}

              <Link
                href="/microapps"
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors border border-slate-200 bg-white min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
                <span>Catálogo de Microapps</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
