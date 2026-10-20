"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, Plus, QrCode, Link as LinkIcon, Settings, List, Lock, ChevronLeft, Search } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { generateQrCodes, getGroupQrs, getUserQrGroups, getUserQrPreservedCount, QrCode as QrCodeType, QrGroup, updateQrDestination, updateQrStatus } from "@/app/actions/qr"
import Link from "next/link"

export function GeneradorQR() {
  const [activeTab, setActiveTab] = useState("estatico")
  const [staticText, setStaticText] = useState("https://playcomun.com")
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<QrGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<QrGroup | null>(null)
  const [qrs, setQrs] = useState<QrCodeType[]>([])
  const [preservedCount, setPreservedCount] = useState<{ groupCount: number; codeCount: number }>({ groupCount: 0, codeCount: 0 })
  
  const [generateCount, setGenerateCount] = useState(50)
  const [generating, setGenerating] = useState(false)
  
  const [filter, setFilter] = useState<"todos" | "activos" | "no-activos">("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"lista" | "plancha">("lista")

  // Configure QR
  const [configQrId, setConfigQrId] = useState<string | null>(null)
  const [destUrl, setDestUrl] = useState("")
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  useEffect(() => {
    checkProAndLoadGroups()
  }, [])

  async function checkProAndLoadGroups() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.rpc('is_pro_user', { check_user_id: user.id })
        if (data) {
          setIsPro(true)
          const userGroups = await getUserQrGroups()
          setGroups(userGroups)
        } else {
          // Usuario autenticado pero sin Pro activo: consultar recuento preservado
          const counts = await getUserQrPreservedCount()
          setPreservedCount(counts)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadGroupQrs = async (group: QrGroup) => {
    setSelectedGroup(group)
    setFilter("todos")
    setSearchQuery("")
    try {
      const groupQrs = await getGroupQrs(group.id)
      setQrs(groupQrs)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDownloadStatic = () => {
    const svg = document.getElementById("static-qr-svg")
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.fillStyle === "white"
        ctx?.fillRect(0, 0, canvas.width, canvas.height)
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = "qr-code.png"
        downloadLink.href = `${pngFile}`
        downloadLink.click()
      }
      img.src = "data:image/svg+xml;base64," + btoa(svgData)
    }
  }

  const handleGenerateDynamic = async () => {
    setGenerating(true)
    setErrorNotice(null)
    try {
      const res = await generateQrCodes(generateCount)
      const updatedGroups = await getUserQrGroups()
      setGroups(updatedGroups)
      setActiveTab("mis-qr")
      await loadGroupQrs(res.group)
    } catch (e: any) {
      console.error(e)
      setErrorNotice(e.message || "No se pudieron generar los códigos QR dinámicos. Por favor reintentá.")
    } finally {
      setGenerating(false)
    }
  }

  const handleActivateQr = async (id: string) => {
    setErrorNotice(null)
    try {
      await updateQrDestination(id, destUrl)
      if (selectedGroup) {
        const updatedQrs = await getGroupQrs(selectedGroup.id)
        setQrs(updatedQrs)
      }
      setConfigQrId(null)
      setDestUrl("")
    } catch (e: any) {
      setErrorNotice(e.message || "Error al configurar el destino del código QR")
    }
  }

  const handlePauseQr = async (id: string, currentStatus: string) => {
    setErrorNotice(null)
    try {
      await updateQrStatus(id, currentStatus === "paused" ? "active" : "paused" as any)
      if (selectedGroup) {
        const updatedQrs = await getGroupQrs(selectedGroup.id)
        setQrs(updatedQrs)
      }
    } catch (e: any) {
      setErrorNotice("No se pudo cambiar el estado del código QR.")
    }
  }

  const handleGeneratePDF = async () => {
    setGenerating(true)
    try {
      const { jsPDF } = await import("jspdf")
      // A4 portrait is 210 x 297 mm
      const doc = new jsPDF()
      
      // Hoja A4 = 210mm de ancho. 
      // Márgenes laterales de 10mm => 190mm útiles.
      // 4 columnas => 190 / 4 = 47.5mm de ancho por celda.
      const marginX = 10
      const marginY = 10
      const cellW = 47.5
      const cellH = 55 // Altura de celda para que entre el QR y el texto cómodamente
      
      // QR tamaño: 33mm. Lo centramos en la celda.
      const qrSize = 33
      const paddingX = (cellW - qrSize) / 2 // 7.25mm
      const paddingTop = 5 // Espacio arriba del QR

      let col = 0
      let row = 0

      for (let i = 0; i < qrs.length; i++) {
        // En una hoja A4 (297mm alto) caben: (297 - 20) / 55 = 5.03 -> 5 filas exactas.
        // 5 filas * 4 columnas = 20 QRs por página.
        if (row >= 5) {
          doc.addPage()
          row = 0
          col = 0
        }
        
        const cellX = marginX + (col * cellW)
        const cellY = marginY + (row * cellH)
        
        // Dibujar borde punteado de la celda (guía de corte)
        doc.setDrawColor(150, 150, 150)
        doc.setLineWidth(0.3)
        doc.setLineDashPattern([2, 2], 0)
        doc.rect(cellX, cellY, cellW, cellH)
        
        // Reset dash para otros elementos (aunque no hay)
        doc.setLineDashPattern([], 0)

        // Generar QR
        const qrUrl = `${window.location.origin}/q/${qrs[i].public_token}`
        const QRCodeLib = (await import("qrcode")).default
        const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { 
          width: 400, 
          margin: 0, // 0 margin for precise size
          color: { dark: '#000000', light: '#FFFFFF' }
        })
        
        const qrX = cellX + paddingX
        const qrY = cellY + paddingTop
        
        // Dibujar el QR
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
        
        // Dibujar el texto identificador
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(50, 50, 50)
        // Y position del texto: QR Y + tamaño + margen
        doc.text(qrs[i].code, cellX + (cellW / 2), qrY + qrSize + 7, { align: "center" })

        col++
        if (col >= 4) {
          col = 0
          row++
        }
      }
      
      doc.save(`Plancha_QR_Grupo_${selectedGroup?.group_code}.pdf`)
    } catch (err) {
      console.error(err)
      setErrorNotice("Hubo un problema al generar el archivo PDF de la plancha. Por favor probá de nuevo.")
    } finally {
      setGenerating(false)
    }
  }

  const filteredQrs = qrs.filter(qr => {
    if (filter === "activos" && qr.status !== "active") return false
    if (filter === "no-activos" && qr.status !== "unconfigured") return false
    if (searchQuery && !qr.code.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Segmented Navigation */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1 border border-slate-200/60 max-w-xl mx-auto">
        <button 
          type="button"
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
            activeTab === 'estatico' 
              ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('estatico')}
        >
          QR Estático
        </button>
        <button 
          type="button"
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'dinamico' 
              ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('dinamico')}
        >
          <span>QR Dinámico</span>
          <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-purple-100 text-purple-700">PRO</span>
        </button>
        {isPro && (
          <button 
            type="button"
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'mis-qr' 
                ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('mis-qr')}
          >
            Mis Grupos ({groups.length})
          </button>
        )}
      </div>

      {errorNotice && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <span>{errorNotice}</span>
          <button 
            type="button" 
            onClick={() => setErrorNotice(null)} 
            className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 rounded cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tab: Estático */}
      {activeTab === "estatico" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Contenido del código QR</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Ingresá el enlace a tu sitio web, red social, menú digital o un texto libre.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="static-url" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  URL o Texto a codificar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input 
                    id="static-url" 
                    value={staticText} 
                    onChange={(e: any) => setStaticText(e.target.value)} 
                    placeholder="https://tuempresa.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Código directo e ilimitado
                </div>
                <p>
                  Este código funciona de por vida sin intermediarios y no requiere conexión a internet para ser decodificado.
                </p>
              </div>
            </div>

            {/* QR Preview Column */}
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-50/70 rounded-2xl border border-slate-200/70">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <QRCodeSVG id="static-qr-svg" value={staticText || "https://playcomun.com"} size={220} />
              </div>
              
              <div className="w-full mt-6 space-y-2">
                <button 
                  type="button"
                  onClick={handleDownloadStatic} 
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all min-h-[46px]"
                >
                  <Download className="w-4 h-4" />
                  Descargar Imagen PNG (Alta resolución)
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  Listo para imprimir en stickers, menús, folletos o tarjetas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dinámico */}
      {activeTab === "dinamico" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          {!isPro && !loading ? (
            <div className="text-center py-10 px-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-200/60">
                <Lock className="w-6 h-6" />
              </div>
              <span className="inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-full mb-3">
                Función PlayComun Pro
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Códigos QR Dinámicos Reutilizables
              </h3>
              {preservedCount.groupCount > 0 ? (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200/80 rounded-xl text-xs sm:text-sm text-purple-900 text-left space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Tenés {preservedCount.groupCount} {preservedCount.groupCount === 1 ? 'tanda' : 'tandas'} ({preservedCount.codeCount} códigos QR) preservadas en tu cuenta
                  </div>
                  <p className="text-purple-700 leading-relaxed">
                    Tus códigos impresos continúan resolviendo y funcionando con normalidad. Para generar nuevas tandas o modificar los destinos, reactivá PlayComun Pro.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Imprimí una tanda física de 50 o 100 stickers y cambiá el enlace de destino en tiempo real desde tu panel cuando lo necesites, sin reimprimir nunca más.
                </p>
              )}
              <Link 
                href="/planes" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all min-h-[46px]"
              >
                {preservedCount.groupCount > 0 ? "Reactivar PlayComun Pro" : "Conocer PlayComun Pro"}
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Generar nueva tanda de códigos dinámicos</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Crea un grupo de identificadores únicos en blanco listos para imprimir en plancha A4.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="qr-count" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Cantidad de códigos en la tanda (ej. 50)
                  </label>
                  <input 
                    id="qr-count"
                    type="number" 
                    min="1" 
                    max="1000" 
                    value={generateCount} 
                    onChange={(e: any) => setGenerateCount(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    Se distribuirán a razón de 20 códigos organizados por hoja A4 estándar.
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={handleGenerateDynamic} 
                  disabled={generating} 
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-sm disabled:opacity-50 transition-all min-h-[46px]"
                >
                  {generating ? (
                    <>Generando códigos...</>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Crear Tanda de {generateCount} Códigos
                    </>
                  )}
                </button>
              </div>

              {/* Workflow Column */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/70 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">¿Cómo funciona una tanda?</h4>
                    <p className="text-xs text-slate-500">Flujo de producción sin desperdicio</p>
                  </div>
                </div>

                <ol className="text-xs text-slate-600 space-y-3 pt-2">
                  <li className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <span>Definís la cantidad de códigos y generás la tanda.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <span>Descargás la plancha en PDF vectorizado para mandar a imprenta o impresora láser.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <span>Pegás o entregás los stickers físicos según tus productos o mesas.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0 text-[10px]">4</span>
                    <span>Asignás o actualizás la URL de cada código desde esta misma pantalla cuando quieras.</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Mis QR (List of Groups) */}
      {activeTab === "mis-qr" && isPro && !selectedGroup && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tandas de Códigos Guardadas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Accedé a los códigos de cada lote para administrarlos o reimprimirlos</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {groups.map(group => (
              <div 
                key={group.id} 
                className="p-4 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-4 transition-all cursor-pointer group" 
                onClick={() => loadGroupQrs(group)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <List className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      Grupo {group.group_code}
                    </div>
                    <div className="text-xs text-slate-500">
                      Creado el {new Date(group.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 shadow-sm transition-colors"
                >
                  Administrar QRs →
                </button>
              </div>
            ))}
            
            {groups.length === 0 && (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <QrCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No tenés tandas de códigos QR generadas todavía</p>
                <p className="text-xs text-slate-400 mt-1">Generá tu primera tanda desde la pestaña &quot;QR Dinámico&quot;.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Mis QR (Selected Group Detail) */}
      {activeTab === "mis-qr" && isPro && selectedGroup && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setSelectedGroup(null)} 
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                title="Volver al listado de tandas"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base font-bold text-slate-900">Grupo {selectedGroup.group_code}</h3>
                <div className="text-xs text-slate-500">{qrs.length} códigos en este lote</div>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={handleGeneratePDF} 
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all min-h-[42px]"
            >
              <Download className="w-4 h-4" />
              {generating ? "Generando..." : "Descargar Plancha PDF (A4)"}
            </button>
          </div>
          
          {/* Controls & Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
            <div className="inline-flex bg-white rounded-lg p-1 border border-slate-200 shrink-0">
              <button 
                type="button"
                onClick={() => setViewMode("lista")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  viewMode === "lista" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Administrar (Lista)
              </button>
              <button 
                type="button"
                onClick={() => setViewMode("plancha")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  viewMode === "plancha" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Vista de Plancha (A4)
              </button>
            </div>

            {viewMode === "lista" && (
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1 lg:justify-end">
                <div className="inline-flex bg-white rounded-lg p-1 border border-slate-200 text-xs">
                  <button 
                    type="button"
                    onClick={() => setFilter("todos")} 
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      filter === "todos" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Todos ({qrs.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFilter("no-activos")} 
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      filter === "no-activos" ? "bg-amber-100 text-amber-800 font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Sin URL
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFilter("activos")} 
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      filter === "activos" ? "bg-emerald-100 text-emerald-800 font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Activos
                  </button>
                </div>
                
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar código (ej: QR-0001)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-full rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* List View */}
          {viewMode === "lista" ? (
            <div className="space-y-3">
              {filteredQrs.map(qr => (
                <div 
                  key={qr.id} 
                  className="p-4 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 shrink-0">
                      <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/q/${qr.public_token}`} size={48} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{qr.code}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          qr.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : qr.status === 'unconfigured' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            qr.status === 'active' ? 'bg-emerald-500' : qr.status === 'unconfigured' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></span>
                          {qr.status === 'active' ? 'Activo' : qr.status === 'unconfigured' ? 'Sin URL' : 'Pausado'}
                        </span>
                      </div>
                      
                      {qr.destination_url ? (
                        <div className="text-xs text-purple-700 truncate max-w-sm mt-1 font-medium flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 shrink-0 text-purple-500" />
                          <a href={qr.destination_url} target="_blank" rel="noreferrer" className="hover:underline truncate">
                            {qr.destination_url}
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-1">
                          Aún no redirige a ninguna página
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {configQrId === qr.id ? (
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full md:w-auto">
                        <input 
                          placeholder="https://tu-sitio.com" 
                          value={destUrl} 
                          onChange={(e: any) => setDestUrl(e.target.value)} 
                          className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 flex-1 min-w-[200px]"
                        />
                        <button 
                          type="button"
                          onClick={() => handleActivateQr(qr.id)} 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0"
                        >
                          Guardar
                        </button>
                        <button 
                          type="button"
                          onClick={() => setConfigQrId(null)} 
                          className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors shrink-0"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button"
                          onClick={() => {
                            setConfigQrId(qr.id)
                            setDestUrl(qr.destination_url || "")
                          }} 
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                            qr.status === 'unconfigured' 
                              ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                          {qr.status === 'unconfigured' ? 'Asignar URL' : 'Editar URL'}
                        </button>
                        {qr.status !== 'unconfigured' && (
                          <button 
                            type="button"
                            onClick={() => handlePauseQr(qr.id, qr.status)} 
                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium border border-slate-200 transition-colors"
                          >
                            {qr.status === 'paused' ? 'Activar' : 'Pausar'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredQrs.length === 0 && (
                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs">
                  No se encontraron códigos coincidentes.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-100/90 p-4 sm:p-8 rounded-2xl flex items-center justify-center overflow-x-auto border border-slate-200">
              <div 
                className="bg-white border border-slate-300 shadow-md rounded-sm"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '10mm',
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: 'repeat(4, 1fr)',
                  }}
                >
                  {qrs.map(qr => (
                    <div 
                      key={qr.id} 
                      className="flex flex-col items-center border border-dashed border-slate-300"
                      style={{
                        height: '55mm',
                        paddingTop: '5mm',
                        boxSizing: 'border-box'
                      }}
                    >
                      <QRCodeSVG 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/q/${qr.public_token}`} 
                        style={{ width: '33mm', height: '33mm' }} 
                      />
                      <span 
                        className="font-bold text-slate-800"
                        style={{
                          fontSize: '10pt',
                          marginTop: '7mm',
                          fontFamily: 'Helvetica, Arial, sans-serif'
                        }}
                      >
                        {qr.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
