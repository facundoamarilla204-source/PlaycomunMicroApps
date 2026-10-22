'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Calculator,
  ArrowLeft,
  User as UserIcon,
  Wheat,
} from 'lucide-react'
import { AmasiaLogo } from '@/components/microapps/AmasiaLogo'

export function CocinaProSidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Inicio',
      href: '/cocina-pro',
      icon: LayoutDashboard,
      active: pathname === '/cocina-pro',
    },
    {
      name: 'Recetario profesional',
      href: '/cocina-pro/recetas',
      icon: BookOpen,
      active: pathname.startsWith('/cocina-pro/recetas') || pathname.startsWith('/cocina-pro/elaboracion'),
    },
    {
      name: 'Calculadora de panadería',
      href: '/cocina-pro/panaderia',
      icon: Wheat,
      active: pathname.startsWith('/cocina-pro/panaderia'),
    },
    {
      name: 'Biblioteca de ingredientes',
      href: '/cocina-pro/ingredientes',
      icon: Layers,
      active: pathname.startsWith('/cocina-pro/ingredientes'),
    },
    {
      name: 'Calculadora de costos',
      href: '/herramientas/costo-receta',
      icon: Calculator,
      active: pathname === '/herramientas/costo-receta',
    },
  ]

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/90 z-30"
      aria-label="Navegación de Amasia"
    >
      {/* Encabezado del espacio de trabajo */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <Link
          href="/cocina-pro"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg group min-w-0"
        >
          <div className="h-10 w-10 shrink-0 flex items-center justify-center">
            <AmasiaLogo variant="symbol" className="h-10 w-10" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight truncate">
              Amasia
            </span>
            <span className="text-[11px] text-slate-500 font-medium block leading-tight mt-0.5 truncate">
              Gestión gastronómica
            </span>
          </div>
        </Link>
      </div>

      {/* Lista de navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Módulos
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                item.active
                  ? 'bg-purple-50 text-brand shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    item.active ? 'text-brand' : 'text-slate-500'
                  }`}
                  strokeWidth={1.75}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Pie de barra lateral */}
      <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5">
        {userEmail && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs truncate">
            <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate" title={userEmail}>
              {userEmail}
            </span>
          </div>
        )}

        <Link
          href="/microapps"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
          <span>Catálogo de Microapps</span>
        </Link>
      </div>
    </aside>
  )
}

