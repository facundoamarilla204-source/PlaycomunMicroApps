"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { QRCodeSVG } from "qrcode.react"
import {
  X,
  Camera,
  RefreshCw,
  Image as ImageIcon,
  RotateCw,
  Check,
  Trash2,
  Download,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Crop,
  Smartphone,
  Copy,
  ExternalLink,
  FileText,
  Sparkles,
  Edit3,
  Plus,
  Zap,
  ZapOff,
} from "lucide-react"
import {
  detectDocumentCorners,
  applyPerspectiveWarp,
  applyImageFilters,
  rotateCanvas,
  DocumentCorners,
  Point,
} from "@/lib/pdf-editor/scanner-engine"
import { DocumentPage } from "@/lib/pdf-editor/types"
import { formatBytes } from "@/lib/pdf-editor/pdf-engine"
import {
  performOcrOnImage,
  reconstructDigitalPdf,
  RecognizedPageContent,
  RecognizedBlock,
  RecognizedBlockType,
} from "@/lib/pdf-editor/ocr-reconstruction"

interface CameraScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onImportToWorkbench: (scannedPages: DocumentPage[]) => void
}

export interface ConfirmedScannedPage {
  id: string
  dataUrl: string
  blob: Blob
  filter: "color" | "grayscale" | "contrast"
  rotation: number
  recognizedContent?: RecognizedPageContent
}

