"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  Camera,
  RefreshCw,
  Image as ImageIcon,
  RotateCw,
  Sliders,
  Check,
  Trash2,
  Download,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Crop,
  Maximize2,
} from "lucide-react"
import {
  detectDocumentCorners,
  applyPerspectiveWarp,
  applyImageFilters,
  rotateCanvas,
  exportScannedPagesToPdf,
  DocumentCorners,
  Point,
} from "@/lib/pdf-editor/scanner-engine"
import { ScannerExportOptions, DocumentPage } from "@/lib/pdf-editor/types"
import { formatBytes } from "@/lib/pdf-editor/pdf-engine"

interface CameraScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onImportToWorkbench: (scannedPages: DocumentPage[]) => void
}

interface ConfirmedScannedPage {
  id: string
  dataUrl: string
  blob: Blob
  filter: "color" | "grayscale" | "contrast"
  rotation: number
}

type ScannerStep = "capture" | "adjust" | "review"

export function CameraScannerModal({
  isOpen,
  onClose,
  onImportToWorkbench,
}: CameraScannerModalProps) {
  // Navigation & Step state
  const [step, setStep] = useState<ScannerStep>("capture")

  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false)

  // Current capture frame for adjustment
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [corners, setCorners] = useState<DocumentCorners | null>(null)
  const [activeCorner, setActiveCorner] = useState<keyof DocumentCorners | null>(null)
  const [filterMode, setFilterMode] = useState<"color" | "grayscale" | "contrast">("color")
  const [adjustRotation, setAdjustRotation] = useState<number>(0)

  // Confirmed scanned pages
  const [confirmedPages, setConfirmedPages] = useState<ConfirmedScannedPage[]>([])

  // Export options
  const [exportOptions, setExportOptions] = useState<ScannerExportOptions>({
    pageSize: "a4",
    orientation: "auto",
    quality: "medium",
  })
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const adjustCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setIsCameraLoading(true)
    setCameraError(null)

    // Check secure context
    if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
      setCameraError(
        "El acceso a la cámara requiere una conexión segura HTTPS. Podés cargar imágenes de tu dispositivo directamente."
      )
      setIsCameraLoading(false)
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Tu navegador no admite acceso directo a la cámara. Podés seleccionar fotografías desde tu dispositivo."
      )
      setIsCameraLoading(false)
      return
    }

    // Stop previous stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(() => {})
      }

      // Enumerate devices to allow switching
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === "videoinput")
      setCameras(videoDevices)

      // Find current device ID
      const currentTrack = mediaStream.getVideoTracks()[0]
      if (currentTrack) {
        const settings = currentTrack.getSettings()
        if (settings.deviceId) {
          setSelectedCameraId(settings.deviceId)
        }
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Permiso de cámara denegado. Para escanear, habilitá el permiso de cámara en tu navegador o subí fotos existentes."
        )
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No se encontró ninguna cámara disponible en el dispositivo.")
      } else {
        setCameraError("No se pudo iniciar la cámara. Podés subir imágenes desde tu equipo.")
      }
    } finally {
      setIsCameraLoading(false)
    }
  }, [stream])

  // Stop camera when modal closes or leaves capture step
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    if (isOpen && step === "capture") {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, step])

  // Switch camera toggle
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextCamera = cameras[nextIndex]
    if (nextCamera) {
      setSelectedCameraId(nextCamera.deviceId)
      startCamera(nextCamera.deviceId)
    }
  }

  // Capture current video frame
  const handleCaptureFrame = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Stop camera stream while editing
    stopCamera()

    setCapturedCanvas(canvas)
    const detected = detectDocumentCorners(canvas)
    setCorners(detected)
    setFilterMode("color")
    setAdjustRotation(0)
    setStep("adjust")
  }

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      stopCamera()
      setCapturedCanvas(canvas)
      const detected = detectDocumentCorners(canvas)
      setCorners(detected)
      setFilterMode("color")
      setAdjustRotation(0)
      setStep("adjust")
    }

    img.src = url
  }

  // Draw Interactive Crop Canvas with Corners
  const redrawAdjustCanvas = useCallback(() => {
    if (!adjustCanvasRef.current || !capturedCanvas || !corners) return
    const canvas = adjustCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas display dimensions
    const parent = canvas.parentElement
    if (!parent) return
    const maxW = parent.clientWidth
    const maxH = Math.min(window.innerHeight * 0.55, 480)

    const scale = Math.min(maxW / capturedCanvas.width, maxH / capturedCanvas.height, 1)
    canvas.width = Math.round(capturedCanvas.width * scale)
    canvas.height = Math.round(capturedCanvas.height * scale)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(capturedCanvas, 0, 0, canvas.width, canvas.height)

    // Scale corner coordinates to display size
    const toDisp = (p: Point): Point => ({
      x: p.x * scale,
      y: p.y * scale,
    })

    const dTL = toDisp(corners.tl)
    const dTR = toDisp(corners.tr)
    const dBR = toDisp(corners.br)
    const dBL = toDisp(corners.bl)

    // Draw shaded polygon mask outside selection
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Cut out the selected quad
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(dTL.x, dTL.y)
    ctx.lineTo(dTR.x, dTR.y)
    ctx.lineTo(dBR.x, dBR.y)
    ctx.lineTo(dBL.x, dBL.y)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(capturedCanvas, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Draw quadrilateral boundary lines
    ctx.beginPath()
    ctx.moveTo(dTL.x, dTL.y)
    ctx.lineTo(dTR.x, dTR.y)
    ctx.lineTo(dBR.x, dBR.y)
    ctx.lineTo(dBL.x, dBL.y)
    ctx.closePath()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = "#7C3AED" // Violet
    ctx.stroke()

    // Draw handles on 4 corners
    const drawHandle = (p: Point, name: string) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = "#7C3AED"
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = "#ffffff"
      ctx.stroke()

      // Inner dot
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
    }

    drawHandle(dTL, "tl")
    drawHandle(dTR, "tr")
    drawHandle(dBR, "br")
    drawHandle(dBL, "bl")
  }, [capturedCanvas, corners])

  useEffect(() => {
    if (step === "adjust") {
      redrawAdjustCanvas()
    }
  }, [step, redrawAdjustCanvas, corners])

  // Mouse & Touch handle dragging
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!adjustCanvasRef.current || !capturedCanvas) return null
    const canvas = adjustCanvasRef.current
    const rect = canvas.getBoundingClientRect()

    let clientX = 0
    let clientY = 0

    if ("touches" in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const dispX = clientX - rect.left
    const dispY = clientY - rect.top

    const scale = canvas.width / capturedCanvas.width
    return {
      x: Math.max(0, Math.min(capturedCanvas.width, dispX / scale)),
      y: Math.max(0, Math.min(capturedCanvas.height, dispY / scale)),
    }
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!corners || !adjustCanvasRef.current || !capturedCanvas) return
    const pos = getCanvasCoords(e)
    if (!pos) return

    const canvas = adjustCanvasRef.current
    const scale = canvas.width / capturedCanvas.width
    const threshold = 35 / scale // Touch radius in original image units

    const dist = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y)

    const dTL = dist(pos, corners.tl)
    const dTR = dist(pos, corners.tr)
    const dBR = dist(pos, corners.br)
    const dBL = dist(pos, corners.bl)

    const minDist = Math.min(dTL, dTR, dBR, dBL)
    if (minDist <= threshold) {
      if (minDist === dTL) setActiveCorner("tl")
      else if (minDist === dTR) setActiveCorner("tr")
      else if (minDist === dBR) setActiveCorner("br")
      else if (minDist === dBL) setActiveCorner("bl")
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeCorner || !corners) return
    const pos = getCanvasCoords(e)
    if (!pos) return

    setCorners({
      ...corners,
      [activeCorner]: pos,
    })
  }

  const handlePointerUp = () => {
    setActiveCorner(null)
  }

  // Reset corners to auto detection
  const handleAutoDetect = () => {
    if (!capturedCanvas) return
    const detected = detectDocumentCorners(capturedCanvas)
    setCorners(detected)
  }

  // Reset corners to full image
  const handleResetCorners = () => {
    if (!capturedCanvas) return
    setCorners({
      tl: { x: 0, y: 0 },
      tr: { x: capturedCanvas.width, y: 0 },
      br: { x: capturedCanvas.width, y: capturedCanvas.height },
      bl: { x: 0, y: capturedCanvas.height },
    })
  }

  // Confirm and process current page
  const handleConfirmCurrentPage = async () => {
    if (!capturedCanvas || !corners) return

    // 1. Perspective warp
    let warpedCanvas = applyPerspectiveWarp(capturedCanvas, corners)

    // 2. Rotate if needed
    if (adjustRotation !== 0) {
      warpedCanvas = rotateCanvas(warpedCanvas, adjustRotation)
    }

    // 3. Filters
    applyImageFilters(warpedCanvas, filterMode)

    // 4. Save blob and data url
    const dataUrl = warpedCanvas.toDataURL("image/jpeg", 0.85)

    const blob = await new Promise<Blob>((resolve) => {
      warpedCanvas.toBlob(
        (b) => resolve(b || new Blob()),
        "image/jpeg",
        0.85
      )
    })

    const newPage: ConfirmedScannedPage = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUrl,
      blob,
      filter: filterMode,
      rotation: adjustRotation,
    }

    setConfirmedPages([...confirmedPages, newPage])
    setCapturedCanvas(null)
    setCorners(null)
    setStep("review")
  }

  // Remove a scanned page
  const handleRemoveScannedPage = (id: string) => {
    setConfirmedPages(confirmedPages.filter((p) => p.id !== id))
  }

  // Move page in review list
  const handleMoveScannedPage = (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1
    if (target < 0 || target >= confirmedPages.length) return
    const updated = [...confirmedPages]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    setConfirmedPages(updated)
  }

  // Export directly as PDF
  const handleExportPdf = async () => {
    if (confirmedPages.length === 0) return
    try {
      setIsExporting(true)
      const dataUrls = confirmedPages.map((p) => p.dataUrl)
      const pdfBlob = await exportScannedPagesToPdf(dataUrls, exportOptions)

      const fileName = `escaneo_playcomun_${new Date().toISOString().slice(0, 10)}.pdf`
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccessMessage(
        `¡PDF descargado con éxito! (${confirmedPages.length} páginas, ${formatBytes(pdfBlob.size)})`
      )
    } catch (err: any) {
      alert("Error al exportar PDF: " + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  // Import scanned pages to the main workbench
  const handleSendToWorkbench = () => {
    if (confirmedPages.length === 0) return

    const newDocPages: DocumentPage[] = confirmedPages.map((cp, idx) => ({
      id: `scanned_page_${Date.now()}_${idx}`,
      sourceFileId: "camera_scanner",
      sourceFileName: "Documento Escaneado",
      sourceFileColorIndex: 2,
      originalPageIndex: idx,
      displayPageNumber: idx + 1,
      customRotation: 0,
      initialRotation: 0,
      width: 595,
      height: 842,
      thumbnailUrl: cp.dataUrl,
      isScanned: true,
      scannedImageBlob: cp.blob,
    }))

    onImportToWorkbench(newDocPages)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl rounded-2xl bg-gray-900 border border-gray-800 text-white overflow-hidden flex flex-col max-h-[95vh] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 bg-gray-900/90">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Escanear documentos a PDF
                </h3>
                <p className="text-xs text-gray-400">
                  {step === "capture" && "Alineá tu documento frente a la cámara"}
                  {step === "adjust" && "Ajustá los bordes y el filtro de lectura"}
                  {step === "review" && `${confirmedPages.length} páginas escaneadas`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {confirmedPages.length > 0 && step !== "review" && (
                <button
                  type="button"
                  onClick={() => setStep("review")}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-colors"
                >
                  Ver lote ({confirmedPages.length})
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar escáner"
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center bg-gray-950/70 min-h-[350px]">
            {/* ETAPA 1: CAPTURA DE CÁMARA */}
            {step === "capture" && (
              <div className="w-full flex flex-col items-center space-y-4">
                {cameraError ? (
                  <div className="w-full max-w-md p-6 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-4 shadow-xl">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">Acceso a cámara</h4>
                      <p className="text-xs text-gray-400">{cameraError}</p>
                    </div>

                    <div className="pt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs transition-colors shadow-md shadow-violet-600/20"
                      >
                        Subir foto desde el dispositivo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full max-w-lg aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl border border-gray-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Marco guía de documento */}
                    <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-dashed border-violet-400/70 rounded-2xl flex items-center justify-center">
                      <span className="text-[11px] font-medium text-white/70 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                        Encuadre del documento
                      </span>
                    </div>

                    {isCameraLoading && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-xs text-gray-300 gap-2">
                        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                        <span>Iniciando sensor de cámara...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Controles de Captura */}
                {!cameraError && (
                  <div className="w-full max-w-md flex items-center justify-between px-4 pt-2">
                    {/* Botón alternativa subir foto */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
                      title="Subir imagen de la galería"
                    >
                      <div className="p-2.5 rounded-full bg-gray-800 hover:bg-gray-700">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <span>Galería</span>
                    </button>

                    {/* Botón Obturador Central */}
                    <button
                      type="button"
                      onClick={handleCaptureFrame}
                      aria-label="Capturar fotografía de página"
                      className="h-18 w-18 rounded-full border-4 border-white/80 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                    >
                      <div className="h-7 w-7 rounded-full bg-white shadow-xs" />
                    </button>

                    {/* Botón Cambiar cámara */}
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      disabled={cameras.length <= 1}
                      className="flex flex-col items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                      title="Cambiar de cámara"
                    >
                      <div className="p-2.5 rounded-full bg-gray-800 hover:bg-gray-700">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                      <span>Cambiar</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 2: AJUSTE DE ESQUINAS Y FILTROS */}
            {step === "adjust" && (
              <div className="w-full max-w-2xl flex flex-col items-center space-y-4">
                <div className="relative border border-gray-800 rounded-2xl overflow-hidden bg-black flex items-center justify-center select-none touch-none shadow-2xl">
                  <canvas
                    ref={adjustCanvasRef}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    className="cursor-crosshair max-h-[50vh] max-w-full"
                  />
                </div>

                {/* Barra de Herramientas de Corrección */}
                <div className="w-full space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoDetect}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Crop className="h-3.5 w-3.5 text-violet-400" /> Auto-ajustar bordes
                      </button>
                      <button
                        type="button"
                        onClick={handleResetCorners}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      >
                        Página completa
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAdjustRotation((prev) => (prev + 90) % 360)}
                      className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors inline-flex items-center gap-1"
                    >
                      <RotateCw className="h-3.5 w-3.5" /> Girar 90°
                    </button>
                  </div>

                  {/* Selector de filtros de lectura */}
                  <div className="p-3 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-400 font-medium shrink-0">Filtro de lectura:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterMode("color")}
                        className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                          filterMode === "color"
                            ? "bg-violet-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Color original
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode("grayscale")}
                        className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                          filterMode === "grayscale"
                            ? "bg-violet-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Escala de grises
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode("contrast")}
                        className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                          filterMode === "contrast"
                            ? "bg-violet-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Alto contraste
                      </button>
                    </div>
                  </div>
                </div>

                {/* Acciones de confirmación de página */}
                <div className="w-full flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedCanvas(null)
                      setCorners(null)
                      setStep("capture")
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-700 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Repetir toma
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmCurrentPage}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition-colors"
                  >
                    <Check className="h-4 w-4" /> Guardar página
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: REVISIÓN DE PÁGINAS ESCANEADAS Y EXPORTACIÓN */}
            {step === "review" && (
              <div className="w-full max-w-3xl space-y-6">
                {exportSuccessMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}

                {/* Strip de páginas escaneadas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300">
                      Páginas capturadas ({confirmedPages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep("capture")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" /> Escanear otra página
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {confirmedPages.map((page, idx) => (
                      <div
                        key={page.id}
                        className="relative rounded-2xl border border-gray-800 bg-gray-900 p-2.5 flex flex-col justify-between group"
                      >
                        <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-black flex items-center justify-center mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={page.dataUrl}
                            alt={`Página escaneada ${idx + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            {idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-gray-400">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveScannedPage(idx, "left")}
                              className="p-1 hover:text-white disabled:opacity-20"
                              title="Mover antes"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === confirmedPages.length - 1}
                              onClick={() => handleMoveScannedPage(idx, "right")}
                              className="p-1 hover:text-white disabled:opacity-20"
                              title="Mover después"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveScannedPage(page.id)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Eliminar página"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opciones de Salida PDF */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-400 font-medium mb-1.5">
                      Tamaño de papel
                    </label>
                    <select
                      value={exportOptions.pageSize}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, pageSize: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
                    >
                      <option value="a4">Estándar A4 (Recomendado)</option>
                      <option value="fit">Ajustar a foto original</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-medium mb-1.5">
                      Orientación
                    </label>
                    <select
                      value={exportOptions.orientation}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, orientation: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
                    >
                      <option value="auto">Automática por página</option>
                      <option value="portrait">Vertical fija</option>
                      <option value="landscape">Horizontal fija</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-medium mb-1.5">
                      Calidad de compresión
                    </label>
                    <select
                      value={exportOptions.quality}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, quality: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
                    >
                      <option value="medium">Equilibrada (PDF liviano y nítido)</option>
                      <option value="high">Máxima resolución</option>
                      <option value="low">Compacta (Ideal para correo)</option>
                    </select>
                  </div>
                </div>

                {/* Acciones Finales de Exportación */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendToWorkbench}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-colors"
                  >
                    <Layers className="h-4 w-4" /> Llevar a la mesa de trabajo
                  </button>

                  <button
                    type="button"
                    disabled={isExporting || confirmedPages.length === 0}
                    onClick={handleExportPdf}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition-colors disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? "Generando PDF..." : "Descargar PDF Escaneado"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
