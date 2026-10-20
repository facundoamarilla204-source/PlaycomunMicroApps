"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  FileText,
  Type,
  PenTool,
  UploadCloud,
  Smartphone,
  Layers,
  Building2,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Shield,
  HelpCircle,
} from "lucide-react"

import {
  PdfSignDocument,
  SignatureElement,
  SignatureElementType,
} from "@/lib/pdf-sign/types"
import {
  loadPdfForSigning,
  embedSignaturesIntoPdf,
} from "@/lib/pdf-sign/sign-engine"
import { GOOGLE_FONTS_SIGNATURE_STYLESHEET } from "@/lib/pdf-sign/fonts"

import { PdfUploadZone } from "./PdfUploadZone"
import { PdfCanvasEditor } from "./PdfCanvasEditor"
import { PageNavigationRail } from "./PageNavigationRail"
import { TypeSignatureModal } from "./TypeSignatureModal"
import { DrawSignatureModal } from "./DrawSignatureModal"
import { UploadSignatureModal } from "./UploadSignatureModal"
import { CompanyLogoModal } from "./CompanyLogoModal"
import { QrMobileModal } from "./QrMobileModal"
import { InitialsModal } from "./InitialsModal"
import { MultiPageApplyModal } from "./MultiPageApplyModal"

export function FirmarPdfTool() {
  const [doc, setDoc] = useState<PdfSignDocument | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0)
  const [elements, setElements] = useState<SignatureElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState<number>(1.25)

  // Loading and feedback states
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modals
  const [isTypeModalOpen, setIsTypeModalOpen] = useState<boolean>(false)
  const [isDrawModalOpen, setIsDrawModalOpen] = useState<boolean>(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)
  const [isCompanyLogoModalOpen, setIsCompanyLogoModalOpen] = useState<boolean>(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false)
  const [isInitialsModalOpen, setIsInitialsModalOpen] = useState<boolean>(false)
  const [multiPageElement, setMultiPageElement] = useState<SignatureElement | null>(null)

  // Pre-load Google Fonts for handwritten signatures
  useEffect(() => {
    const linkId = "playcomun-signature-google-fonts"
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link")
      link.id = linkId
      link.rel = "stylesheet"
      link.href = GOOGLE_FONTS_SIGNATURE_STYLESHEET
      document.head.appendChild(link)
    }
  }, [])

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  // Responsive default zoom
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) {
        setZoomScale(0.85)
      } else if (window.innerWidth < 1024) {
        setZoomScale(1.0)
      } else {
        setZoomScale(1.25)
      }
    }
  }, [])

  // Handle PDF file upload
  const handleLoadPdf = async (file: File, password?: string) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const loaded = await loadPdfForSigning(file, password)
      setDoc(loaded)
      setCurrentPageIndex(0)
      setElements([])
      setSelectedElementId(null)
      setSuccessMessage(
        `Se cargó "${loaded.fileName}" (${loaded.numPages} ${loaded.numPages === 1 ? "página" : "páginas"}) con éxito.`
      )
    } catch (err: any) {
      setErrorMessage(err?.message || "No se pudo procesar el documento PDF.")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Add an element to the current page
  const handleAddElement = (
    type: SignatureElementType,
    source: "type" | "draw" | "upload" | "mobile_qr",
    dataUrl: string,
    title: string,
    aspectRatio: number
  ) => {
    if (!doc) return

    // Calculate initial relative size depending on type
    let initialWidth = 0.28
    if (type === "initials") initialWidth = 0.12
    if (type === "logo") initialWidth = 0.22

    // Target initial placement in the center-lower region of page
    const currentPage = doc.pages[currentPageIndex]
    const visualWidth = currentPage.visualWidth
    const visualHeight = currentPage.visualHeight

    const widthPx = initialWidth * visualWidth
    const heightPx = widthPx / Math.max(0.1, aspectRatio)
    const initialHeight = Math.min(0.4, heightPx / visualHeight)

    const initialX = Math.max(0.05, 0.5 - initialWidth / 2)
    const initialY = Math.max(0.05, 0.65 - initialHeight / 2)

    const newElement: SignatureElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      source,
      pageIndex: currentPageIndex,
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight,
      dataUrl,
      aspectRatio,
      title,
    }

    setElements((prev) => [...prev, newElement])
    setSelectedElementId(newElement.id)
    setSuccessMessage(`Se añadió ${title} en la página ${currentPageIndex + 1}.`)
  }

  // Update existing element
  const handleUpdateElement = (id: string, updated: Partial<SignatureElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updated } : el))
    )
  }

  // Delete element
  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id))
    if (selectedElementId === id) {
      setSelectedElementId(null)
    }
    setSuccessMessage("Elemento quitado del documento.")
  }

  // Duplicate element
  const handleDuplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id)
    if (!el) return

    const duplicated: SignatureElement = {
      ...el,
      id: `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: Math.min(1 - el.width, el.x + 0.03),
      y: Math.min(1 - el.height, el.y + 0.03),
    }

    setElements((prev) => [...prev, duplicated])
    setSelectedElementId(duplicated.id)
    setSuccessMessage("Elemento duplicado.")
  }

  // Apply element across multiple chosen pages
  const handleApplyToPages = (targetPageIndices: number[]) => {
    if (!multiPageElement) return

    const newCopies: SignatureElement[] = []
    for (const pIdx of targetPageIndices) {
      if (pIdx === multiPageElement.pageIndex) continue // Already on this page

      newCopies.push({
        ...multiPageElement,
        id: `elem_${Date.now()}_${pIdx}_${Math.random().toString(36).substring(2, 7)}`,
        pageIndex: pIdx,
      })
    }

    setElements((prev) => [...prev, ...newCopies])
    setSuccessMessage(
      `Se duplicó en ${newCopies.length} ${newCopies.length === 1 ? "página adicional" : "páginas adicionales"}.`
    )
    setMultiPageElement(null)
  }

  // Zoom controls
  const handleZoomIn = () => setZoomScale((prev) => Math.min(2.5, Math.round((prev + 0.2) * 100) / 100))
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.6, Math.round((prev - 0.2) * 100) / 100))
  const handleZoomReset = () => setZoomScale(1.25)

  // Main Export CTA (Embed and Download Signed PDF)
  const handleExportPdf = async () => {
    if (!doc) return
    setIsExporting(true)
    setErrorMessage(null)

    try {
      const signedBlob = await embedSignaturesIntoPdf(doc.arrayBuffer, elements)

      const baseName = doc.fileName.replace(/\.pdf$/i, "")
      const downloadFileName = `${baseName}_firmado.pdf`

      const url = URL.createObjectURL(signedBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = downloadFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage(
        `¡PDF firmado con éxito! Se descargó "${downloadFileName}" con ${elements.length} ${elements.length === 1 ? "elemento incorporado" : "elementos incorporados"}.`
      )
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Ocurrió un error al incrustar los elementos en el documento PDF."
      )
    } finally {
      setIsExporting(false)
    }
  }

  // Reset workbench
  const handleResetWorkbench = () => {
    if (confirm("¿Estás seguro de que deseás cerrar este documento y comenzar de nuevo?")) {
      setDoc(null)
      setElements([])
      setSelectedElementId(null)
      setCurrentPageIndex(0)
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }

  return (
    <div className="w-full">
      {/* Notificación de Error */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Atención</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600 p-1 font-bold text-base"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificación de Éxito */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-medium">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-600 p-1 font-bold text-base"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VISTA 1: CARGA INICIAL DEL PDF */}
      {!doc ? (
        <PdfUploadZone
          onFileSelected={handleLoadPdf}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
        />
      ) : (
        /* VISTA 2: MESA DE TRABAJO COMPLETA (WORKBENCH) */
        <div className="space-y-6">
          {/* BARRA SUPERIOR DE ACCIONES PRINCIPALES Y ZOOM */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-xs">
            {/* Información del documento */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="font-bold text-slate-900 flex items-center gap-2 truncate max-w-xs sm:max-w-md">
                <FileText className="w-4 h-4 text-brand shrink-0" />
                <span className="truncate">{doc.fileName}</span>
              </span>

              <span className="text-slate-300">•</span>

              <span className="text-slate-600">
                Pág. {currentPageIndex + 1} de {doc.numPages}
              </span>

              <span className="text-slate-300">•</span>

              <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-purple-50 text-brand px-2.5 py-0.5 rounded-lg border border-purple-200/60">
                {elements.length} {elements.length === 1 ? "elemento colocado" : "elementos colocados"}
              </span>
            </div>

            {/* Controles de Zoom y Descarga */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Controles de Zoom */}
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                  title="Alejar vista"
                  aria-label="Alejar vista"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="px-2 text-xs font-mono font-semibold text-slate-700 hover:text-brand"
                  title="Restablecer zoom"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                  title="Acercar vista"
                  aria-label="Acercar vista"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Botón Empezar de nuevo */}
              <button
                type="button"
                onClick={handleResetWorkbench}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Cerrar documento y cargar otro"
                aria-label="Cerrar documento y cargar otro"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Botón Descargar PDF Firmado */}
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-40 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Generando PDF firmado..." : "Descargar PDF firmado"}
              </button>
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS: BOTONES PARA AGREGAR FIRMA, INICIALES Y LOGO */}
          <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-slate-900 text-white rounded-3xl shadow-md">
            <span className="text-xs font-bold text-slate-300 px-2 hidden sm:inline">
              Insertar:
            </span>

            {/* Escribir firma */}
            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
            >
              <Type className="w-4 h-4 text-purple-400" />
              <span>Escribir firma</span>
            </button>

            {/* Dibujar firma */}
            <button
              type="button"
              onClick={() => setIsDrawModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
            >
              <PenTool className="w-4 h-4 text-purple-400" />
              <span>Dibujar firma</span>
            </button>

            {/* Firmar con celular QR */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-sm ring-1 ring-white/20 min-h-[44px]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Firmar desde celular (QR)</span>
            </button>

            {/* Subir firma */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
            >
              <UploadCloud className="w-4 h-4 text-slate-300" />
              <span>Subir firma</span>
            </button>

            {/* Iniciales */}
            <button
              type="button"
              onClick={() => setIsInitialsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
            >
              <Layers className="w-4 h-4 text-slate-300" />
              <span>Iniciales</span>
            </button>

            {/* Logo de empresa */}
            <button
              type="button"
              onClick={() => setIsCompanyLogoModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
            >
              <Building2 className="w-4 h-4 text-slate-300" />
              <span>Logo de empresa</span>
            </button>
          </div>

          {/* ÁREA PRINCIPAL: NAVEGADOR DE PÁGINAS A LA IZQUIERDA Y LIENZO EN EL CENTRO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Lateral de Páginas */}
            <div className="lg:col-span-3">
              <PageNavigationRail
                pages={doc.pages}
                currentPageIndex={currentPageIndex}
                elements={elements}
                arrayBuffer={doc.arrayBuffer}
                onSelectPage={(idx) => {
                  setCurrentPageIndex(idx)
                  setSelectedElementId(null)
                }}
              />

              {/* Tarjeta de guía rápida */}
              <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5 text-xs text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-brand" />
                  Privacidad y validez
                </div>
                <p className="leading-relaxed">
                  Tu PDF original se procesa localmente en tu navegador. Al descargar, las firmas se incrustan como gráficos reales en el documento.
                </p>
                <p className="text-[11px] text-slate-400">
                  Tip: Seleccioná cualquier elemento colocado para moverlo, cambiar su tamaño o repetirlo en otras páginas.
                </p>
              </div>
            </div>

            {/* Visor y Editor del PDF en el Centro */}
            <div className="lg:col-span-9 bg-slate-100/60 p-3 sm:p-6 rounded-3xl border border-slate-200/80 min-h-[500px] flex items-center justify-center">
              <PdfCanvasEditor
                arrayBuffer={doc.arrayBuffer}
                currentPageInfo={doc.pages[currentPageIndex]}
                elements={elements}
                selectedElementId={selectedElementId}
                zoomScale={zoomScale}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onOpenMultiPage={(el) => setMultiPageElement(el)}
              />
            </div>
          </div>

          {/* BARRA FLOTANTE INFERIOR PARA MÓVILES */}
          <div className="lg:hidden sticky bottom-4 z-30 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-slate-900">
                Página {currentPageIndex + 1} de {doc.numPages}
              </span>
              <p className="text-[10px] text-slate-500">
                {elements.length} {elements.length === 1 ? "elemento" : "elementos"}
              </p>
            </div>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Generando..." : "Descargar PDF"}
            </button>
          </div>
        </div>
      )}

      {/* MODALES DE CREACIÓN DE ELEMENTOS */}
      <TypeSignatureModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onAddSignature={(dataUrl, title, ar) =>
          handleAddElement("signature", "type", dataUrl, title, ar)
        }
      />

      <DrawSignatureModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        onAddSignature={(dataUrl, title, ar) =>
          handleAddElement("signature", "draw", dataUrl, title, ar)
        }
      />

      <UploadSignatureModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddSignature={(dataUrl, title, ar) =>
          handleAddElement("signature", "upload", dataUrl, title, ar)
        }
      />

      <InitialsModal
        isOpen={isInitialsModalOpen}
        onClose={() => setIsInitialsModalOpen(false)}
        onAddInitials={(dataUrl, title, ar) =>
          handleAddElement("initials", "type", dataUrl, title, ar)
        }
      />

      <CompanyLogoModal
        isOpen={isCompanyLogoModalOpen}
        onClose={() => setIsCompanyLogoModalOpen(false)}
        onAddLogo={(dataUrl, title, ar) =>
          handleAddElement("logo", "upload", dataUrl, title, ar)
        }
      />

      <QrMobileModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSignatureReceived={(sigData, initData) => {
          handleAddElement("signature", "mobile_qr", sigData, "Firma desde celular", 2.8)
          if (initData) {
            handleAddElement("initials", "mobile_qr", initData, "Iniciales desde celular", 1.5)
          }
        }}
      />

      <MultiPageApplyModal
        isOpen={!!multiPageElement}
        onClose={() => setMultiPageElement(null)}
        element={multiPageElement}
        totalPages={doc ? doc.numPages : 1}
        onApplyToPages={handleApplyToPages}
      />
    </div>
  )
}