type ScannerStep = "capture" | "qr_connect" | "adjust" | "review" | "ocr_processing" | "ocr_editor"

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
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false)
  const [hasTorch, setHasTorch] = useState<boolean>(false)

  // QR Mobile Pairing State
  const [qrSessionToken, setQrSessionToken] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrStatus, setQrStatus] = useState<"loading" | "pending" | "connected" | "receiving" | "expired" | "error">(
    "loading"
  )
  const [copiedQrLink, setCopiedQrLink] = useState<boolean>(false)
  const [qrErrorMessage, setQrErrorMessage] = useState<string | null>(null)
  const qrPollingRef = useRef<NodeJS.Timeout | null>(null)

  // Current capture frame for adjustment
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [corners, setCorners] = useState<DocumentCorners | null>(null)
  const [activeCorner, setActiveCorner] = useState<keyof DocumentCorners | null>(null)
  const [filterMode, setFilterMode] = useState<"color" | "grayscale" | "contrast">("contrast")
  const [adjustRotation, setAdjustRotation] = useState<number>(0)

  // Confirmed scanned pages
  const [confirmedPages, setConfirmedPages] = useState<ConfirmedScannedPage[]>([])

  // OCR Processing & Editor State
  const [ocrProgressPercent, setOcrProgressPercent] = useState<number>(0)
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string>("")
  const [activeEditorPageIndex, setActiveEditorPageIndex] = useState<number>(0)
  const [ocrLanguage, setOcrLanguage] = useState<string>("spa")
  const [documentTitle, setDocumentTitle] = useState<string>("Documento Reconstruido")
  const [fontFamily, setFontFamily] = useState<"helvetica" | "times" | "courier">("helvetica")
  const [baseFontSize, setBaseFontSize] = useState<number>(11)
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false)
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const adjustCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Initialize camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setIsCameraLoading(true)
    setCameraError(null)

    if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
      setCameraError(
        "El acceso a la cámara requiere una conexión segura HTTPS. Podés cargar imágenes desde tu dispositivo o conectar el celular por QR."
      )
      setIsCameraLoading(false)
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Tu navegador no admite acceso directo a la cámara. Podés subir imágenes o escanear mediante código QR."
      )
      setIsCameraLoading(false)
      return
    }

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

      // Check torch capability
      const track = mediaStream.getVideoTracks()[0]
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) || {}
        setHasTorch(Boolean((capabilities as any).torch))
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === "videoinput")
      setCameras(videoDevices)

      if (track) {
        const settings = track.getSettings()
        if (settings.deviceId) {
          setSelectedCameraId(settings.deviceId)
        }
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Permiso de cámara denegado. Habilitá el permiso en tu navegador o conectá tu celular escaneando el código QR."
        )
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No se encontró ninguna cámara activa en esta computadora. Usá la conexión por QR con tu celular.")
      } else {
        setCameraError("No se pudo iniciar la cámara en este dispositivo. Podés conectar tu celular escaneando el código QR.")
      }
    } finally {
      setIsCameraLoading(false)
    }
  }, [stream])

  // Stop camera when closing or switching away
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsTorchOn(false)
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

  // Camera switch toggle
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

  // Torch toggle
  const handleToggleTorch = async () => {
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    if (!track) return

    try {
      const nextTorch = !isTorchOn
      await (track.applyConstraints as any)({
        advanced: [{ torch: nextTorch }],
      })
      setIsTorchOn(nextTorch)
    } catch {}
  }

  // QR Session Management
  const startQrSession = async () => {
    stopCamera()
    setStep("qr_connect")
    setQrStatus("loading")
    setQrErrorMessage(null)

    try {
      const res = await fetch("/api/scan-session/create", { method: "POST" })
      if (!res.ok) throw new Error("No se pudo iniciar la sesión para el celular.")
      const data = await res.json()
      setQrSessionToken(data.sessionToken)
      setQrUrl(data.qrUrl)
      setQrStatus("pending")
    } catch (err: any) {
      setQrStatus("error")
      setQrErrorMessage(err?.message || "Error al generar el código QR de conexión.")
    }
  }

  // Poll QR Session status while on qr_connect step
  useEffect(() => {
    if (step !== "qr_connect" || !qrSessionToken) {
      if (qrPollingRef.current) {
        clearInterval(qrPollingRef.current)
        qrPollingRef.current = null
      }
      return
    }

    const checkQrStatus = async () => {
      try {
        const res = await fetch(`/api/scan-session/status?token=${qrSessionToken}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.status === "expired") {
          setQrStatus("expired")
          return
        }

        if (data.status === "connected") {
          setQrStatus("connected")
        } else if (data.status === "receiving") {
          setQrStatus("receiving")
        }

        if (data.pages && data.pages.length > 0) {
          // Merge incoming pages into confirmedPages without duplication
          setConfirmedPages((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const newEntries: ConfirmedScannedPage[] = []

            for (const ep of data.pages) {
              if (!existingIds.has(ep.id)) {
                newEntries.push({
                  id: ep.id,
                  dataUrl: ep.dataUrl,
                  blob: new Blob(),
                  filter: "contrast",
                  rotation: 0,
                })
              }
            }

            if (newEntries.length > 0) {
              return [...prev, ...newEntries]
            }
            return prev
          })
        }
      } catch {}
    }

    qrPollingRef.current = setInterval(checkQrStatus, 1500)
    return () => {
      if (qrPollingRef.current) {
        clearInterval(qrPollingRef.current)
        qrPollingRef.current = null
      }
    }
  }, [step, qrSessionToken])

  // Capture frame
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
    stopCamera()

    setCapturedCanvas(canvas)
    const detected = detectDocumentCorners(canvas)
    setCorners(detected)
    setFilterMode("contrast")
    setAdjustRotation(0)
    setStep("adjust")
  }

  // File upload fallback
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
      setFilterMode("contrast")
      setAdjustRotation(0)
      setStep("adjust")
    }

    img.src = url
  }

  // Interactive Adjust Canvas Redraw
  const redrawAdjustCanvas = useCallback(() => {
    if (!adjustCanvasRef.current || !capturedCanvas || !corners) return
    const canvas = adjustCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return
    const maxW = parent.clientWidth
    const maxH = Math.min(window.innerHeight * 0.52, 440)

    const scale = Math.min(maxW / capturedCanvas.width, maxH / capturedCanvas.height, 1)
    canvas.width = Math.round(capturedCanvas.width * scale)
    canvas.height = Math.round(capturedCanvas.height * scale)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(capturedCanvas, 0, 0, canvas.width, canvas.height)

    const toDisp = (p: Point): Point => ({
      x: p.x * scale,
      y: p.y * scale,
    })

    const dTL = toDisp(corners.tl)
    const dTR = toDisp(corners.tr)
    const dBR = toDisp(corners.br)
    const dBL = toDisp(corners.bl)

    // Shaded mask outside selection
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Cutout
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

    // Line
    ctx.beginPath()
    ctx.moveTo(dTL.x, dTL.y)
    ctx.lineTo(dTR.x, dTR.y)
    ctx.lineTo(dBR.x, dBR.y)
    ctx.lineTo(dBL.x, dBL.y)
    ctx.closePath()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = "#8B5CF6"
    ctx.stroke()

    // 4 Corner handles
    const drawHandle = (p: Point) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2)
      ctx.fillStyle = "#8B5CF6"
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = "#ffffff"
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
    }

    drawHandle(dTL)
    drawHandle(dTR)
    drawHandle(dBR)
    drawHandle(dBL)
  }, [capturedCanvas, corners])

  useEffect(() => {
    if (step === "adjust") {
      redrawAdjustCanvas()
    }
  }, [step, redrawAdjustCanvas, corners])

  // Mouse & Touch dragging
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
    const threshold = 40 / scale

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

  // Confirm page adjustment
  const handleConfirmCurrentPage = async () => {
    if (!capturedCanvas || !corners) return

    let warped = applyPerspectiveWarp(capturedCanvas, corners)
    if (adjustRotation !== 0) {
      warped = rotateCanvas(warped, adjustRotation)
    }
    applyImageFilters(warped, filterMode)

    const dataUrl = warped.toDataURL("image/jpeg", 0.88)
    const blob = await new Promise<Blob>((resolve) => {
      warped.toBlob((b) => resolve(b || new Blob()), "image/jpeg", 0.88)
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

  // Remove page
  const handleRemoveScannedPage = (id: string) => {
    setConfirmedPages(confirmedPages.filter((p) => p.id !== id))
  }

  // Run OCR on all confirmed pages
  const handleStartOcrProcessing = async () => {
    if (confirmedPages.length === 0) return

    setStep("ocr_processing")
    setOcrProgressPercent(5)
    setOcrStatusMessage("Preparando imágenes y cargando motor OCR...")

    const updatedPages: ConfirmedScannedPage[] = []

    for (let i = 0; i < confirmedPages.length; i++) {
      const page = confirmedPages[i]
      const pageNum = i + 1

      setOcrStatusMessage(`Procesando página ${pageNum} de ${confirmedPages.length}...`)

      try {
        const recognized = await performOcrOnImage(page.dataUrl, {
          language: ocrLanguage,
          onProgress: (pct, msg) => {
            const overallPct = Math.round(((i + pct / 100) / confirmedPages.length) * 100)
            setOcrProgressPercent(overallPct)
            setOcrStatusMessage(`Página ${pageNum}/${confirmedPages.length}: ${msg}`)
          },
        })
        recognized.pageIndex = i
        updatedPages.push({ ...page, recognizedContent: recognized })
      } catch (err: any) {
        // Fallback: minimal block if OCR error
        updatedPages.push({
          ...page,
          recognizedContent: {
            pageIndex: i,
            fullText: "",
            blocks: [
              {
                id: `block_empty_${Date.now()}`,
                type: "paragraph",
                text: "No se pudo reconocer texto automático en esta hoja. Podés escribir o corregir el contenido aquí.",
                confidence: 0,
              },
            ],
            confidence: 0,
            hasText: false,
          },
        })
      }
    }

    setConfirmedPages(updatedPages)
    setActiveEditorPageIndex(0)
    setStep("ocr_editor")
  }

  // Update text of a block in active editor page
  const handleUpdateBlockText = (blockIndex: number, newText: string) => {
    const current = confirmedPages[activeEditorPageIndex]
    if (!current || !current.recognizedContent) return

    const newBlocks = [...current.recognizedContent.blocks]
    newBlocks[blockIndex] = {
      ...newBlocks[blockIndex],
      text: newText,
    }

    const newFullText = newBlocks.map((b) => b.text).join("\n\n")

    const updatedPage: ConfirmedScannedPage = {
      ...current,
      recognizedContent: {
        ...current.recognizedContent,
        blocks: newBlocks,
        fullText: newFullText,
        hasText: newFullText.trim().length > 0,
      },
    }

    const updatedAll = [...confirmedPages]
    updatedAll[activeEditorPageIndex] = updatedPage
    setConfirmedPages(updatedAll)
  }

  // Change block type in active editor page
  const handleChangeBlockType = (blockIndex: number, newType: RecognizedBlockType) => {
    const current = confirmedPages[activeEditorPageIndex]
    if (!current || !current.recognizedContent) return

    const newBlocks = [...current.recognizedContent.blocks]
    newBlocks[blockIndex] = {
      ...newBlocks[blockIndex],
      type: newType,
    }

    const updatedPage: ConfirmedScannedPage = {
      ...current,
      recognizedContent: {
        ...current.recognizedContent,
        blocks: newBlocks,
      },
    }

    const updatedAll = [...confirmedPages]
    updatedAll[activeEditorPageIndex] = updatedPage
    setConfirmedPages(updatedAll)
  }

  // Add block to active editor page
  const handleAddBlock = () => {
    const current = confirmedPages[activeEditorPageIndex]
    if (!current || !current.recognizedContent) return

    const newBlocks: RecognizedBlock[] = [
      ...current.recognizedContent.blocks,
      {
        id: `block_new_${Date.now()}`,
        type: "paragraph",
        text: "Nuevo párrafo...",
        confidence: 100,
      },
    ]

    const updatedPage: ConfirmedScannedPage = {
      ...current,
      recognizedContent: {
        ...current.recognizedContent,
        blocks: newBlocks,
      },
    }

    const updatedAll = [...confirmedPages]
    updatedAll[activeEditorPageIndex] = updatedPage
    setConfirmedPages(updatedAll)
  }

  // Remove block
  const handleRemoveBlock = (blockIndex: number) => {
    const current = confirmedPages[activeEditorPageIndex]
    if (!current || !current.recognizedContent) return

    const newBlocks = current.recognizedContent.blocks.filter((_, idx) => idx !== blockIndex)
    const newFullText = newBlocks.map((b) => b.text).join("\n\n")

    const updatedPage: ConfirmedScannedPage = {
      ...current,
      recognizedContent: {
        ...current.recognizedContent,
        blocks: newBlocks,
        fullText: newFullText,
        hasText: newFullText.trim().length > 0,
      },
    }

    const updatedAll = [...confirmedPages]
    updatedAll[activeEditorPageIndex] = updatedPage
    setConfirmedPages(updatedAll)
  }

  // Download 100% Reconstructed Digital PDF (Zero embedded photos!)
  const handleExportReconstructedPdf = async () => {
    if (confirmedPages.length === 0) return

    // Ensure all pages have recognizedContent
    const validPages = confirmedPages
      .map((p) => p.recognizedContent)
      .filter((rc): rc is RecognizedPageContent => Boolean(rc))

    if (validPages.length === 0) {
      alert("Por favor iniciá el reconocimiento OCR antes de generar el PDF digital.")
      return
    }

    setIsExportingPdf(true)
    setExportSuccessMessage(null)

    try {
      const pdfBlob = await reconstructDigitalPdf(validPages, {
        documentTitle,
        fontFamily,
        fontSize: baseFontSize,
      })

      const safeTitle = (documentTitle || "documento_escaneado")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
      const fileName = `${safeTitle}_ocr_playcomun.pdf`

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccessMessage(
        `¡PDF reconstruido con éxito! (${validPages.length} páginas de texto digital, ${formatBytes(pdfBlob.size)}). No contiene imágenes incrustadas.`
      )
    } catch (err: any) {
      alert("Error al generar el PDF digital: " + err.message)
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Send to workbench
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
    handleCloseModal()
  }

  // Clean close modal
  const handleCloseModal = () => {
    stopCamera()
    if (qrSessionToken) {
      fetch("/api/scan-session/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: qrSessionToken }),
      }).catch(() => {})
    }
    onClose()
  }

  if (!isOpen) return null

  const activePage = confirmedPages[activeEditorPageIndex]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-4xl rounded-2xl bg-gray-900 border border-gray-800 text-white overflow-hidden flex flex-col max-h-[95vh] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 bg-gray-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Escanear y Reconstruir Documentos
                </h3>
                <p className="text-xs text-gray-400">
                  {step === "capture" && "Alineá la hoja A4 o conectá el celular mediante QR"}
                  {step === "qr_connect" && "Escaneá el código QR con la cámara de tu celular"}
                  {step === "adjust" && "Ajustá los bordes y el contraste de lectura"}
                  {step === "review" && `${confirmedPages.length} páginas capturadas para procesar`}
                  {step === "ocr_processing" && "Reconociendo contenido y jerarquías..."}
                  {step === "ocr_editor" && "Revisá y editá el documento digital antes de exportar"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {confirmedPages.length > 0 && step !== "review" && step !== "ocr_editor" && (
                <button
                  type="button"
                  onClick={() => setStep("review")}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-colors"
                >
                  Páginas ({confirmedPages.length})
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Cerrar escáner"
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center bg-gray-950/70 min-h-[360px]">
            {/* ETAPA 1: CAPTURA DE CÁMARA (9:16 VERTICAL + A4 1:1.414 RECTANGLE) */}
            {step === "capture" && (
              <div className="w-full flex flex-col items-center space-y-4">
                {cameraError ? (
                  <div className="w-full max-w-md p-6 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-4 shadow-xl">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                      <Smartphone className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">Escanear con el celular</h4>
                      <p className="text-xs text-gray-400">{cameraError}</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={startQrSession}
                        className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors shadow-md shadow-violet-600/30 flex items-center justify-center gap-2"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Conectar celular vía código QR</span>
                      </button>

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
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 font-medium text-xs transition-colors"
                      >
                        Subir foto desde esta computadora
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* CAMERA PREVIEW: 9:16 VERTICAL RATIO WITH A4 1:1.414 GUIDE */}
                    <div className="relative w-full max-w-sm aspect-9/16 max-h-[60vh] rounded-3xl overflow-hidden bg-black flex items-center justify-center shadow-2xl border border-gray-800">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* GUÍA DE ENCUADRE A4 REAL (Proporción 1 : 1.414) */}
                      <div
                        className="pointer-events-none absolute border-2 border-violet-400/80 rounded-2xl flex items-center justify-center shadow-xs"
                        style={{
                          width: "82%",
                          aspectRatio: "1 / 1.414",
                        }}
                      >
                        {/* L-Brackets en 4 esquinas */}
                        <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-3 border-l-3 border-white rounded-tl-xs" />
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-3 border-r-3 border-white rounded-tr-xs" />
                        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-3 border-l-3 border-white rounded-bl-xs" />
                        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-3 border-r-3 border-white rounded-br-xs" />

                        <span className="text-[10px] font-semibold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                          Hoja A4 (1:1.414)
                        </span>
                      </div>

                      {isCameraLoading && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-xs text-gray-300 gap-2">
                          <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                          <span>Iniciando sensor de cámara...</span>
                        </div>
                      )}
                    </div>

                    {/* CONTROLES DE CAPTURA Y CONEXIÓN QR */}
                    <div className="w-full max-w-sm flex items-center justify-between px-2 pt-2">
                      {/* Conectar Celular vía QR */}
                      <button
                        type="button"
                        onClick={startQrSession}
                        className="flex flex-col items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
                        title="Escanear con tu celular mediante código QR"
                      >
                        <div className="p-3 rounded-full bg-gray-900 border border-gray-800 hover:border-violet-500 text-violet-400">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <span>Usar celular</span>
                      </button>

                      {/* Obturador Central */}
                      <button
                        type="button"
                        onClick={handleCaptureFrame}
                        aria-label="Capturar fotografía de página"
                        className="h-18 w-18 rounded-full border-4 border-white/80 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all shadow-xl flex items-center justify-center"
                      >
                        <div className="h-7 w-7 rounded-full bg-white shadow-xs" />
                      </button>

                      {/* Alternativa linterna o subir foto */}
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
                        title="Subir foto desde el equipo"
                      >
                        <div className="p-3 rounded-full bg-gray-900 border border-gray-800">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <span>Subir foto</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ETAPA: CONEXIÓN CELULAR MEDIANTE QR */}
            {step === "qr_connect" && (
              <div className="w-full max-w-md p-6 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-6 shadow-2xl">
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Conectar celular con código QR
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Escaneá este código con la cámara de tu teléfono para capturar las hojas directamente. Las fotos aparecerán aquí al instante.
                  </p>
                </div>

                {qrStatus === "loading" && (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Creando sesión segura de escaneo...</p>
                  </div>
                )}

                {qrStatus === "error" && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                    <p>{qrErrorMessage || "No se pudo generar el código QR."}</p>
                    <button
                      type="button"
                      onClick={startQrSession}
                      className="px-4 py-2 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {qrUrl && qrStatus !== "loading" && qrStatus !== "error" && (
                  <div className="space-y-4">
                    <div className="mx-auto w-52 h-52 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                      <QRCodeSVG value={qrUrl} size={180} level="M" />
                    </div>

                    {/* Estado de sincronización */}
                    <div className="p-3 rounded-2xl bg-gray-950/70 border border-gray-800/80 text-xs">
                      {qrStatus === "pending" && (
                        <p className="text-gray-400 flex items-center justify-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                          Esperando que escanees el código...
                        </p>
                      )}
                      {qrStatus === "connected" && (
                        <p className="text-emerald-400 font-semibold flex items-center justify-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          ¡Celular conectado! Listo para tomar fotos.
                        </p>
                      )}
                      {qrStatus === "receiving" && (
                        <p className="text-violet-400 font-semibold flex items-center justify-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                          Recibiendo páginas desde el teléfono ({confirmedPages.length} recibidas)...
                        </p>
                      )}
                      {qrStatus === "expired" && (
                        <p className="text-rose-400 font-semibold">
                          El código QR ha expirado. Hacé clic para generar uno nuevo.
                        </p>
                      )}
                    </div>

                    {/* Copiar enlace directo */}
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (qrUrl) {
                            navigator.clipboard.writeText(qrUrl)
                            setCopiedQrLink(true)
                            setTimeout(() => setCopiedQrLink(false), 2000)
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedQrLink ? "¡Enlace copiado!" : "Copiar enlace móvil"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("capture")
                      startCamera()
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-xs font-medium text-gray-300 transition-colors"
                  >
                    Usar webcam de la PC
                  </button>

                  {confirmedPages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep("review")}
                      className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Revisar ({confirmedPages.length})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ETAPA 2: AJUSTE DE BORDES Y FILTRO DE LECTURA */}
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
                    className="cursor-crosshair max-h-[48vh] max-w-full"
                  />
                </div>

                <div className="w-full space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (capturedCanvas) {
                            setCorners(detectDocumentCorners(capturedCanvas))
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Crop className="h-3.5 w-3.5 text-violet-400" /> Auto-ajustar bordes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (capturedCanvas) {
                            setCorners({
                              tl: { x: 0, y: 0 },
                              tr: { x: capturedCanvas.width, y: 0 },
                              br: { x: capturedCanvas.width, y: capturedCanvas.height },
                              bl: { x: 0, y: capturedCanvas.height },
                            })
                          }
                        }}
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

                  {/* Filtro de lectura */}
                  <div className="p-3 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-400 font-medium shrink-0">Filtro de lectura:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterMode("contrast")}
                        className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                          filterMode === "contrast"
                            ? "bg-violet-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Alto contraste (Ideal OCR)
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
                        onClick={() => setFilterMode("color")}
                        className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                          filterMode === "color"
                            ? "bg-violet-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Color original
                      </button>
                    </div>
                  </div>
                </div>

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

            {/* ETAPA 3: REVISIÓN DE PÁGINAS Y LANZAMIENTO DEL OCR */}
            {step === "review" && (
              <div className="w-full max-w-3xl space-y-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">
                    Páginas capturadas ({confirmedPages.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("capture")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" /> Cámara PC
                    </button>
                    <button
                      type="button"
                      onClick={startQrSession}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-violet-400 font-medium transition-colors"
                    >
                      <Smartphone className="h-3.5 w-3.5" /> Más con celular
                    </button>
                  </div>
                </div>

                {confirmedPages.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-xs text-gray-400">No hay páginas capturadas todavía.</p>
                    <button
                      type="button"
                      onClick={() => setStep("capture")}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                    >
                      Abrir cámara
                    </button>
                  </div>
                ) : (
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
                )}

                {/* Idioma del OCR */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h5 className="font-bold text-white">Reconocimiento OCR</h5>
                    <p className="text-gray-400">
                      Reconstruye el documento con texto digital real en lugar de incrustar las fotografías.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-gray-400 shrink-0">Idioma:</label>
                    <select
                      value={ocrLanguage}
                      onChange={(e) => setOcrLanguage(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
                    >
                      <option value="spa">Español (Predeterminado)</option>
                      <option value="eng">Inglés</option>
                      <option value="spa+eng">Español e Inglés</option>
                    </select>
                  </div>
                </div>

                {/* Acciones principales */}
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
                    disabled={confirmedPages.length === 0}
                    onClick={handleStartOcrProcessing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-40"
                  >
                    <Sparkles className="h-4 w-4 text-violet-200" />
                    <span>Reconocer texto (OCR) y reconstruir documento</span>
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 4: OCR EN PROCESO */}
            {step === "ocr_processing" && (
              <div className="w-full max-w-md p-8 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-6 shadow-2xl">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white">Reconstruyendo documento</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{ocrStatusMessage}</p>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-violet-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${ocrProgressPercent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Procesando páginas</span>
                    <span>{ocrProgressPercent}%</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  El procesamiento se realiza de manera 100% privada dentro de tu navegador. Tus hojas nunca se envían a servidores externos.
                </p>
              </div>
            )}

            {/* ETAPA 5: EDITOR DE DOCUMENTO DIGITAL RECONSTRUIDO */}
            {step === "ocr_editor" && activePage && activePage.recognizedContent && (
              <div className="w-full max-w-4xl space-y-5">
                {exportSuccessMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}

                {/* Pestañas de páginas */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {confirmedPages.map((page, idx) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => setActiveEditorPageIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                          activeEditorPageIndex === idx
                            ? "bg-violet-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Página {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Volver a lote de fotos
                  </button>
                </div>

                {/* Layout de Edición: Foto de referencia vs Bloques digitales */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Columna Izquierda: Fotografía de referencia (Sólo visual para comparar) */}
                  <div className="md:col-span-4 p-3 rounded-2xl bg-gray-900 border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                      <span>Foto original (Referencia)</span>
                      <span className="text-amber-400">No se incrustará en el PDF</span>
                    </div>

                    <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePage.dataUrl}
                        alt="Foto de referencia"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <p className="text-[10px] text-gray-500 leading-tight">
                      Esta foto se usa exclusivamente para que compares el texto reconocido. El PDF final contendrá únicamente caracteres vectoriales digitales.
                    </p>
                  </div>

                  {/* Columna Derecha: Bloques de texto editable */}
                  <div className="md:col-span-8 p-4 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-200">
                        Contenido Digital Reconocido ({activePage.recognizedContent.blocks.length} bloques)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddBlock}
                        className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-violet-300 inline-flex items-center gap-1 text-[11px]"
                      >
                        <Plus className="h-3 w-3" /> Añadir bloque
                      </button>
                    </div>

                    {!activePage.recognizedContent.hasText && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Se detectó poco texto en esta hoja. Podés escribir o corregir manualmente a continuación.</span>
                      </div>
                    )}

                    <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                      {activePage.recognizedContent.blocks.map((block, bIdx) => (
                        <div
                          key={block.id}
                          className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 font-mono">#{bIdx + 1}</span>
                              <select
                                value={block.type}
                                onChange={(e) =>
                                  handleChangeBlockType(bIdx, e.target.value as RecognizedBlockType)
                                }
                                className="px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-white text-[11px]"
                              >
                                <option value="title">Título Principal</option>
                                <option value="heading">Encabezado</option>
                                <option value="subheading">Subtítulo</option>
                                <option value="paragraph">Párrafo</option>
                                <option value="list_item">Ítem de Lista (•)</option>
                                <option value="table_row">Fila de Tabla</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(bIdx)}
                              className="text-gray-500 hover:text-rose-400 p-1"
                              title="Eliminar bloque"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <textarea
                            value={block.text}
                            onChange={(e) => handleUpdateBlockText(bIdx, e.target.value)}
                            rows={Math.min(4, Math.max(1, Math.ceil(block.text.length / 60)))}
                            className="w-full p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 text-xs leading-relaxed focus:border-violet-500 focus:outline-hidden resize-y"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configuración de salida PDF */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 font-medium mb-1">Título del Documento</label>
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
                      placeholder="Ej: Contrato de Arriendo"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-medium mb-1">Tipografía Digital</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
                    >
                      <option value="helvetica">Helvetica (Moderna y limpia)</option>
                      <option value="times">Times Roman (Clásica formal)</option>
                      <option value="courier">Courier (Monospace técnica)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-medium mb-1">Tamaño de Fuente Base</label>
                    <select
                      value={baseFontSize}
                      onChange={(e) => setBaseFontSize(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs"
                    >
                      <option value={10}>10 pt (Compacto)</option>
                      <option value={11}>11 pt (Estándar de lectura)</option>
                      <option value={12}>12 pt (Grande y accesible)</option>
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
                    disabled={isExportingPdf || confirmedPages.length === 0}
                    onClick={handleExportReconstructedPdf}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {isExportingPdf
                        ? "Generando PDF Vectorial..."
                        : "Descargar PDF Digital Reconstruido (.pdf)"}
                    </span>
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
