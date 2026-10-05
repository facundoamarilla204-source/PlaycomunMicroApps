"use client"

import React, { useState, useRef, useEffect } from "react"
import { Plus, Trash2, Download, Printer, Share2, AlertCircle, Upload, Lock, Crown, ImageIcon } from "lucide-react"
// jsPDF and html2canvas will be dynamically imported for performance
import { Concepto, Presupuesto, calcularSubtotal, calcularTotalDescuentos, calcularTotal, formatoMoneda, generarNumeroPresupuesto } from "@/lib/presupuesto"

export function GeneradorPresupuestos() {
  const [mounted, setMounted] = useState(false)
  
  const [presupuesto, setPresupuesto] = useState<Presupuesto>({
    emisor: { nombre: "", cuit: "", telefono: "", email: "", direccion: "" },
    cliente: { nombre: "", cuit: "", email: "", telefono: "" },
    info: { 
      numero: "", 
      fecha: new Date().toISOString().split("T")[0], 
      vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], 
      moneda: "ARS", 
      condiciones: "" 
    },
    conceptos: []
  })
  
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  
  // TODO: Reemplazar por auth real
  const userEmail = "fakuanillo59@gmail.com"
  const isPremium = userEmail === "fakuanillo59@gmail.com"
  
  const previewRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setPresupuesto(p => ({
      ...p,
      info: { ...p.info, numero: generarNumeroPresupuesto() }
    }))
  }, [])

  const handleEmisorChange = (field: string, value: string) => {
    setPresupuesto(p => ({ ...p, emisor: { ...p.emisor, [field]: value } }))
  }

  const handleClienteChange = (field: string, value: string) => {
    setPresupuesto(p => ({ ...p, cliente: { ...p.cliente, [field]: value } }))
  }

  const handleInfoChange = (field: string, value: string) => {
    setPresupuesto(p => ({ ...p, info: { ...p.info, [field]: value } }))
  }

  const agregarConcepto = () => {
    const nuevoConcepto: Concepto = {
      id: Math.random().toString(36).substring(2, 9),
      descripcion: "",
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0
    }
    setPresupuesto(p => ({ ...p, conceptos: [...p.conceptos, nuevoConcepto] }))
  }

  const eliminarConcepto = (id: string) => {
    setPresupuesto(p => ({ ...p, conceptos: p.conceptos.filter(c => c.id !== id) }))
  }

  const handleConceptoChange = (id: string, field: string, value: string | number) => {
    setPresupuesto(p => ({
      ...p,
      conceptos: p.conceptos.map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) return
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("El logo debe pesar menos de 2MB.")
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        handleEmisorChange("logo", event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const limpiarFormulario = () => {
    if (confirm("¿Estás seguro de que querés borrar todo el presupuesto?")) {
      setPresupuesto({
        emisor: { nombre: "", cuit: "", telefono: "", email: "", direccion: "" },
        cliente: { nombre: "", cuit: "", email: "", telefono: "" },
        info: { 
          numero: generarNumeroPresupuesto(), 
          fecha: new Date().toISOString().split("T")[0], 
          vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], 
          moneda: "ARS", 
          condiciones: "" 
        },
        conceptos: []
      })
      setError(null)
    }
  }

  const validar = (): boolean => {
    if (!presupuesto.emisor.nombre.trim()) {
      setError("Tenés que ingresar tu nombre o el de tu empresa (Emisor).")
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    if (!presupuesto.cliente.nombre.trim()) {
      setError("Tenés que ingresar el nombre o empresa del cliente.")
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    if (presupuesto.conceptos.length === 0) {
      setError("El presupuesto debe tener al menos un concepto.")
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    for (const c of presupuesto.conceptos) {
      if (!c.descripcion.trim()) {
        setError("Todos los conceptos deben tener una descripción.")
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return false
      }
      if (c.cantidad <= 0) {
        setError("La cantidad de los conceptos debe ser mayor a 0.")
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return false
      }
      if (c.precioUnitario < 0) {
        setError("El precio unitario no puede ser negativo.")
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return false
      }
      if (c.descuento < 0 || c.descuento > 100) {
        setError("El descuento debe estar entre 0% y 100%.")
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return false
      }
    }
    setError(null)
    return true
  }

  const generarPDF = async () => {
    if (!validar()) return
    
    if (previewRef.current) {
      setGenerando(true)
      try {
        const element = previewRef.current
        
        // Ensure images are loaded and fonts are ready (html2canvas uses DOM)
        const html2canvas = (await import("html2canvas")).default
        const canvas = await html2canvas(element, { 
          scale: 2, // High quality 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })
        
        const imgData = canvas.toDataURL("image/jpeg", 1.0)
        
        const { jsPDF } = await import("jspdf")
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        })
        
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)
        pdf.save(`Presupuesto_${presupuesto.info.numero}.pdf`)
      } catch (err) {
        console.error("Error al generar PDF", err)
        setError("Ocurrió un error al generar el PDF. Probá usando otro navegador o dispositivo.")
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } finally {
        setGenerando(false)
      }
    }
  }

  const imprimir = () => {
    if (!validar()) return
    window.print()
  }

  const compartir = async () => {
    if (!validar()) return
    
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Presupuesto ${presupuesto.info.numero}`,
          text: `Te envío el presupuesto de parte de ${presupuesto.emisor.nombre}.`,
        })
      } catch (err) {
        console.log("Error al compartir", err)
      }
    } else {
      alert("Tu navegador no soporta la función de compartir nativa. Podés descargar el PDF y enviarlo manualmente.")
    }
  }

  const subtotal = calcularSubtotal(presupuesto.conceptos)
  const totalDescuentos = calcularTotalDescuentos(presupuesto.conceptos)
  const total = calcularTotal(presupuesto.conceptos)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!generando) generarPDF();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        imprimir();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        agregarConcepto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presupuesto, generando]);

  if (!mounted) return null

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 pb-20">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      
      {/* ERROR MESSAGE (Scrolls to this ref) */}
      <div ref={errorRef}>
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* FORMULARIO */}
        <div className="w-full lg:w-[45%] flex flex-col gap-6 print:hidden">
          
          {/* EMISOR */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 border-b pb-2">1. Tus Datos (Emisor)</h2>
            
            {/* LOGO PREMIUM */}
            <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-neutral-200 relative overflow-hidden group transition-all">
              {!isPremium && (
                <div className="absolute inset-0 bg-neutral-50/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center border border-neutral-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                    <Lock className="w-6 h-6 text-neutral-400" />
                  </div>
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2">Logo de tu Marca <Crown className="w-4 h-4 text-yellow-500" /></h3>
                  <p className="text-sm text-neutral-500 mt-1 max-w-[250px] text-center">Disponible en la versión Premium</p>
                </div>
              )}
              <div className={`flex items-center gap-4 ${!isPremium ? 'opacity-30' : ''}`}>
                <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 overflow-hidden relative">
                  {presupuesto.emisor.logo ? (
                    <img src={presupuesto.emisor.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Logo de tu Empresa</label>
                  <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors ${isPremium ? 'cursor-pointer text-neutral-700' : 'cursor-not-allowed text-neutral-400'}`}>
                    <Upload className="w-4 h-4" />
                    Subir imagen
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={!isPremium}
                    />
                  </label>
                  <p className="text-xs text-neutral-500 mt-2">JPG o PNG. Máx 2MB.</p>
                </div>
                {presupuesto.emisor.logo && isPremium && (
                  <button onClick={() => handleEmisorChange("logo", "")} className="text-red-500 hover:text-red-600 p-2" title="Eliminar logo">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre o Empresa *</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.emisor.nombre} onChange={(e) => handleEmisorChange("nombre", e.target.value)} placeholder="Ej: Diseño & Co." />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">CUIT (Opcional)</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.emisor.cuit || ""} onChange={(e) => handleEmisorChange("cuit", e.target.value)} placeholder="00-00000000-0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.emisor.telefono || ""} onChange={(e) => handleEmisorChange("telefono", e.target.value)} placeholder="Ej: 11 0000-0000" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.emisor.email || ""} onChange={(e) => handleEmisorChange("email", e.target.value)} placeholder="hola@empresa.com" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección (Opcional)</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.emisor.direccion || ""} onChange={(e) => handleEmisorChange("direccion", e.target.value)} placeholder="Ej: Av. Siempre Viva 742" />
              </div>
            </div>
          </div>

          {/* CLIENTE */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 border-b pb-2">2. Datos del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre o Empresa *</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.cliente.nombre} onChange={(e) => handleClienteChange("nombre", e.target.value)} placeholder="Ej: Cliente S.A." />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">CUIT (Opcional)</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.cliente.cuit || ""} onChange={(e) => handleClienteChange("cuit", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email (Opcional)</label>
                <input type="email" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow" value={presupuesto.cliente.email || ""} onChange={(e) => handleClienteChange("email", e.target.value)} />
              </div>
            </div>
          </div>

          {/* DETALLES DEL PRESUPUESTO */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 border-b pb-2">3. Detalles del Presupuesto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nº Presupuesto</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none font-mono" value={presupuesto.info.numero} onChange={(e) => handleInfoChange("numero", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Moneda</label>
                <select className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none" value={presupuesto.info.moneda} onChange={(e) => handleInfoChange("moneda", e.target.value)}>
                  <option value="ARS">Pesos Argentinos (ARS)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
                <input type="date" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none" value={presupuesto.info.fecha} onChange={(e) => handleInfoChange("fecha", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Válido hasta</label>
                <input type="date" className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none" value={presupuesto.info.vencimiento} onChange={(e) => handleInfoChange("vencimiento", e.target.value)} />
              </div>
            </div>
          </div>

          {/* CONCEPTOS */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 border-b pb-2">4. Conceptos</h2>
            
            {presupuesto.conceptos.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm bg-neutral-50 rounded-xl border border-dashed border-neutral-300 mb-4">
                Todavía no agregaste ningún producto o servicio. Hacé clic en "Agregar ítem al presupuesto" para empezar.
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {presupuesto.conceptos.map((c, i) => (
                  <div key={c.id} className="p-4 border border-neutral-200 rounded-xl bg-white shadow-sm relative group">
                    <button onClick={() => eliminarConcepto(c.id)} className="absolute -top-3 -right-3 p-1.5 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full transition-colors shadow-sm" title="Eliminar concepto">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-12">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Descripción *</label>
                        <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" value={c.descripcion} onChange={(e) => handleConceptoChange(c.id, "descripcion", e.target.value)} placeholder="Ej: Diseño de logo y manual de marca" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Cant.</label>
                        <input type="number" min="1" step="0.5" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" value={c.cantidad || ""} onChange={(e) => handleConceptoChange(c.id, "cantidad", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Precio Unit.</label>
                        <input type="number" min="0" step="100" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" value={c.precioUnitario || ""} onChange={(e) => handleConceptoChange(c.id, "precioUnitario", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Desc. (%)</label>
                        <input type="number" min="0" max="100" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" value={c.descuento || ""} onChange={(e) => handleConceptoChange(c.id, "descuento", parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={agregarConcepto} className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-brand/50 text-brand font-semibold rounded-xl hover:bg-brand/5 transition-colors">
              <Plus className="w-5 h-5" /> Agregar ítem al presupuesto
            </button>
          </div>

          {/* OBSERVACIONES */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 border-b pb-2">5. Observaciones o Condiciones</h2>
            <textarea 
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none resize-none transition-shadow" 
              placeholder="Ej: El presupuesto tiene una validez de 15 días. Las formas de pago son 50% de anticipo y 50% contra entrega. No incluye costos de dominio o hosting."
              value={presupuesto.info.condiciones}
              onChange={(e) => handleInfoChange("condiciones", e.target.value)}
            />
          </div>
          
          <div className="text-center mb-8">
             <button onClick={limpiarFormulario} className="px-4 py-2 text-sm text-neutral-600 font-medium hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
              Borrar todos los datos y empezar de cero
            </button>
          </div>

        </div>

        {/* VISTA PREVIA Y ACCIONES (FIJO EN ESCRITORIO) */}
        <div className="w-full lg:w-[55%] lg:sticky lg:top-8 flex flex-col gap-6">
          
          {/* ACCIONES PRINCIPALES */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 print:hidden flex flex-col sm:flex-row flex-wrap gap-3">
            <button 
              onClick={generarPDF} 
              disabled={generando}
              className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-brand/20"
            >
              <Download className="w-5 h-5" /> {generando ? "Generando..." : "Descargar PDF"}
            </button>
            <button 
              onClick={imprimir} 
              className="flex-1 bg-neutral-800 hover:bg-neutral-900 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-neutral-900/20"
            >
              <Printer className="w-5 h-5" /> Imprimir
            </button>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button 
                onClick={compartir} 
                className="w-full sm:w-auto bg-white border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-5 h-5" /> Compartir
              </button>
            )}
          </div>

          <div className="flex items-center justify-between print:hidden px-2">
            <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block animate-pulse"></span>
              Vista Previa del Documento
            </h3>
          </div>

          {/* CONTENEDOR VISTA PREVIA */}
          <div className="w-full bg-[#e5e5e5]/70 p-4 md:p-6 rounded-2xl print:p-0 print:bg-white shadow-inner flex justify-center overflow-x-auto">
            
            {/* ELEMENTO A CAPTURAR */}
            <div 
              ref={previewRef}
              id="print-area"
              className="w-full min-w-[600px] max-w-[794px] relative bg-white shadow-xl print:shadow-none"
              style={{ 
                minHeight: "1050px",
                fontFamily: "var(--font-sans), sans-serif",
                color: "#1f2937",
              }}
            >
              
              {/* HEADER DISEÑADO (Elegante y limpio) */}
              <div className="px-12 py-12 flex justify-between items-start border-b" style={{ borderColor: "#f0f0f0" }}>
                <div className="flex-1">
                  {presupuesto.emisor.logo ? (
                    <img src={presupuesto.emisor.logo} alt="Logo Emisor" className="h-16 object-contain mb-6" />
                  ) : (
                    <div className="h-4"></div> /* Espaciador si no hay logo */
                  )}
                  <h1 className="text-4xl font-black mb-2" style={{ color: "#111827" }}>Presupuesto</h1>
                  <p className="font-semibold text-sm" style={{ color: "#6b7280" }}>{presupuesto.info.numero}</p>
                </div>
                
                <div className="text-right max-w-[280px] pt-2">
                  <p className="font-bold text-lg mb-1" style={{ color: "#111827" }}>{presupuesto.emisor.nombre || "Tu Empresa"}</p>
                  {presupuesto.emisor.cuit && <p className="text-xs" style={{ color: "#4b5563" }}>CUIT: {presupuesto.emisor.cuit}</p>}
                  {presupuesto.emisor.telefono && <p className="text-xs" style={{ color: "#4b5563" }}>{presupuesto.emisor.telefono}</p>}
                  {presupuesto.emisor.email && <p className="text-xs" style={{ color: "#4b5563" }}>{presupuesto.emisor.email}</p>}
                  {presupuesto.emisor.direccion && <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{presupuesto.emisor.direccion}</p>}
                </div>
              </div>

              {/* INFO CRÍTICA (Cliente y Fechas) */}
              <div className="px-12 py-8 flex justify-between items-start">
                <div className="w-[50%]">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Preparado para</p>
                  <p className="font-bold text-base mb-1" style={{ color: "#111827" }}>{presupuesto.cliente.nombre || "Nombre del Cliente"}</p>
                  {presupuesto.cliente.cuit && <p className="text-xs" style={{ color: "#4b5563" }}>CUIT: {presupuesto.cliente.cuit}</p>}
                  {presupuesto.cliente.email && <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{presupuesto.cliente.email}</p>}
                  {presupuesto.cliente.telefono && <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{presupuesto.cliente.telefono}</p>}
                </div>
                
                <div className="w-[40%]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Fecha de emisión</span>
                    <span className="text-sm font-semibold" style={{ color: "#111827" }}>{new Date(presupuesto.info.fecha).toLocaleDateString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Válido hasta</span>
                    <span className="text-sm font-semibold" style={{ color: "#111827" }}>{new Date(presupuesto.info.vencimiento).toLocaleDateString("es-AR")}</span>
                  </div>
                </div>
              </div>

              {/* TABLA DE CONCEPTOS DISEÑADA */}
              <div className="px-12 mb-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                      <th className="py-3 px-2 font-bold text-[10px] uppercase tracking-widest" style={{ color: "#6b7280" }}>Descripción</th>
                      <th className="py-3 px-2 font-bold text-[10px] uppercase tracking-widest text-center" style={{ color: "#6b7280" }}>Cant.</th>
                      <th className="py-3 px-2 font-bold text-[10px] uppercase tracking-widest text-right" style={{ color: "#6b7280" }}>Precio Unit.</th>
                      <th className="py-3 px-2 font-bold text-[10px] uppercase tracking-widest text-right" style={{ color: "#6b7280" }}>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuesto.conceptos.length > 0 ? (
                      presupuesto.conceptos.map((c, index) => {
                        const base = c.cantidad * c.precioUnitario
                        const desc = base * (c.descuento / 100)
                        const final = base - desc
                        return (
                          <tr key={c.id} className="border-b border-dashed" style={{ borderColor: "#f3f4f6" }}>
                            <td className="py-4 px-2">
                              <p className="font-semibold text-sm" style={{ color: "#111827" }}>{c.descripcion || "Sin descripción"}</p>
                              {c.descuento > 0 && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}>Desc. {c.descuento}%</span>}
                            </td>
                            <td className="py-4 px-2 text-center text-sm font-medium" style={{ color: "#374151" }}>{c.cantidad}</td>
                            <td className="py-4 px-2 text-right text-sm" style={{ color: "#374151" }}>{formatoMoneda(c.precioUnitario, presupuesto.info.moneda)}</td>
                            <td className="py-4 px-2 font-bold text-right text-sm" style={{ color: "#111827" }}>{formatoMoneda(final, presupuesto.info.moneda)}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center italic text-sm" style={{ color: "#9ca3af" }}>El presupuesto aún no tiene ítems detallados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTALES DISEÑADOS */}
              <div className="px-12 flex justify-end mb-16">
                <div className="w-[320px] bg-[#f9fafb] p-6 rounded-xl border border-dashed" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-xs" style={{ color: "#6b7280" }}>Subtotal</span>
                    <span className="font-semibold text-sm" style={{ color: "#374151" }}>{formatoMoneda(subtotal, presupuesto.info.moneda)}</span>
                  </div>
                  
                  {totalDescuentos > 0 && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-xs" style={{ color: "#6b7280" }}>Descuentos</span>
                      <span className="font-semibold text-sm" style={{ color: "#16a34a" }}>-{formatoMoneda(totalDescuentos, presupuesto.info.moneda)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "#e5e7eb" }}>
                    <span className="font-bold text-sm" style={{ color: "#111827" }}>Total ({presupuesto.info.moneda})</span>
                    <span className="text-xl font-black" style={{ color: "#111827" }}>{formatoMoneda(total, presupuesto.info.moneda)}</span>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES */}
              {presupuesto.info.condiciones && (
                <div className="px-12 mb-20">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#6b7280" }}>Términos y Condiciones</h4>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "#4b5563" }}>{presupuesto.info.condiciones}</p>
                </div>
              )}

              {/* FOOTER PDF */}
              <div className="absolute bottom-0 left-0 right-0 px-12 py-8 flex justify-between items-end border-t" style={{ borderColor: "#f3f4f6", backgroundColor: "#ffffff" }}>
                <p className="text-[10px] font-medium" style={{ color: "#9ca3af" }}>
                  Documento generado el {new Date().toLocaleDateString("es-AR")}
                </p>
                {!isPremium ? (
                  <div className="flex items-center gap-1 opacity-60">
                    <span className="text-[10px]" style={{ color: "#9ca3af" }}>Generado gratis con</span>
                    <strong className="text-[10px]" style={{ color: "#111827" }}>Playcomun</strong>
                  </div>
                ) : (
                  <div className="h-4"></div>
                )}
              </div>

            </div>
          </div>
          
        </div>

      </div>
    </div>
  )
}


