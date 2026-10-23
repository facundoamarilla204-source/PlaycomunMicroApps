'use client'

import { useState, useEffect } from 'react'
import { CocinaProSidebar } from './CocinaProSidebar'
import { CocinaProHeader } from './CocinaProHeader'
import { CocinaProMobileDrawer } from './CocinaProMobileDrawer'
import { CocinaProBottomNav } from './CocinaProBottomNav'

interface CocinaProLayoutShellProps {
  children: React.ReactNode
  userEmail?: string
}

export function CocinaProLayoutShell({
  children,
  userEmail,
}: CocinaProLayoutShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Cargar preferencia de colapso de la barra lateral desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('amasia_sidebar_collapsed')
      if (stored !== null) {
        setIsSidebarCollapsed(stored === 'true')
      }
    } catch {
      // Ignorar fallos de localStorage en entornos restringidos
    }
  }, [])

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('amasia_sidebar_collapsed', String(next))
      } catch {
        // Ignorar
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Sidebar para desktop con soporte de estado colapsado / expandido */}
      <CocinaProSidebar
        userEmail={userEmail}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Contenedor principal para desktop y mobile */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Barra superior compacta con botón de menú drawer y título de sección */}
        <CocinaProHeader
          onOpenDrawer={() => setIsMobileDrawerOpen(true)}
          isDrawerOpen={isMobileDrawerOpen}
          userEmail={userEmail}
        />

        {/* Drawer móvil accesible con todos los módulos agrupados */}
        <CocinaProMobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          userEmail={userEmail}
        />

        {/* Contenido principal centrado con max-width y padding controlado */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
          {children}
        </main>

        {/* Barra de navegación inferior móvil */}
        <CocinaProBottomNav onOpenDrawer={() => setIsMobileDrawerOpen(true)} />
      </div>
    </div>
  )
}
