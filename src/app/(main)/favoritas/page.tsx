import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Bookmark, Search, ArrowRight } from "lucide-react"
import Link from "next/link"
import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "Herramientas favoritas",
  description: "Tus herramientas guardadas en PlayComun Herramientas.",
  path: "/favoritas",
  noindex: true,
})

export default async function FavoritasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/ingresar?next=/favoritas")
  }

  let userFavorites: any[] = []
  const { data: dbFavorites } = await supabase.from('favorites').select('tool_slug').eq('user_id', user.id)
  
  if (dbFavorites && dbFavorites.length > 0) {
    const { tools } = await import("@/data/tools")
    const slugs = dbFavorites.map((f: any) => f.tool_slug)
    userFavorites = tools.filter((t) => slugs.includes(t.slug))
  }

  // Import ToolCard dynamically or statically
  const { default: ToolCard } = await import("@/components/tools/ToolCard")

  return (
    <div className="min-h-screen bg-[#fcfcfd] py-12 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col gap-2 mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Mis Favoritas
          </h1>
          <p className="text-slate-500 font-medium">
            Herramientas que guardaste para acceder rápido.
          </p>
        </div>

        {userFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
            <img src="/otter-hero.png" alt="PlayComun Nutria" className="mb-6 h-32 w-auto object-contain opacity-90 drop-shadow-xs" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              No tenés herramientas favoritas aún
            </h2>
            <p className="text-slate-500 mb-8 max-w-md text-xs sm:text-sm leading-relaxed">
              Explorá el catálogo de herramientas y hacé clic en el corazón de cualquier tarjeta para guardarla acá.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/herramientas"
                className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 min-h-[44px] rounded-xl font-semibold hover:bg-brand-hover active:bg-brand-active transition-colors shadow-xs text-sm"
              >
                <Search className="w-4 h-4" />
                Explorar herramientas
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {userFavorites.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} isFavorite={true} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
