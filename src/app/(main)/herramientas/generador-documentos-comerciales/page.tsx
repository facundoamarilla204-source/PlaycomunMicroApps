import { notFound } from 'next/navigation'
import { tools } from '@/data/tools'
import { ToolPageLayout } from '@/components/layout/ToolPageLayout'
import { JsonLd } from '@/components/seo/JsonLd'
import { GeneradorFacturasTool } from '@/components/tools/generador-facturas/GeneradorFacturasTool'
import { GeneradorFacturasContent } from '@/components/tools/content/GeneradorFacturasContent'
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
