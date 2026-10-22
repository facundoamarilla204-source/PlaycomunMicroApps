import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { AmasiaLogo } from '@/components/microapps/AmasiaLogo'
import { CocinaProGate } from '@/components/cocina-pro/CocinaProGate'
import { CocinaProSidebar } from '@/components/cocina-pro/CocinaProSidebar'
import { CocinaProBottomNav } from '@/components/cocina-pro/CocinaProBottomNav'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Amasia · PlayComun Online',
    template: '%s | Amasia',
  },
  description:
    'Amasia: gestión gastronómica integral. Recetas, ingredientes, costos y elaboraciones en un solo lugar.',
  manifest: '/cocina-pro/manifest.json',
  icons: {
    icon: [
      { url: '/amasia/favicon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/amasia/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/amasia/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default async function CocinaProLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPro = user ? await isProUser(user.id) : false

  // Si el usuario no está autenticado o no tiene plan Pro, mostramos la pantalla de presentación / acceso
  if (!user || !isPro) {
    return (
      <CocinaProGate
        isAuthenticated={!!user}
        userEmail={user?.email}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Sidebar para desktop */}
      <CocinaProSidebar userEmail={user.email} />

      {/* Contenedor principal para desktop y mobile */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Barra superior compacta exclusiva para mobile */}
        <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between gap-2">
          <Link
            href="/cocina-pro"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg group min-w-0"
          >
            <div className="h-9 w-9 shrink-0 flex items-center justify-center">
              <AmasiaLogo variant="symbol" className="h-9 w-9" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 leading-tight block truncate">
                Amasia
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight block truncate">
                Gestión gastronómica
              </span>
            </div>
          </Link>
          <Link
            href="/microapps"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <span>← Microapps</span>
          </Link>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-8">
          {children}
        </main>

        {/* Barra de navegación inferior móvil */}
        <CocinaProBottomNav />
      </div>
    </div>
  )
}
