"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Menu, X, ChevronDown, Calculator, Sparkles, Wrench, LogOut, User as UserIcon } from "lucide-react"
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
  
  const isAuthenticated = !!user
  const categories = getCategories().filter(c => c.id !== "todas")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 border-b border-border/40 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] py-3" 
            : "bg-white py-4"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95">
              <Image src="/logotemanegro.png" alt={siteConfig.name} width={240} height={64} className="h-10 sm:h-12 w-auto" style={{ width: "auto" }} priority />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {categories.map((cat) => {
                const catTools = tools.filter(t => t.category === cat.id)
                return (
                  <div key={cat.id} className="relative group">
                    <Link
                      href={`/herramientas?categoria=${cat.id}`}
                      className="flex items-center gap-1.5 text-base font-semibold text-foreground/80 transition-colors hover:text-brand capitalize py-2"
                    >
                      {cat.name} <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    </Link>
                    {catTools.length > 0 && (
                      <div className="absolute left-0 top-[100%] hidden w-64 flex-col rounded-2xl border border-border/50 bg-white shadow-xl shadow-brand/5 group-hover:flex transform opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all">
                        <div className="p-2 max-h-80 overflow-y-auto">
                          {catTools.map((tool) => (
                            <Link
                              key={tool.slug}
                              href={`${tool.customUrl || `/herramientas/${tool.slug}`}`}
                              className="block rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 transition-all hover:bg-brand-light/50 hover:text-brand"
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
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-all hover:bg-brand-light hover:text-brand hover:scale-105 active:scale-95"
              aria-label="Buscar herramientas"
            >
              <Search className="h-5 w-5" />
            </button>
            
            <div className="hidden md:flex items-center gap-4">

              {isAuthenticated && !isPro && (
                <Link href="/planes" className="rounded-full px-4 py-2 text-base font-semibold text-amber-600 transition-colors hover:bg-amber-50">
                  Pro
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/planes" className="rounded-full px-4 py-2 text-base font-semibold text-foreground/80 transition-colors hover:bg-gray-100 hover:text-foreground">
                  Planes
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/favoritas" className="rounded-full px-4 py-2 text-base font-semibold text-brand transition-colors hover:bg-brand-light">
                  Favoritas
                </Link>
              )}
              <Link 
                href="/#servicios"
                className="rounded-full px-4 py-2 text-base font-semibold text-foreground/80 transition-colors hover:bg-gray-100 hover:text-foreground"
              >
                Servicios
              </Link>
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
                    title="Mi Cuenta"
                  >
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 flex-col rounded-2xl border border-border/50 bg-white shadow-xl shadow-brand/5 flex z-50 animate-in slide-in-from-top-2">
                        <div className="p-2 flex flex-col gap-1">
                          <Link
                            href="/cuenta"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 transition-all hover:bg-brand-light/50 hover:text-brand"
                          >
                            <UserIcon className="h-4 w-4" />
                            Mi Perfil
                          </Link>
                          <form action={logout}>
                            <button
                              type="submit"
                              className="w-full flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4" />
                              Cerrar Sesi├│n
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
                    href="/ingresar"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-gray-100 hover:text-foreground"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/registro"
                    className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition-all hover:bg-brand-hover hover:shadow-md hover:shadow-brand/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  >
                    Crear cuenta gratis
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative ml-auto w-full max-w-sm bg-white shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Image src="/logotemanegro.png" alt={siteConfig.name} width={240} height={64} className="h-12 w-auto" style={{ width: "auto" }} priority />
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-foreground-muted">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2 border-b border-border pb-4">
                <span className="text-sm font-medium text-foreground-subtle uppercase tracking-wider">Categor├¡as</span>
                <Link href="/herramientas" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground font-medium hover:text-brand">
                  Todas
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/herramientas?categoria=${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-foreground font-medium hover:text-brand capitalize"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              {isAuthenticated && !isPro && (
                <Link href="/planes" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-amber-600 font-medium border-b border-border pb-4">
                  Pro
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/planes" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground font-medium border-b border-border pb-4">
                  Planes
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/favoritas" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground font-medium border-b border-border pb-4">
                  Favoritas
                </Link>
              )}
              <div className="mt-auto flex flex-col gap-3 pt-4">
                {isAuthenticated ? (
                  <form action={logout} className="w-full">
                    <button
                      type="submit"
                      className="w-full rounded border border-border px-4 py-3 text-center text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Cerrar Sesi├│n
                    </button>
                  </form>
                ) : (
                  <>
                    <Link
                      href="/registro"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full rounded bg-brand px-4 py-3 text-center text-sm font-medium text-white"
                    >
                      Crear cuenta gratis
                    </Link>
                    <Link
                      href="/ingresar"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full rounded border border-border px-4 py-3 text-center text-sm font-medium text-foreground"
                    >
                      Ingresar
                    </Link>
                  </>
                )}
                <Link 
                  href="/#servicios"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-sm font-medium text-foreground-subtle hover:text-brand mt-4"
                >
                  Ver Servicios PlayComun
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
