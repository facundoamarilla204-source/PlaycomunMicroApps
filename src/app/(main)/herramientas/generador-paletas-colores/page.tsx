import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { buildMetadata } from "@/lib/metadata"
import { siteConfig } from "@/config/site"
import { JsonLd } from "@/components/seo/JsonLd"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { GeneradorPaletasTool } from "@/components/tools/generador-paletas/GeneradorPaletasTool"
import { GeneradorPaletasContent } from "@/components/tools/content/GeneradorPaletasContent"

export const metadata = {
  ...buildMetadata({
    title: "Generador de paletas de colores online gratis",
    description:
      "Creá paletas de colores armónicas, extraé colores dominantes de imágenes, comprobá contraste WCAG 2.2 y exportá a CSS, JSON, Tailwind o PNG gratis y sin registro.",
    path: "/herramientas/generador-paletas-colores",
  }),
  manifest: "/herramientas/generador-paletas-colores/manifest.json",
}

export default function GeneradorPaletasPage() {
  const tool = tools.find((t) => t.slug === "generador-paletas-colores")
  if (!tool) return notFound()

  const toolUrl = `${siteConfig.url}/herramientas/${tool.slug}`

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description:
      tool.seo?.description || tool.description,
    url: toolUrl,
    applicationCategory: "DesignApplication",
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cómo funciona la generación de paletas armónicas?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El algoritmo se basa en el círculo cromático y el modelo HSL para calcular relaciones de colores complementarios, análogos, triádicos, monocromáticos, complementarios divididos y tetrádicos asegurando armonía visual.",
        },
      },
      {
        "@type": "Question",
        name: "¿Las fotos cargadas para extraer colores se suben a servidores?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. El análisis se realiza localmente en el navegador mediante Canvas y la API ImageData. Las imágenes no se transmiten por internet ni se almacenan en servidores.",
        },
      },
      {
        "@type": "Question",
        name: "¿Qué significa que una combinación cumpla con WCAG 2.2 nivel AA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Significa que la diferencia de luminancia relativa entre texto y fondo alcanza al menos 4.5:1 para texto normal o 3:1 para texto grande, garantizando legibilidad accesible para todas las personas.",
        },
      },
    ],
  }

  return (
    <>
      <JsonLd data={webAppJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />

      <ToolPageLayout tool={tool} content={<GeneradorPaletasContent />}>
        <GeneradorPaletasTool />
      </ToolPageLayout>
    </>
  )
}
