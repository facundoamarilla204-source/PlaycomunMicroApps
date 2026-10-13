"use client"
import { useState, useEffect } from "react"
import { Plus, Download, FileSpreadsheet, Trash2, ArrowUpCircle } from "lucide-react"
import { usePriceLists } from "../generador-listas-precios/usePriceLists"
import { generatePDF } from "../generador-listas-precios/PDFGenerator"
import { RubroType } from "../generador-listas-precios/types"

const RUBROS = [
  { id: "gastronomia", title: "Gastronomía" },
  { id: "indumentaria", title: "Indumentaria y Accesorios" },
  { id: "mayorista", title: "Mayoristas y Distribuidores" },
  { id: "peluqueria", title: "Peluquería y Estética" },
  { id: "profesionales", title: "Servicios Profesionales" },
  { id: "general", title: "General" }
] as const

export default function GeneradorListasContent() {
  const { activeList, initList, updateRubro, addCategory, addProduct, removeProduct, updatePricesMassively, loading } = usePriceLists()
  const [catName, setCatName] = useState("")
  const [prodName, setProdName] = useState("")
  const [prodPrice, setProdPrice] = useState("")
  const [percentage, setPercentage] = useState("10")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  
  // Si no hay lista, la inicializamos en general al montar
  useEffect(() => {
    if (!loading && !activeList) {
      initList("general")
    }
  }, [loading, activeList, initList])

  const handleRubroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeList) return
    const nuevoRubro = e.target.value as RubroType
    updateRubro(nuevoRubro)
  }

  const handleAddCategory = () => {
    if (!catName) return
    addCategory(catName)
    setCatName("")
  }

  const handleAddProduct = () => {
    if (!prodName || !prodPrice || !selectedCategory) {
      alert("Seleccioná una categoría, ingresá nombre y precio.")
      return
    }
    
    addProduct({ 
      name: prodName, 
      price: Number(prodPrice), 
      category_id: selectedCategory 
    })
    
    setProdName("")
    setProdPrice("")
  }

  const handleDownloadPDF = () => {
    if (activeList && activeList.products.length > 0) {
      generatePDF(activeList)
    } else {
      alert("Agregá al menos un producto a tu lista.")
    }
  }

  const handleUpdatePrices = () => {
    if (!percentage) return
    updatePricesMassively(Number(percentage), true)
  }

  if (loading || !activeList) return <div className="p-12 text-center text-foreground-muted">Cargando...</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        
        <div className="flex-1 space-y-6">
          <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
              <h1 className="flex items-center gap-2.5 text-xl sm:text-2xl font-bold text-slate-900">
                <FileSpreadsheet className="text-purple-600 w-6 h-6" /> Editor de Catálogo y Precios
              </h1>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Plantilla:</label>
                <select 
                  className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800 bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                  value={activeList.rubro}
                  onChange={handleRubroChange}
                >
                  {RUBROS.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              Organizá tus productos por categoría, definí sus precios y descargá una lista imprimible en PDF con formato profesional.
            </p>

            {/* Crear Categoría */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 pb-6 border-b border-slate-100">
              <input 
                type="text" 
                placeholder="Nueva categoría (ej: Promociones, Pastas, Ropa deportiva)" 
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none placeholder:text-slate-400 font-medium"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleAddCategory}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:bg-slate-950 shrink-0"
              >
                <Plus size={16} /> Crear Categoría
              </button>
            </div>

            {/* Crear Producto */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-8 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="sm:col-span-4">
                <select 
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium bg-white text-slate-800 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Seleccionar Categoría...</option>
                  {activeList.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-5">
                <input 
                  type="text" 
                  placeholder="Nombre del producto o servicio" 
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 font-medium bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none placeholder:text-slate-400"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <input 
                  type="number" 
                  placeholder="Precio $" 
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 font-medium bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={handleAddProduct}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-700 active:bg-purple-800 shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="space-y-6">
              {activeList.categories.length === 0 ? (
                <div className="text-center p-8 text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-sm">
                  Aún no agregaste categorías. Ingresá un nombre arriba para comenzar.
                </div>
              ) : (
                activeList.categories.map(cat => {
                  const catProducts = activeList.products.filter(p => p.category_id === cat.id)
                  return (
                    <div key={cat.id} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h3 className="font-bold text-base text-slate-900">{cat.name}</h3>
                        <span className="text-xs text-slate-400 font-medium">{catProducts.length} {catProducts.length === 1 ? 'producto' : 'productos'}</span>
                      </div>
                      {catProducts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic px-2">Categoría vacía — agregale ítems usando el formulario superior.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {catProducts.map(product => (
                            <div key={product.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/70 transition-colors">
                              <span className="font-medium text-sm text-slate-800">{product.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="font-bold text-purple-700 text-sm">${product.price.toLocaleString('es-AR')}</span>
                                <button 
                                  type="button"
                                  onClick={() => removeProduct(product.id)}
                                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                  title="Eliminar producto"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm sticky top-24 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1 block">Acción Principal</span>
              <h3 className="font-bold text-base text-slate-900 mb-2">Exportar lista en PDF</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                El diseño para <strong>{RUBROS.find(r => r.id === activeList.rubro)?.title}</strong> se compilará con formato de hoja A4 listo para imprimir o enviar.
              </p>
              <button 
                type="button"
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-bold text-sm text-white shadow-sm transition-all hover:bg-purple-700 active:bg-purple-800"
              >
                <Download size={18} /> Descargar PDF
              </button>
            </div>

            <div className="pt-5 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Ajuste de Precios</span>
              <h4 className="font-bold text-sm text-slate-900 mb-2">Aumento porcentual masivo</h4>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Actualizá todos los precios de la lista en simultáneo por inflación o cambio de costos.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="number"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 pr-7 py-2 text-sm font-semibold text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                    placeholder="10"
                  />
                  <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                    %
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={handleUpdatePrices}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shrink-0"
                >
                  <ArrowUpCircle size={15} /> Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
