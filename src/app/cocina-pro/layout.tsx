import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { isProUser } from '@/lib/pro'
import { CocinaProGate } from '@/components/cocina-pro/CocinaProGate'
import { CocinaProLayoutShell } from '@/components/cocina-pro/CocinaProLayoutShell'

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
    <CocinaProLayoutShell userEmail={user.email}>
      {children}
    </CocinaProLayoutShell>
  )
}
