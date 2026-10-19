import { notFound } from 'next/navigation'
import { tools } from '@/data/tools'
import { ToolPageLayout } from '@/components/layout/ToolPageLayout'
import { JsonLd } from '@/components/seo/JsonLd'
import dynamic from 'next/dynamic'
import { GeneradorFacturasContent } from '@/components/tools/content/GeneradorFacturasContent'

const GeneradorFacturasTool = dynamic(
  () => import('@/components/tools/generador-facturas/GeneradorFacturasTool').then((m) => m.GeneradorFacturasTool),
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
import { siteConfig } from '@/config/site'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Generador de documentos comerciales en PDF gratis',
  description:
    'Creá recibos de pago, órdenes de trabajo y facturas proforma personalizadas en PDF. Gratis, sin registro y listo para compartir.',
  path: '/herramientas/generador-documentos-comerciales',
})

export default function GeneradorDocumentosComercialesPage() {
  const tool = tools.find((t) => t.slug === 'generador-documentos-comerciales')
  if (!tool) return notFound()

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Generador de Documentos Comerciales',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    url: `${siteConfig.url}/herramientas/generador-documentos-comerciales`,
    description: tool.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ARS',
    },
    featureList: [
      'Creación de recibos de pago y control de señas con saldo pendiente',
      'Emisión de órdenes de trabajo técnico con diagnóstico y equipo',
      'Facturas proforma informativas para acuerdos comerciales',
      'Personalización con logo y colores de acento',
      'Descarga directa en PDF sin registro',
    ],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Herramientas',
        item: `${siteConfig.url}/herramientas`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tool.name,
        item: `${siteConfig.url}/herramientas/${tool.slug}`,
      },
    ],
  }

  const faqJsonLd =
    tool.faqs && tool.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: tool.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
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
      <ToolPageLayout tool={tool} content={<GeneradorFacturasContent />}>
        <GeneradorFacturasTool />
      </ToolPageLayout>
    </>
  )
}
