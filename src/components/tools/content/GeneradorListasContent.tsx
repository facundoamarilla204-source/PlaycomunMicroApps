"use client"
import { useState } from "react"
import { Plus, Download, FileSpreadsheet, Trash2, ArrowUpCircle } from "lucide-react"
import { usePriceLists } from "../generador-listas-precios/usePriceLists"
import { generatePDF } from "../generador-listas-precios/PDFGenerator"
import { PriceListProduct } from "../generador-listas-precios/types"

export default function GeneradorListasContent() {
  const { activeList, setActiveList, addProduct, removeProduct, updatePricesMassively } = usePriceLists()
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [percentage, setPercentage] = useState("10")
  
  const handleAddProduct = () => {
    if (!name || !price) return
    
    addProduct({ 
      id: crypto.randomUUID(), 
      list_id: activeList?.id || crypto.randomUUID(), 
      name, 
      price: Number(price), 
      sort_order: activeList ? activeList.products.length : 0 
    })
    
    setName("")
    setPrice("")
  }

  const handleDownloadPDF = () => {
    if (activeList && activeList.products.length > 0) {
      generatePDF(activeList)
    } else {
      alert("Agrega al menos un producto a tu lista para generar el PDF.")
    }
  }

  const handleUpdatePrices = () => {
    if (!percentage) return
    updatePricesMassively(Number(percentage), true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        
        {/* Editor Area */}
        <div className="flex-1 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <FileSpreadsheet className="text-brand" /> Generador de Listas de Precios
            </h1>
            <p className="mt-2 text-foreground-muted mb-6">
              Agregá productos y generá una lista en PDF con un formato profesional.
            </p>

            {/* Add Product Form */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <input 
                type="text" 
                placeholder="Nombre del producto" 
                className="flex-1 rounded-xl border border-border px-4 py-2 focus:border-brand focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Precio $" 
                className="w-full md:w-32 rounded-xl border border-border px-4 py-2 focus:border-brand focus:outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <button 
                onClick={handleAddProduct}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2 font-semibold text-white transition-all hover:bg-brand-hover active:scale-95"
              >
                <Plus size={18} /> Agregar
              </button>
            </div>

            {/* Product List */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg border-b border-border pb-2">Tus Productos</h2>
              {(!activeList || activeList.products.length === 0) ? (
                <div className="text-center p-8 text-foreground-muted border-2 border-dashed border-border rounded-xl">
                  Aún no agregaste productos. Empieza añadiendo uno arriba.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeList.products.map(product => (
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
            
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="w-full md:w-80 space-y-6">
          <div className="rounded-2xl bg-brand/5 p-6 border border-brand/20 sticky top-24">
            <h3 className="font-bold text-brand mb-4">Acciones de Lista</h3>
            <p className="text-sm text-foreground-muted mb-6">
              Cuando termines de configurar tu lista, descárgala en formato PDF para enviarla a tus clientes.
            </p>
            <button 
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover hover:shadow-lg active:scale-95 mb-6"
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
            <p className="text-xs text-foreground-muted mt-2">
              Aumenta todos los precios actuales según el porcentaje indicado.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
