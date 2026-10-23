'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react'
import { AmasiaLogo } from '@/components/microapps/AmasiaLogo'
import {
  AMASIA_NAV_GROUPS,
  isAmasiaItemActive,
  type AmasiaNavItem,
} from '@/lib/gastronomia/navigation'

interface CocinaProSidebarProps {
  userEmail?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function CocinaProSidebar({
  userEmail,
  isCollapsed = false,
  onToggleCollapse,
}: CocinaProSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/90 z-30 transition-all duration-200 ease-in-out ${
        isCollapsed ? 'md:w-20' : 'md:w-64'
      }`}
      aria-label="Navegación principal de Amasia"
    >
      {/* Encabezado del espacio de trabajo */}
      <div
        className={`p-3 sm:p-3.5 border-b border-slate-100 flex items-center ${
          isCollapsed ? 'flex-col gap-3 py-3 px-2' : 'justify-between'
        }`}
      >
        <Link
          href="/cocina-pro"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg group min-w-0"
          title="Amasia: Inicio"
        >
          <div className="h-10 w-10 shrink-0 flex items-center justify-center">
            <AmasiaLogo variant="symbol" className="h-10 w-10" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight font-['Fugaz_One'] truncate">
                Amasia
              </span>
              <span className="text-[11px] text-slate-500 font-medium block leading-tight mt-0.5 truncate">
                Gestión gastronómica
              </span>
            </div>
          )}
        </Link>

        {/* Botón para contraer/expandir sidebar: siempre visible y accesible */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer active:scale-95 flex items-center justify-center ${
              isCollapsed ? 'h-9 w-9 bg-slate-50 border border-slate-200/80' : 'p-1.5'
            }`}
            title={isCollapsed ? 'Expandir menú lateral (mostrar nombres)' : 'Contraer menú lateral'}
            aria-label={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5 text-purple-700" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Lista de navegación agrupada */}
      <nav
        className={`flex-1 ${
          isCollapsed
            ? 'px-2 py-2.5 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide'
            : 'px-2.5 py-3 space-y-4 overflow-y-auto scrollbar-thin'
        }`}
      >
        {AMASIA_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {group.title}
              </div>
            )}
            {group.items.map((item: AmasiaNavItem) => {
              const Icon = item.icon
              const active = isAmasiaItemActive(item, pathname)

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group/tooltip flex justify-center py-0.5">
                    <Link
                      href={item.href}
                      prefetch={true}
                      aria-label={item.name}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-[background-color,color,border-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        active
                          ? 'bg-purple-100 text-purple-950 font-bold border border-purple-300 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`h-4.5 w-4.5 ${active ? 'text-purple-700' : 'text-slate-500'}`}
                        strokeWidth={active ? 2 : 1.75}
                      />
                    </Link>
                    {/* Tooltip accesible flotante con animación refinada */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 -translate-x-1 transition-all duration-150 z-50 whitespace-nowrap border border-slate-800">
                      <span>{item.name}</span>
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    active
                      ? 'bg-purple-50/90 text-purple-950 border border-purple-200/80 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? 'text-purple-700' : 'text-slate-500'
                      }`}
                      strokeWidth={active ? 2 : 1.75}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Pie de barra lateral */}
      <div className="p-3 border-t border-slate-100 flex flex-col gap-2">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Plan Pro Activo</span>
              </span>
            </div>

            {userEmail && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-xs truncate border border-slate-200/60">
                <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="truncate font-medium" title={userEmail}>
                  {userEmail}
                </span>
              </div>
            )}

            <Link
              href="/microapps"
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
              <span>Catálogo de Microapps</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 flex items-center justify-center transition-colors active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-2xs"
                title="Expandir menú lateral"
                aria-label="Expandir menú lateral"
              >
                <PanelLeftOpen className="h-4.5 w-4.5" />
              </button>
            )}
            <Link
              href="/microapps"
              className="h-9 w-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              title="Volver a Microapps"
              aria-label="Volver a Microapps"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
