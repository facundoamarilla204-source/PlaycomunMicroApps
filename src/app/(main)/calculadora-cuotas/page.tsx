import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { buildMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"
import { CalculadoraCuotas } from "@/components/tools/CalculadoraCuotas"
import { CalculadoraCuotasContent } from "@/components/tools/content/CalculadoraCuotasContent"

export async function generateMetadata() {
  const tool = tools.find((t) => t.slug === "calculadora-cuotas")
  if (!tool) return buildMetadata({ title: "No encontrado", noindex: true })

  return buildMetadata({
    title: tool.seo?.title || tool.name,
    description: tool.seo?.description || tool.description,
    path: tool.customUrl || `/herramientas/${tool.slug}`,
  })
}

export default function CalculadoraCuotasPage() {
  const tool = tools.find((t) => t.slug === "calculadora-cuotas")
  if (!tool) notFound()

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.seo?.description || tool.description,
    url: `${siteConfig.url}${tool.customUrl || `/herramientas/${tool.slug}`}`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: "es-AR",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ARS",
    },
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
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `${siteConfig.url}${tool.customUrl || `/herramientas/${tool.slug}`}`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLdData} />
      <JsonLd data={breadcrumbJsonLd} />

      <ToolPageLayout tool={tool}>
        <CalculadoraCuotas />
        <div className="mt-16 flex justify-center">
          <CalculadoraCuotasContent />
        </div>
      </ToolPageLayout>
    </>
  )
}
