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
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <FileSpreadsheet className="text-brand" /> Editor de Lista
              </h1>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground-muted">Rubro:</label>
                <select 
                  className="rounded-xl border border-border px-4 py-2 font-medium focus:border-brand focus:outline-none"
                  value={activeList.rubro}
                  onChange={handleRubroChange}
                >
                  {RUBROS.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <p className="mt-2 text-foreground-muted mb-6">
              Agregá categorías y luego cargá tus productos o servicios en ellas.
            </p>

            {/* Crear Categoría */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-border">
              <input 
                type="text" 
                placeholder="Nueva Categoría (ej: Entradas, Remeras, Tratamientos)" 
                className="flex-1 rounded-xl border border-border px-4 py-2 focus:border-brand focus:outline-none"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
              <button 
                onClick={handleAddCategory}
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-2 font-semibold text-white transition-all hover:bg-gray-800"
              >
                <Plus size={18} /> Crear Categoría
              </button>
            </div>

            {/* Crear Producto */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <select 
                className="rounded-xl border border-border px-4 py-2 focus:border-brand focus:outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Seleccionar Categoría...</option>
                {activeList.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="Nombre del ítem" 
                className="flex-1 rounded-xl border border-border px-4 py-2 focus:border-brand focus:outline-none"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Precio $" 
                className="w-full md:w-32 rounded-xl border border-border px-4 py-2 focus:border-brand focus:outline-none"
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
              />
              <button 
                onClick={handleAddProduct}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2 font-semibold text-white transition-all hover:bg-brand-hover"
              >
                <Plus size={18} /> Agregar
              </button>
            </div>

            {/* Lista */}
            <div className="space-y-6">
              {activeList.categories.length === 0 ? (
                <div className="text-center p-8 text-foreground-muted border-2 border-dashed border-border rounded-xl">
                  Aún no agregaste categorías.
                </div>
              ) : (
                activeList.categories.map(cat => {
                  const catProducts = activeList.products.filter(p => p.category_id === cat.id)
                  return (
                    <div key={cat.id} className="space-y-3">
                      <h3 className="font-bold text-lg text-foreground border-b-2 border-brand/20 pb-1">{cat.name}</h3>
                      {catProducts.length === 0 ? (
                        <p className="text-sm text-foreground-muted italic px-2">Categoría vacía</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {catProducts.map(product => (
                            <div key={product.id} className="flex justify-between items-center p-3 rounded-lg border border-border/50 bg-gray-50/50">
                              <span className="font-medium text-foreground">{product.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="font-bold text-brand">${product.price.toLocaleString('es-AR')}</span>
                                <button 
                                  onClick={() => removeProduct(product.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                                >
                                  <Trash2 size={16} />
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
          <div className="rounded-2xl bg-brand/5 p-6 border border-brand/20 sticky top-24">
            <h3 className="font-bold text-brand mb-4">Exportar PDF</h3>
            <p className="text-sm text-foreground-muted mb-6">
              El diseño de {RUBROS.find(r => r.id === activeList.rubro)?.title} se aplicará automáticamente al descargar.
            </p>
            <button 
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover mb-6"
            >
              <Download size={20} /> Generar PDF
            </button>

            <h4 className="font-semibold text-foreground border-t border-border pt-4 mb-3">Actualización Masiva</h4>
            <div className="flex gap-2">
              <input 
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                placeholder="%"
              />
              <button 
                onClick={handleUpdatePrices}
                className="flex items-center gap-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                <ArrowUpCircle size={16} /> Subir %
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
