import Link from "next/link"
import Image from "next/image"
import { siteConfig } from "@/config/site"
import { ExternalLink } from "lucide-react"

export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/80 bg-slate-50/70 text-slate-600 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5 lg:gap-10">
          {/* Brand & info */}
          <div className="sm:col-span-2 md:col-span-1 space-y-3">
            <Link
              href="/"
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg transition-transform active:scale-98"
            >
              <Image
                src="/logotemanegro.png"
                alt={siteConfig.name}
                width={170}
                height={42}
                className="h-8 w-auto"
                style={{ width: "auto" }}
              />
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-[11px] font-medium text-slate-700">Herramientas activas en tu navegador</span>
            </div>
          </div>

          {/* Negocios y Ventas */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Negocios y ventas
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/herramientas/generador-presupuestos" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Generador de presupuestos
                </Link>
              </li>
              <li>
                <Link href="/herramientas/calculadora-precios" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Calculadora de precio de venta
                </Link>
              </li>
              <li>
                <Link href="/herramientas/generador-listas-precios" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Generador de listas de precios
                </Link>
              </li>
              <li>
                <Link href="/herramientas/generador-documentos-comerciales" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Documentos comerciales
                </Link>
              </li>
              <li>
                <Link href="/herramientas/costo-receta" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Costo de recetas gastronómicas
                </Link>
              </li>
            </ul>
          </div>

          {/* Finanzas y Calculadoras */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Finanzas y cálculo
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/herramientas/calculadora-iva" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Calculadora de IVA Argentina
                </Link>
              </li>
              <li>
                <Link href="/herramientas/calculadora-aguinaldo" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Calculadora de aguinaldo (SAC)
                </Link>
              </li>
              <li>
                <Link href="/herramientas/calculadora-rentabilidad" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Calculadora de rentabilidad
                </Link>
              </li>
              <li>
                <Link href="/herramientas/calculadora-cuotas" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Calculadora de cuotas
                </Link>
              </li>
              <li>
                <Link href="/herramientas/control-gastos" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Control de gastos
                </Link>
              </li>
            </ul>
          </div>

          {/* Archivos y Productividad */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Archivos y utilidades
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/herramientas/ordenar-pdf" className="text-xs font-medium text-slate-900 hover:text-brand transition-colors">
                  Organizar y unir PDF
                </Link>
              </li>
              <li>
                <Link href="/herramientas/firmar-pdf" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Firmar PDF online
                </Link>
              </li>
              <li>
                <Link href="/herramientas/compresor-imagenes" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Compresor de imágenes
                </Link>
              </li>
              <li>
                <Link href="/herramientas/convertidor-archivos" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Convertidor de archivos
                </Link>
              </li>
              <li>
                <Link href="/herramientas/generador-favicon" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Generador de favicons
                </Link>
              </li>
              <li>
                <Link href="/herramientas/eliminar-metadatos-exif" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Eliminar metadatos EXIF
                </Link>
              </li>
              <li>
                <Link href="/herramientas/generador-qr" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Generador de códigos QR
                </Link>
              </li>
              <li>
                <Link href="/herramientas/cortar-audio" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Cortador de audio online
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal y Plataforma */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Plataforma y legal
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/herramientas" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Catálogo de herramientas
                </Link>
              </li>
              <li>
                <Link href="/microapps" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Microapps independientes
                </Link>
              </li>
              <li>
                <Link href="/planes" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Planes PlayComun Pro
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Contacto y soporte
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <a 
                  href={siteConfig.organization.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors mt-0.5"
                >
                  PlayComun.com <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <p>&copy; {currentYear} PlayComun Herramientas. Todos los derechos reservados.</p>
            <span className="hidden sm:inline text-slate-300">•</span>
            <Link href="/arrepentimiento" className="text-slate-600 hover:text-slate-900 transition-colors">
              Botón de arrepentimiento
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/baja-servicio" className="text-slate-600 hover:text-slate-900 transition-colors">
              Baja de servicio
            </Link>
          </div>
          <p className="text-xs text-slate-600 text-center md:text-right">
            Herramientas online diseñadas para optimizar tareas cotidianas de negocios y profesionales.
          </p>
        </div>
      </div>
    </footer>
  )
}
