'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, BookOpen, Wheat, ArrowLeft } from 'lucide-react'

export function CocinaProBottomNav() {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Inicio',
      href: '/cocina-pro',
      icon: LayoutDashboard,
      active: pathname === '/cocina-pro',
    },
    {
      name: 'Recetas',
      href: '/cocina-pro/recetas',
      icon: BookOpen,
      active: pathname.startsWith('/cocina-pro/recetas') || pathname.startsWith('/cocina-pro/elaboracion'),
    },
    {
      name: 'Panadería',
      href: '/cocina-pro/panaderia',
      icon: Wheat,
      active: pathname.startsWith('/cocina-pro/panaderia'),
    },
    {
      name: 'Insumos',
      href: '/cocina-pro/ingredientes',
      icon: Layers,
      active: pathname.startsWith('/cocina-pro/ingredientes'),
    },
    {
      name: 'Microapps',
      href: '/microapps',
      icon: ArrowLeft,
      active: false,
    },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xs pb-safe"
      aria-label="Navegación móvil de Cocina Pro"
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
                  ? 'text-brand font-semibold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  tab.active ? 'text-brand' : 'text-slate-500'
                }`}
                strokeWidth={tab.active ? 2 : 1.75}
              />
              <span className="text-[10px] mt-1 leading-none truncate max-w-full">
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

