import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { buildMetadata } from "@/lib/metadata"
import { siteConfig } from "@/config/site"
import { JsonLd } from "@/components/seo/JsonLd"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { FirmarPdfTool } from "@/components/tools/firmar-pdf/FirmarPdfTool"
import { FirmarPdfContent } from "@/components/tools/content/FirmarPdfContent"

export const metadata = {
  ...buildMetadata({
    title: "Firmar PDF online gratis: Dibujar, escribir y QR celular",
    description:
      "Firmá documentos PDF online gratis y sin registro. Escribí tu nombre con tipografías manuscritas, dibujá tu firma, usá el celular con QR y descargá el PDF final.",
    path: "/herramientas/firmar-pdf",
  }),
  manifest: "/herramientas/firmar-pdf/manifest.json",
}

export default function FirmarPdfPage() {
  const tool = tools.find((t) => t.slug === "firmar-pdf")
  if (!tool) return notFound()

  const toolUrl = `${siteConfig.url}/herramientas/${tool.slug}`

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.seo?.description || tool.description,
    url: toolUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript. Requires HTML5 Canvas.",
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
        item: toolUrl,
      },
    ],
  }

  const faqJsonLd = tool.faqs && tool.faqs.length > 0 ? {
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
  } : null

  return (
    <>
      <JsonLd data={webAppJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <ToolPageLayout tool={tool} content={<FirmarPdfContent />}>
        <FirmarPdfTool />
      </ToolPageLayout>
    </>
  )
}
