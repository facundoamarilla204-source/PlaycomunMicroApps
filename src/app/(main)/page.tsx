import Hero from "@/components/home/Hero"
import ToolGrid from "@/components/home/ToolGrid"
import MicroappsShowcase from "@/components/home/MicroappsShowcase"
import TrustStrip from "@/components/home/TrustStrip"
import ServicesBanner from "@/components/home/ServicesBanner"
import ContactForm from "@/components/home/ContactForm"
import { createClient } from "@/utils/supabase/server"
import { buildMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"

export const metadata = buildMetadata({
  title: "PlayComun Online · Herramientas y Calculadoras Gratis para tu Negocio",
  description:
    "Calculá precios, costos, IVA, aguinaldo y cuotas. Generá presupuestos y listas de precios en PDF, comprimí imágenes y organizá documentos online gratis y sin registro.",
  path: "/",
})

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userFavorites: string[] = []
  if (user) {
    const { data } = await supabase.from('favorites').select('tool_slug').eq('user_id', user.id)
    if (data) {
      userFavorites = data.map((f: any) => f.tool_slug)
    }
  }

  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      {
        "@type": "Organization",
        name: siteConfig.organization.name,
        url: siteConfig.organization.url,
        logo: `${siteConfig.url}${siteConfig.organization.logo}`,
        sameAs: Object.values(siteConfig.links).filter(Boolean),
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLdData} />
      <Hero />
      <ToolGrid userFavorites={userFavorites} isHome={true} limit={12} />
      <MicroappsShowcase />
      <TrustStrip />
      <ServicesBanner />
      <ContactForm />
    </>
  )
}
