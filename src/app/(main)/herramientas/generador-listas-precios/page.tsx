import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"
import { buildMetadata } from "@/lib/metadata"
import GeneradorListasContent from "@/components/tools/content/GeneradorListasContent"
import { GeneradorListasSeo } from "@/components/tools/content/GeneradorListasSeo"

export const metadata = buildMetadata({
  title: "Generador de listas de precios en PDF online gratis",
  description:
    "Creá listas de precios profesionales en PDF. Modificá precios masivamente, organizá por categorías y compartí tu catálogo comercial gratis y sin registro.",
  path: "/herramientas/generador-listas-precios",
})

export default function GeneradorListasPage() {
  const tool = tools.find((t) => t.slug === "generador-listas-precios")
  if (!tool) return notFound()

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.seo?.description || tool.description,
    url: `${siteConfig.url}/herramientas/${tool.slug}`,
    applicationCategory: "BusinessApplication",
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
        item: `${siteConfig.url}/herramientas/${tool.slug}`,
      },
    ],
  }

  const faqJsonLd =
    tool.faqs && tool.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null

  return (
    <>
      <JsonLd data={jsonLdData} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <ToolPageLayout tool={tool} content={<GeneradorListasSeo />}>
        <GeneradorListasContent />
      </ToolPageLayout>
    </>
  )
}
