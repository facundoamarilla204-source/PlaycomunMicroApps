"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, Plus, QrCode, Link as LinkIcon, Settings, List, Lock, ChevronLeft, Search } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { generateQrCodes, getGroupQrs, getUserQrGroups, QrCode as QrCodeType, QrGroup, updateQrDestination, updateQrStatus } from "@/app/actions/qr"
import Link from "next/link"

export function GeneradorQR() {
  const [activeTab, setActiveTab] = useState("estatico")
  const [staticText, setStaticText] = useState("https://playcomun.com")
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<QrGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<QrGroup | null>(null)
  const [qrs, setQrs] = useState<QrCodeType[]>([])
  
  const [generateCount, setGenerateCount] = useState(50)
  const [generating, setGenerating] = useState(false)
  
  const [filter, setFilter] = useState<"todos" | "activos" | "no-activos">("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"lista" | "plancha">("lista")

  // Configure QR
  const [configQrId, setConfigQrId] = useState<string | null>(null)
  const [destUrl, setDestUrl] = useState("")

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
    try {
      const res = await generateQrCodes(generateCount)
      const updatedGroups = await getUserQrGroups()
      setGroups(updatedGroups)
      setActiveTab("mis-qr")
      await loadGroupQrs(res.group)
    } catch (e: any) {
      console.error(e)
      alert("Error al generar QR dinámicos")
    } finally {
      setGenerating(false)
    }
  }

  const handleActivateQr = async (id: string) => {
    try {
      await updateQrDestination(id, destUrl)
      if (selectedGroup) {
        const updatedQrs = await getGroupQrs(selectedGroup.id)
        setQrs(updatedQrs)
      }
      setConfigQrId(null)
      setDestUrl("")
    } catch (e: any) {
      alert(e.message || "Error al configurar QR")
    }
  }

  const handlePauseQr = async (id: string, currentStatus: string) => {
    try {
      await updateQrStatus(id, currentStatus === "paused" ? "active" : "paused" as any)
      if (selectedGroup) {
        const updatedQrs = await getGroupQrs(selectedGroup.id)
        setQrs(updatedQrs)
      }
    } catch (e: any) {
      alert("Error al pausar QR")
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
      alert("Error al generar el PDF")
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
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-border mt-8">
      <div className="w-full">
        <div className="w-full grid grid-cols-2 lg:w-96 mb-8 gap-2 bg-gray-100 p-1 rounded-xl">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'estatico' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('estatico')}
          >
            QR Estático
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'dinamico' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('dinamico')}
          >
            QR Dinámico Pro
          </button>
          {isPro && (
            <button 
              className={`px-4 py-2 col-span-2 rounded-lg text-sm font-medium ${activeTab === 'mis-qr' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('mis-qr')}
            >
              Mis Grupos QR
            </button>
          )}
        </div>

        {activeTab === "estatico" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="static-url" className="text-sm font-medium">URL o Texto</label>
                  <input 
                    id="static-url" 
                    value={staticText} 
                    onChange={(e: any) => setStaticText(e.target.value)} 
                    placeholder="https://..."
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-border">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeSVG id="static-qr-svg" value={staticText || "https://playcomun.com"} size={200} />
                </div>
                <button onClick={handleDownloadStatic} className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-gray-700">
                  <Download className="w-4 h-4" />
                  Descargar PNG
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dinamico" && (
          <div className="space-y-8">
            {!isPro && !loading ? (
              <div className="text-center p-12 bg-slate-50 rounded-xl border border-slate-100">
                <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Exclusivo para PlayComun Pro</h3>
                <p className="text-slate-700 mb-6">
                  Los códigos QR dinámicos te permiten cambiar el destino en cualquier momento sin tener que volver a imprimirlos.
                </p>
                <Link href="/planes" className="inline-block px-6 py-3 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] font-medium">
                  Conocer PlayComun Pro
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Crear nueva tanda de QR dinámicos</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Se generará un Grupo de QR en blanco. Podrás descargar la plancha imprimible y luego configurar la URL de cada código individualmente.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Cantidad de QR (Ej: 50)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        min="1" 
                        max="1000" 
                        value={generateCount} 
                        onChange={(e: any) => setGenerateCount(parseInt(e.target.value) || 1)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] w-full"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateDynamic} 
                    disabled={generating} 
                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium py-3 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {generating ? "Generando..." : "Generar Plancha"}
                  </button>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-border flex flex-col justify-center text-center">
                  <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900">Flujo de Trabajo</h4>
                  <ol className="text-sm text-gray-600 text-left mt-4 space-y-2 list-decimal list-inside">
                    <li>Elegí la cantidad de QR para la tanda.</li>
                    <li>Generá y descargá la plancha en formato PDF (25 por hoja).</li>
                    <li>Imprimí y distribuí los códigos.</li>
                    <li>Configurá la URL de destino de cada QR desde el panel.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "mis-qr" && isPro && !selectedGroup && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Mis Grupos de QR</h3>
            </div>
            
            <div className="space-y-4">
              {groups.map(group => (
                <div key={group.id} className="p-4 bg-white border border-border rounded-xl shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer" onClick={() => loadGroupQrs(group)}>
                  <div>
                    <div className="font-semibold text-[#7C3AED] text-lg flex items-center gap-2">
                      <List className="w-5 h-5" /> Grupo {group.group_code}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Creado el {new Date(group.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                    Ver QRs
                  </button>
                </div>
              ))}
              
              {groups.length === 0 && (
                <div className="text-center py-12 text-gray-500 border border-dashed rounded-xl">
                  No tenés grupos de códigos QR generados todavía.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "mis-qr" && isPro && selectedGroup && (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Grupo {selectedGroup.group_code}</h3>
                  <div className="text-sm text-gray-500">{qrs.length} códigos en esta tanda</div>
                </div>
              </div>
              <button onClick={handleGeneratePDF} className="flex justify-center items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                <Download className="w-4 h-4" />
                Descargar Plancha PDF
              </button>
            </div>
            
            {/* Filters and View Toggles */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-gray-50 p-2 rounded-xl border border-border">
              
              <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                <button 
                  onClick={() => setViewMode("lista")} 
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === "lista" ? "bg-slate-100 text-slate-900" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Configurar (Lista)
                </button>
                <button 
                  onClick={() => setViewMode("plancha")} 
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === "plancha" ? "bg-[#7C3AED] text-white" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Vista Previa (PDF)
                </button>
              </div>

              {viewMode === "lista" && (
                <>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => setFilter("todos")} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex-1 md:flex-none ${filter === "todos" ? "bg-white shadow-sm border border-gray-200 text-slate-900" : "text-gray-500 hover:text-gray-800"}`}>
                      Todos
                    </button>
                    <button onClick={() => setFilter("no-activos")} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex-1 md:flex-none ${filter === "no-activos" ? "bg-white shadow-sm border border-gray-200 text-slate-900" : "text-gray-500 hover:text-gray-800"}`}>
                      No Activos
                    </button>
                    <button onClick={() => setFilter("activos")} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex-1 md:flex-none ${filter === "activos" ? "bg-white shadow-sm border border-gray-200 text-slate-900" : "text-gray-500 hover:text-gray-800"}`}>
                      Activos
                    </button>
                  </div>
                  
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por código (ej: QR-0001)" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 w-full rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>
                </>
              )}
            </div>

            {viewMode === "lista" ? (
              <div className="space-y-4">
                {filteredQrs.map(qr => (
                  <div key={qr.id} className="p-4 bg-white border border-border rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <QRCodeSVG value={`${window.location.origin}/q/${qr.public_token}`} size={45} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{qr.code}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${qr.status === 'active' ? 'bg-green-500' : qr.status === 'unconfigured' ? 'bg-yellow-400' : 'bg-red-500'}`}></span>
                          {qr.status === 'active' ? 'Activo' : qr.status === 'unconfigured' ? 'No activo' : 'Pausado'}
                        </div>
                        {qr.destination_url && (
                          <div className="text-sm text-blue-600 truncate max-w-xs mt-1.5 font-medium flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            <a href={qr.destination_url} target="_blank" rel="noreferrer" className="hover:underline">
                              {qr.destination_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {configQrId === qr.id ? (
                        <div className="flex gap-2">
                          <input 
                            placeholder="https://..." 
                            value={destUrl} 
                            onChange={(e: any) => setDestUrl(e.target.value)} 
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] w-48 md:w-64"
                          />
                          <button onClick={() => handleActivateQr(qr.id)} className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#6D28D9] font-medium">Guardar y Activar</button>
                          <button onClick={() => setConfigQrId(null)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => {
                            setConfigQrId(qr.id)
                            setDestUrl(qr.destination_url || "")
                          }} className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${qr.status === 'unconfigured' ? 'border-[#7C3AED] text-[#7C3AED] hover:bg-purple-50' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                            <Settings className="w-4 h-4" />
                            {qr.status === 'unconfigured' ? 'Configurar URL' : 'Cambiar URL'}
                          </button>
                          {qr.status !== 'unconfigured' && (
                            <button onClick={() => handlePauseQr(qr.id, qr.status)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                              {qr.status === 'paused' ? 'Activar' : 'Desactivar'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredQrs.length === 0 && (
                  <div className="text-center py-12 text-gray-500 border border-dashed rounded-xl bg-gray-50">
                    No se encontraron códigos con los filtros actuales.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 p-8 rounded-xl flex items-center justify-center overflow-x-auto">
                {/* Simular hoja A4 de forma escalada (A4 real: 210mm x 297mm) */}
                <div 
                  className="bg-white border border-gray-300 shadow-md"
                  style={{
                    width: '210mm',
                    minHeight: '297mm', // Permite estirarse si hay muchas filas para la preview infinita, o podemos cortar por páginas. Mejor continuo.
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
                        className="flex flex-col items-center border border-dashed border-gray-400"
                        style={{
                          height: '55mm',
                          paddingTop: '5mm',
                          boxSizing: 'border-box'
                        }}
                      >
                        <QRCodeSVG 
                          value={`${window.location.origin}/q/${qr.public_token}`} 
                          style={{ width: '33mm', height: '33mm' }} 
                        />
                        <span 
                          className="font-bold text-gray-800"
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
    </div>
  )
}
