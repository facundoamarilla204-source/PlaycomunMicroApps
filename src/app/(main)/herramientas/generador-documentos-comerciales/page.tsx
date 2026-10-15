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

  return (
    <>
      <JsonLd data={jsonLdData} />
      <ToolPageLayout tool={tool} content={<GeneradorFacturasContent />}>
        <GeneradorFacturasTool />
      </ToolPageLayout>
    </>
  )
}
