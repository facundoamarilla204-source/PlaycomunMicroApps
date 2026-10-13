import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { tools } from '@/data/tools'
import { ToolPageLayout } from '@/components/layout/ToolPageLayout'
import { JsonLd } from '@/components/seo/JsonLd'
import { GeneradorFacturasTool } from '@/components/tools/generador-facturas/GeneradorFacturasTool'
import { GeneradorFacturasContent } from '@/components/tools/content/GeneradorFacturasContent'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Generador de Documentos Comerciales en PDF Gratis | PlayComun',
  description:
    'Creá presupuestos, recibos de pago, órdenes de trabajo y facturas proforma personalizadas en PDF. Gratis, sin registro y listo para compartir.',
  keywords:
    'generador de presupuestos, recibos de pago en pdf, orden de trabajo pdf, factura proforma, cotizaciones online gratis, documentos comerciales argentina, playcomun',
  alternates: {
    canonical: `${siteConfig.url}/herramientas/generador-facturas`,
  },
  openGraph: {
    title: 'Generador de Documentos Comerciales en PDF Gratis | PlayComun',
    description:
      'Creá presupuestos, recibos de pago, órdenes de trabajo y facturas proforma personalizadas en PDF. Gratis, sin registro y listo para compartir.',
    url: `${siteConfig.url}/herramientas/generador-facturas`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generador de Documentos Comerciales en PDF Gratis | PlayComun',
    description:
      'Creá presupuestos, recibos de pago, órdenes de trabajo y facturas proforma personalizadas en PDF.',
  },
}

export default function GeneradorFacturasPage() {
  const tool = tools.find((t) => t.slug === 'generador-facturas')
  if (!tool) return notFound()

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Generador de Documentos Comerciales',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    url: `${siteConfig.url}/herramientas/generador-facturas`,
    description: tool.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ARS',
    },
    featureList: [
      'Generación de presupuestos comerciales en PDF',
      'Creación de recibos de pago y control de señas con saldo pendiente',
      'Emisión de órdenes de trabajo técnico con diagnóstico y equipo',
      'Facturas proforma informativas',
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
