import Link from "next/link"
import Image from "next/image"
import { siteConfig } from "@/config/site"
import { ExternalLink } from "lucide-react"

export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logotemanegro.png" alt={siteConfig.name} width={240} height={64} className="h-12 sm:h-16 w-auto" style={{ width: "auto" }} />
            </Link>
            <p className="text-sm text-foreground-subtle max-w-xs">
              {siteConfig.description}
            </p>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="text-sm font-medium text-foreground uppercase tracking-wider mb-4">Legal</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/terminos" className="text-sm text-foreground-muted hover:text-brand">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-sm text-foreground-muted hover:text-brand">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-sm text-foreground-muted hover:text-brand">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-sm font-medium text-foreground uppercase tracking-wider mb-4">Agencia</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a 
                  href={siteConfig.mainSiteUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-foreground-muted hover:text-brand inline-flex items-center gap-1"
                >
                  Ver PlayComun.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-sm font-medium text-foreground uppercase tracking-wider mb-4">Redes Sociales</h3>
            <div className="flex flex-col gap-3">
              {siteConfig.links.linkedin && (
                <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer" className="text-sm text-foreground-muted hover:text-brand">
                  LinkedIn
                </a>
              )}
              {siteConfig.links.instagram && (
                <a href={siteConfig.links.instagram} target="_blank" rel="noreferrer" className="text-sm text-foreground-muted hover:text-brand">
                  Instagram
                </a>
              )}
              {siteConfig.links.youtube && (
                <a href={siteConfig.links.youtube} target="_blank" rel="noreferrer" className="text-sm text-foreground-muted hover:text-brand">
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground-subtle">
            &copy; {currentYear} PlayComun. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
