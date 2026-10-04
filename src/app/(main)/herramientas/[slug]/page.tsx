import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { Construction } from "lucide-react"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { buildMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"
import { CalculadoraAguinaldo } from "@/components/tools/CalculadoraAguinaldo"
import { AguinaldoContent } from "@/components/tools/content/AguinaldoContent"
import { CalculadoraPrecios } from "@/components/tools/CalculadoraPrecios"
import { PrecioVentaContent } from "@/components/tools/content/PrecioVentaContent"
import { GeneradorPresupuestos } from "@/components/tools/GeneradorPresupuestos"
import { GeneradorPresupuestosContent } from "@/components/tools/content/GeneradorPresupuestosContent"

const TOOL_COMPONENTS: Record<string, React.ReactNode> = {
  "calculadora-aguinaldo": (
    <>
      <CalculadoraAguinaldo />
      <div className="mt-16">
        <AguinaldoContent />
      </div>
    </>
  ),
  "calculadora-precios": (
    <>
      <CalculadoraPrecios />
      <div className="mt-16">
        <PrecioVentaContent />
      </div>
    </>
  ),
  "generador-presupuestos": (
    <>
      <GeneradorPresupuestos />
      <div className="mt-16 flex justify-center">
        <GeneradorPresupuestosContent />
      </div>
    </>
  ),
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const tool = tools.find((t) => t.slug === resolvedParams.slug)

  if (!tool) {
    return buildMetadata({ title: "No encontrado", noindex: true })
  }

  const isSoon = tool.status === "soon"

  return buildMetadata({
    title: tool.seo?.title || tool.name,
    description: tool.seo?.description || tool.description,
    path: `${tool.customUrl || `/herramientas/${tool.slug}`}`,
    noindex: isSoon,
  })
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const tool = tools.find((t) => t.slug === resolvedParams.slug)

  if (!tool) {
    notFound()
  }

  const isSoon = tool.status === "soon"

  const jsonLdData = isSoon ? null : {
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
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <JsonLd data={breadcrumbJsonLd} />

      <ToolPageLayout tool={tool}>
        {isSoon ? (
          <div className="text-center rounded-xl border border-dashed border-border bg-gray-50/50 p-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand mb-6">
              <Construction className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Esta herramienta está en construcción
            </h2>
            <p className="text-foreground-muted">
              Estamos trabajando para tenerla lista pronto. ¡Volvé a visitarnos!
            </p>
          </div>
        ) : (
          <div>
            {TOOL_COMPONENTS[tool.slug] || (
              <div className="text-center py-8 text-neutral-500">
                El componente para esta herramienta aún no fue asignado.
              </div>
            )}
          </div>
        )}
      </ToolPageLayout>
    </>
  )
}
