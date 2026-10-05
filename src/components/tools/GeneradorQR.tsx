"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, Plus, QrCode, Link as LinkIcon, Settings, List, Lock } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { generateQrCodes, getUserQrCodes, QrCode as QrCodeType, updateQrDestination, updateQrStatus } from "@/app/actions/qr"
import Link from "next/link"
import QRCodeLib from "qrcode"

export function GeneradorQR() {
  const [activeTab, setActiveTab] = useState("estatico")
  const [staticText, setStaticText] = useState("https://playcomun.com")
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [qrs, setQrs] = useState<QrCodeType[]>([])
  const [generateCount, setGenerateCount] = useState(1)
  const [generating, setGenerating] = useState(false)

  // Configure QR
  const [configQrId, setConfigQrId] = useState<string | null>(null)
  const [destUrl, setDestUrl] = useState("")

  useEffect(() => {
    checkProAndLoadQrs()
  }, [])

  async function checkProAndLoadQrs() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.rpc('is_pro_user', { check_user_id: user.id })
        if (data) {
          setIsPro(true)
          const userQrs = await getUserQrCodes()
          setQrs(userQrs)

          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search)
            const activateToken = params.get("activate")
            if (activateToken) {
              const qrToActivate = userQrs.find((q: QrCodeType) => q.public_token === activateToken)
              if (qrToActivate) {
                setActiveTab("mis-qr")
                setConfigQrId(qrToActivate.id)
                setDestUrl(qrToActivate.destination_url || "")
                window.history.replaceState({}, document.title, window.location.pathname)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
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
      await generateQrCodes(generateCount)
      const updatedQrs = await getUserQrCodes()
      setQrs(updatedQrs)
      setActiveTab("mis-qr")
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
      const updatedQrs = await getUserQrCodes()
      setQrs(updatedQrs)
      setConfigQrId(null)
      setDestUrl("")
    } catch (e: any) {
      alert(e.message || "Error al configurar QR")
    }
  }

  const handlePauseQr = async (id: string, currentStatus: string) => {
    try {
      await updateQrStatus(id, currentStatus === "paused" ? "active" : "paused" as any)
      const updatedQrs = await getUserQrCodes()
      setQrs(updatedQrs)
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
      
      const qrSize = 50 // 50 mm = 5 cm
      const marginX = 20
      const marginY = 20
      const colSpacing = 10 // Space between columns
      const rowSpacing = 15 // Space between rows

      let col = 0
      let row = 0

      for (let i = 0; i < qrs.length; i++) {
        if (row >= 4) {
          doc.addPage()
          row = 0
          col = 0
        }
        const x = marginX + (col * (qrSize + colSpacing))
        const y = marginY + (row * (qrSize + rowSpacing))
        
        // Generate QR code as Data URI
        const qrUrl = `${window.location.origin}/q/${qrs[i].public_token}`
        const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { 
          width: 500, // high resolution 
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        // Add QR image to PDF
        doc.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize)
        
        // Draw border around the QR area to help with cutting
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.rect(x, y, qrSize, qrSize)
        
        // Add identifier text below the QR code
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(qrs[i].code, x + (qrSize / 2), y + qrSize + 5, { align: "center" })

        col++
        if (col >= 3) {
          col = 0
          row++
        }
      }
      
      doc.save("PlayComun-QR-Dinamicos.pdf")
    } catch (err) {
      console.error(err)
      alert("Error al generar el PDF")
    } finally {
      setGenerating(false)
    }
  }

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
              Mis QR
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
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <div className="text-center p-12 bg-purple-50 rounded-xl border border-purple-100">
                <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Exclusivo para PlayComun Pro</h3>
                <p className="text-purple-700 mb-6">
                  Los códigos QR dinámicos te permiten cambiar el destino en cualquier momento sin tener que volver a imprimirlos.
                </p>
                <Link href="/planes" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                  Conocer PlayComun Pro
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Generar nuevos QR dinámicos</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Se crearán códigos QR en blanco (sin destino). Podrás imprimirlos y asignarles una URL más adelante escaneándolos con tu celular.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Cantidad de QR a generar</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        min="1" 
                        max="1000" 
                        value={generateCount} 
                        onChange={(e: any) => setGenerateCount(parseInt(e.target.value) || 1)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateDynamic} 
                    disabled={generating} 
                    className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-medium py-2 rounded-lg disabled:opacity-50"
                  >
                    {generating ? "Generando..." : "Generar QR"}
                  </button>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-border flex flex-col justify-center text-center">
                  <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900">¿Cómo funciona?</h4>
                  <ol className="text-sm text-gray-600 text-left mt-4 space-y-2 list-decimal list-inside">
                    <li>Generás los códigos en cantidad</li>
                    <li>Descargás el PDF e imprimís</li>
                    <li>Pegás el QR donde lo necesites</li>
                    <li>Lo escaneás con tu celular para activarlo</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "mis-qr" && isPro && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Tus Códigos QR</h3>
              <button onClick={handleGeneratePDF} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
            </div>

            <div className="space-y-4">
              {qrs.map(qr => (
                <div key={qr.id} className="p-4 bg-white border border-border rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <QRCodeSVG value={`${window.location.origin}/q/${qr.public_token}`} size={50} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{qr.code}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${qr.status === 'active' ? 'bg-green-500' : qr.status === 'unconfigured' ? 'bg-yellow-400' : 'bg-red-500'}`}></span>
                        {qr.status === 'active' ? 'Activo' : qr.status === 'unconfigured' ? 'Sin configurar' : 'Pausado'}
                      </div>
                      {qr.destination_url && (
                        <div className="text-sm text-blue-600 truncate max-w-xs mt-1">
                          {qr.destination_url}
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
                          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
                        />
                        <button onClick={() => handleActivateQr(qr.id)} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700">Guardar</button>
                        <button onClick={() => setConfigQrId(null)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => {
                          setConfigQrId(qr.id)
                          setDestUrl(qr.destination_url || "")
                        }} className="flex items-center gap-2 border border-gray-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
                          <Settings className="w-4 h-4" />
                          {qr.status === 'unconfigured' ? 'Activar' : 'Cambiar destino'}
                        </button>
                        {qr.status !== 'unconfigured' && (
                          <button onClick={() => handlePauseQr(qr.id, qr.status)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                            {qr.status === 'paused' ? 'Reactivar' : 'Pausar'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {qrs.length === 0 && (
                <div className="text-center py-12 text-gray-500 border border-dashed rounded-xl">
                  No tenés códigos QR generados todavía.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

