"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { tools } from "@/data/tools"

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = query
    ? tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query.toLowerCase()) ||
          tool.description.toLowerCase().includes(query.toLowerCase()) ||
          tool.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      )
    : []

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault()
        router.push(`/herramientas/${results[selectedIndex].slug}`)
        onOpenChange(false)
      } else if (e.key === "Escape") {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, results, selectedIndex, router, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh]">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 mx-4">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-foreground-muted" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent px-4 py-1 outline-none placeholder:text-foreground-subtle"
            placeholder="Buscar herramientas..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
          />
          <button 
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-foreground-muted hover:bg-brand-light hover:text-brand"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-2">
          {query && results.length === 0 && (
            <p className="p-4 text-center text-sm text-foreground-muted">
              No encontramos esa herramienta. Probá con otra palabra.
            </p>
          )}
          
          {results.map((tool, index) => (
            <div
              key={tool.slug}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 ${
                index === selectedIndex ? "bg-brand-light" : "hover:bg-gray-50"
              }`}
              onClick={() => {
                router.push(`/herramientas/${tool.slug}`)
                onOpenChange(false)
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div>
                <h4 className={`text-sm font-medium ${index === selectedIndex ? "text-brand" : "text-foreground"}`}>
                  {tool.name}
                </h4>
                <p className="text-xs text-foreground-subtle line-clamp-1">{tool.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {tool.tier === "free" ? (
                  <span className="rounded bg-free-bg px-2 py-0.5 text-xs font-medium text-free-text">Gratis</span>
                ) : (
                  <span className="rounded bg-pro-bg px-2 py-0.5 text-xs font-medium text-pro-text">Pro</span>
                )}
              </div>
            </div>
          ))}
          
          {!query && (
            <p className="p-4 text-center text-sm text-foreground-muted">
              Ingresá un término para buscar herramientas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
