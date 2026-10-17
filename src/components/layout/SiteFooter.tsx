import Link from "next/link"
import Image from "next/image"
import { siteConfig } from "@/config/site"
import { ExternalLink } from "lucide-react"

export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg">
              <Image src="/logotemanegro.png" alt={siteConfig.name} width={200} height={50} className="h-9 w-auto" style={{ width: "auto" }} />
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-600">Herramientas activas y gratuitas</span>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">Legal</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/terminos" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  Contacto y soporte
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">Comunidad & Agencia</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a 
                  href={siteConfig.organization.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-slate-600 hover:text-brand inline-flex items-center gap-1 transition-colors"
                >
                  Conocé PlayComun.com <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <Link href="/planes" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  Planes PlayComun Pro
                </Link>
              </li>
              <li>
                <Link href="/herramientas" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  Catálogo de herramientas
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">Seguinos</h3>
            <div className="flex flex-col gap-2.5">
              {siteConfig.links.linkedin && (
                <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  LinkedIn
                </a>
              )}
              {siteConfig.links.instagram && (
                <a href={siteConfig.links.instagram} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  Instagram
                </a>
              )}
              {siteConfig.links.youtube && (
                <a href={siteConfig.links.youtube} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-brand transition-colors">
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs text-slate-500">
            <p>&copy; {currentYear} PlayComun Herramientas. Todos los derechos reservados.</p>
            <span className="hidden sm:inline text-slate-300">•</span>
            <Link href="/arrepentimiento" className="text-slate-400 hover:text-slate-600 transition-colors">
              Botón de arrepentimiento
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/baja-servicio" className="text-slate-400 hover:text-slate-600 transition-colors">
              Botón de baja de servicio
            </Link>
          </div>
          <p className="text-xs text-slate-400 text-center md:text-right">
            Desarrollado para simplificar tareas cotidianas de negocios y creadores.
          </p>
        </div>
      </div>
    </footer>
  )
}
