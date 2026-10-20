import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"
import { buildMetadata } from "@/lib/metadata"
import dynamic from "next/dynamic"

const GeneradorListasContent = dynamic(
  () => import("@/components/tools/content/GeneradorListasContent"),
  {
    loading: () => (
      <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-2xl border border-slate-200/80 animate-pulse space-y-6">
        <div className="h-8 bg-slate-100 rounded-lg w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    ),
  }
)
import { GeneradorListasSeo } from "@/components/tools/content/GeneradorListasSeo"

export const metadata = buildMetadata({
  title: "Generador de listas de precios en PDF online",
  description:
    "Creá listas de precios profesionales en PDF. Modificá precios masivamente, organizá por categorías y compartí tu catálogo comercial.",
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
