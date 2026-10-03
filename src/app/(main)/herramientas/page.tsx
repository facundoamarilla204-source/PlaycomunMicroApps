import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import HerramientasContent from "./herramientas-content"
import { buildMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams
  const hasParams = Object.keys(params).length > 0

  return buildMetadata({
    title: "Explorar Herramientas",
    description: "Encontrá todas las calculadoras, generadores y utilidades que PlayComun tiene para ofrecerte.",
    path: "/herramientas",
    noindex: hasParams,
  })
}

export default async function HerramientasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userFavorites: string[] = []
  if (user) {
    const { data } = await supabase.from('favorites').select('tool_slug').eq('user_id', user.id)
    if (data) {
      userFavorites = data.map((f: any) => f.tool_slug)
    }
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Herramientas",
        item: `${siteConfig.url}/herramientas`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <Suspense fallback={<div className="py-16 text-center text-foreground-muted">Cargando herramientas...</div>}>
        <HerramientasContent userFavorites={userFavorites} />
      </Suspense>
    </>
  )
}

