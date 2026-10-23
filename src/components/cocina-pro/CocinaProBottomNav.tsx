'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  CalendarCheck,
  Menu,
} from 'lucide-react'

interface CocinaProBottomNavProps {
  onOpenDrawer?: () => void
}

export function CocinaProBottomNav({ onOpenDrawer }: CocinaProBottomNavProps) {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Inicio',
      href: '/cocina-pro',
      icon: LayoutDashboard,
      active: pathname === '/cocina-pro',
    },
    {
      name: 'Pedidos',
      href: '/cocina-pro/pedidos',
      icon: ShoppingBag,
      active: pathname.startsWith('/cocina-pro/pedidos'),
    },
    {
      name: 'Calendario',
      href: '/cocina-pro/calendario',
      icon: Calendar,
      active: pathname.startsWith('/cocina-pro/calendario'),
    },
    {
      name: 'Producción',
      href: '/cocina-pro/produccion',
      icon: CalendarCheck,
      active: pathname.startsWith('/cocina-pro/produccion'),
    },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xs pb-safe"
      aria-label="Navegación móvil de acceso rápido"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 px-1 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                tab.active
                  ? 'text-purple-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  tab.active ? 'text-purple-700' : 'text-slate-500'
                }`}
                strokeWidth={tab.active ? 2.25 : 1.75}
              />
              <span className="text-[10px] mt-1 leading-none truncate max-w-full">
                {tab.name}
              </span>
            </Link>
          )
        })}

        {/* 5to botón: Menú / Más que abre el drawer completo con los 9 módulos */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center h-full min-h-[48px] py-1 px-1 rounded-lg text-slate-500 hover:text-slate-900 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
          aria-label="Abrir menú completo con todos los módulos de Amasia"
        >
          <div className="relative">
            <Menu className="h-5 w-5 text-slate-600" strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white" />
          </div>
          <span className="text-[10px] mt-1 leading-none truncate max-w-full font-semibold text-slate-700">
            Más
          </span>
        </button>
      </div>
    </nav>
  )
}
