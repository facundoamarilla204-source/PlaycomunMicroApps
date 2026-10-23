"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, Menu, X, ChevronDown, LogOut, User as UserIcon, Heart } from "lucide-react"
import { siteConfig } from "@/config/site"
import CommandSearch from "./CommandSearch"
import { getCategories } from "@/data/categories"
import { logout } from "@/app/(auth)/actions"
import { tools } from "@/data/tools"

export default function SiteHeader({ user, isPro = false }: { user?: any, isPro?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const pathname = usePathname()
  const authRedirectParam = (pathname && pathname !== '/ingresar' && pathname !== '/registro')
    ? `?redirect=${encodeURIComponent(pathname)}`
    : ''

  const isAuthenticated = !!user
  const categories = getCategories().filter(c => c.id !== "todas")

  const isHome = pathname === "/" || (typeof window !== "undefined" && window.location.pathname === "/")

  useEffect(() => {
    const handleScroll = () => {
      const isHomePage = pathname === "/" || (typeof window !== "undefined" && window.location.pathname === "/")
      if (isHomePage) {
        // En el inicio, si el usuario no scrolleó o está arriba, el header DEBE ser transparente sobre el Hero morado
        if (window.scrollY < 20) {
          setIsScrolled(false)
          return
        }
        const nextSection = document.getElementById("herramientas")
        if (nextSection) {
          const rect = nextSection.getBoundingClientRect()
          // Solo se vuelve blanco cuando la sección blanca llega a la barra de navegación (<= 80px)
          setIsScrolled(rect.top <= 80)
        } else {
          setIsScrolled(window.scrollY > window.innerHeight * 0.7)
        }
      } else {
        setIsScrolled(window.scrollY > 10)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])

  const isTransparent = isHome && !isScrolled

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          isTransparent
            ? "bg-gradient-to-b from-[#1a053d]/40 to-transparent border-b border-transparent py-3.5 sm:py-4"
            : isScrolled
              ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-2.5"
              : "bg-white border-b border-slate-200/70 py-3 sm:py-3.5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg">
              <Image 
                src="/logotemanegro.png" 
                alt={siteConfig.name} 
                width={220} 
                height={56} 
                className="h-9 sm:h-10 w-auto transition-all duration-200" 
                style={{ 
                  width: "auto",
                  filter: isTransparent ? "brightness(0) invert(1)" : "none"
                }} 
                priority 
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Navegación principal">
              {[
                { id: 'calculadora', name: 'Calculadoras' },
                { id: 'generador', name: 'Generadores' },
                { id: 'utilidad', name: 'Utilidades' }
              ].map((type) => {
                const typeTools = tools.filter(t => t.type === type.id)
                return (
                  <div key={type.id} className="relative group">
                    <Link
                      href={`/herramientas?tipo=${type.id}`}
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors py-2 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md ${
                        isTransparent 
                          ? "text-white/90 hover:text-white group-hover:text-white" 
                          : "text-slate-700 hover:text-brand group-hover:text-brand group-focus-within:text-brand"
                      }`}
                      aria-haspopup={typeTools.length > 0 ? "true" : undefined}
                    >
                      <span>{type.name}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180 ${
                        isTransparent ? "text-white/70 group-hover:text-white" : "text-slate-400 group-hover:text-brand"
                      }`} />
                    </Link>
                    {typeTools.length > 0 && (
                      <div 
                        className="absolute left-0 top-full pt-1 hidden w-64 flex-col group-hover:flex group-focus-within:flex z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                        role="menu"
                        aria-label={`Herramientas de ${type.name}`}
                      >
                        <div className="rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 max-h-80 overflow-y-auto scrollbar-thin text-slate-800">
                          {typeTools.map((tool) => (
                            <Link
                              key={tool.slug}
                              href={`${tool.customUrl || `/herramientas/${tool.slug}`}`}
                              role="menuitem"
                              className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-violet-50 hover:text-brand focus-visible:outline-none focus-visible:bg-slate-100 focus-visible:text-brand focus-visible:ring-1 focus-visible:ring-brand"
                            >
                              {tool.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <Link
                href="/microapps"
                prefetch={true}
                className={`text-sm font-semibold transition-colors py-2 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md ${
                  isTransparent ? "text-white hover:text-violet-200 drop-shadow-xs" : "text-slate-700 hover:text-brand"
                }`}
              >
                Microapps
              </Link>
              <Link
                href="/planes"
                prefetch={true}
                className={`text-sm font-semibold transition-colors py-2 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md ${
                  isTransparent ? "text-white hover:text-violet-200 drop-shadow-xs" : "text-slate-700 hover:text-brand"
                }`}
              >
                Planes
              </Link>
              <Link
                href="/#servicios"
                className={`text-sm font-semibold transition-colors py-2 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md ${
                  isTransparent ? "text-white hover:text-violet-200 drop-shadow-xs" : "text-slate-700 hover:text-brand"
                }`}
              >
                Servicios
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className={`flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer ${
                isTransparent 
                  ? "border border-white/20 bg-white/10 text-white hover:bg-white/20 shadow-xs" 
                  : "border border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              aria-label="Buscar herramientas"
              title="Buscar (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>
            
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold shadow-xs transition-colors cursor-pointer ${
                      isTransparent
                        ? "bg-white/15 text-white border border-white/25 hover:bg-white/25"
                        : "bg-brand-light text-brand border border-brand-border/60 hover:bg-purple-100"
                    }`}
                    title="Mi Cuenta"
                    aria-label="Menú de cuenta"
                  >
                    <UserIcon className="h-4 w-4" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 flex-col rounded-xl border border-slate-200 bg-white shadow-xl flex z-50">
                        <div className="p-1.5 flex flex-col gap-0.5">
                          <Link
                            href="/favoritas"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand"
                          >
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                            Favoritos
                          </Link>
                          <Link
                            href="/cuenta"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand"
                          >
                            <UserIcon className="h-3.5 w-3.5" />
                            Mi Perfil
                          </Link>
                          <form action={logout}>
                            {pathname && <input type="hidden" name="redirectTo" value={pathname} />}
                            <button
                              type="submit"
                              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 text-left cursor-pointer"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Cerrar Sesión
                            </button>
                          </form>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href={`/ingresar${authRedirectParam}`}
                    className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                      isTransparent 
                        ? "text-white/90 hover:text-white hover:bg-white/10" 
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Ingresar
                  </Link>
                  <Link
                    href={`/registro${authRedirectParam}`}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-xs transition-all active:scale-[0.97] ${
                      isTransparent
                        ? "bg-white text-violet-950 font-bold hover:bg-violet-50 shadow-md"
                        : "bg-brand text-white hover:bg-brand-hover active:bg-brand-active"
                    }`}
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`md:hidden flex h-10 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isTransparent 
                  ? "border border-white/20 text-white hover:bg-white/10" 
                  : "border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative ml-auto w-full max-w-sm bg-white shadow-lg h-full flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Image src="/logotemanegro.png" alt={siteConfig.name} width={200} height={50} className="h-8 w-auto" style={{ width: "auto" }} priority />
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
                {[
                  { id: 'calculadora', name: 'Calculadoras' },
                  { id: 'generador', name: 'Generadores' },
                  { id: 'utilidad', name: 'Utilidades' }
                ].map((type) => (
                  <Link
                    key={type.id}
                    href={`/herramientas?tipo=${type.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand transition-colors"
                  >
                    {type.name}
                  </Link>
                ))}
                <Link 
                  href="/microapps"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand transition-colors"
                >
                  Microapps
                </Link>
                <Link 
                  href="/planes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand transition-colors"
                >
                  Planes
                </Link>
                <Link 
                  href="/#servicios"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand transition-colors"
                >
                  Servicios
                </Link>
              </div>

              {isAuthenticated && (
                <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
                  <Link href="/favoritas" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-brand transition-colors">
                    <Heart className="h-4 w-4 text-rose-500" /> Favoritos
                  </Link>
                  <Link href="/cuenta" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-brand transition-colors">
                    <UserIcon className="h-4 w-4" /> Mi Perfil
                  </Link>
                </div>
              )}
              
              <div className="mt-auto flex flex-col gap-2 pt-4">
                {isAuthenticated ? (
                  <form action={logout} className="w-full">
                    {pathname && <input type="hidden" name="redirectTo" value={pathname} />}
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </form>
                ) : (
                  <>
                    <Link
                      href={`/registro${authRedirectParam}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full min-h-[44px] rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover flex items-center justify-center"
                    >
                      Crear cuenta
                    </Link>
                    <Link
                      href={`/ingresar${authRedirectParam}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 flex items-center justify-center"
                    >
                      Ingresar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
