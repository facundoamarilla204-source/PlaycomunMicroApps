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
  FileX,
  Palette,
  Sparkles,
  Edit3,
  Plus,
  Zap,
  ZapOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bold,
  Eye,
  EyeOff,
  Sliders,
  ArrowLeft,
  ArrowRight,
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
import { DocumentPage } from "@/lib/pdf-editor/types"
import { formatBytes, getPdfJs } from "@/lib/pdf-editor/pdf-engine"
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
  initialStep?: "capture" | "qr_connect" | "file_upload"
  initialFiles?: File[]
}

export interface ConfirmedScannedPage {
  id: string
  dataUrl: string
  blob: Blob
  filter: "color" | "grayscale" | "contrast"
  rotation: number
  recognizedContent?: RecognizedPageContent
}

type ScannerStep =
  | "capture"
  | "qr_connect"
  | "preview_processed"
  | "adjust"
  | "review"
  | "ocr_processing"
  | "pdf_preview"
  | "ocr_editor"

export function CameraScannerModal({
  isOpen,
  onClose,
  onImportToWorkbench,
  initialStep,
  initialFiles,
}: CameraScannerModalProps) {
  // Navigation & Step state
  const [step, setStep] = useState<ScannerStep>("capture")
  const stepRef = useRef<ScannerStep>(step)
  useEffect(() => {
    stepRef.current = step
  }, [step])

  // Processing mode: faithful color scan (default) vs digital OCR reconstruction
  const [processingMode, setProcessingMode] = useState<"faithful" | "reconstruction">("faithful")
  const processingModeRef = useRef<"faithful" | "reconstruction">(processingMode)
  useEffect(() => {
    processingModeRef.current = processingMode
  }, [processingMode])

  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false)
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false)
  const [hasTorch, setHasTorch] = useState<boolean>(false)

  // QR Mobile Pairing State (Persistent across all steps)
  const [qrSessionToken, setQrSessionToken] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [lanQrUrl, setLanQrUrl] = useState<string | null>(null)
  const [onlineQrUrl, setOnlineQrUrl] = useState<string | null>(null)
  const [qrNetworkMode, setQrNetworkMode] = useState<"lan" | "online">("lan")
  const [isRegeneratingQr, setIsRegeneratingQr] = useState<boolean>(false)
  const [qrStatus, setQrStatus] = useState<
    "loading" | "pending" | "connected" | "receiving" | "expired" | "error"
  >("loading")
  const [copiedQrLink, setCopiedQrLink] = useState<boolean>(false)
  const [qrErrorMessage, setQrErrorMessage] = useState<string | null>(null)
  const qrPollingRef = useRef<NodeJS.Timeout | null>(null)

  // Current capture frame for adjustment
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [corners, setCorners] = useState<DocumentCorners | null>(null)
  const [activeCorner, setActiveCorner] = useState<keyof DocumentCorners | null>(null)
  const [filterMode, setFilterMode] = useState<"color" | "grayscale" | "contrast">("color")
  const [adjustRotation, setAdjustRotation] = useState<number>(0)
  const [pageIndexToRescan, setPageIndexToRescan] = useState<number | null>(null)

  // Clean processed document preview
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [isProcessingWarp, setIsProcessingWarp] = useState<boolean>(false)

  // Confirmed scanned pages
  const [confirmedPages, setConfirmedPages] = useState<ConfirmedScannedPage[]>([])
  const confirmedPagesRef = useRef<ConfirmedScannedPage[]>(confirmedPages)
  useEffect(() => {
    confirmedPagesRef.current = confirmedPages
  }, [confirmedPages])

  // OCR Processing & Reconstructed Document Configuration
  const [ocrProgressPercent, setOcrProgressPercent] = useState<number>(0)
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string>("")
  const [activeEditorPageIndex, setActiveEditorPageIndex] = useState<number>(0)
  const [ocrLanguage, setOcrLanguage] = useState<string>("spa")
  const [documentTitle, setDocumentTitle] = useState<string>("Documento Escaneado")
  const [fontFamily, setFontFamily] = useState<"helvetica" | "times" | "courier">("helvetica")
  const [baseFontSize, setBaseFontSize] = useState<number>(11)
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false)
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null)

  // Visual PDF Preview Engine (pdfjs-dist canvas renderer)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [currentDocPageSize, setCurrentDocPageSize] = useState<{ width: number; height: number }>({
    width: 595.28,
    height: 841.89,
  })
  const [renderError, setRenderError] = useState<boolean>(false)
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null)
  const [pdfJsDoc, setPdfJsDoc] = useState<any | null>(null)
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0)
  const [previewScale, setPreviewScale] = useState<number>(1.0)
  const [isRenderingPdf, setIsRenderingPdf] = useState<boolean>(false)
  const [isReferencePhotoOpen, setIsReferencePhotoOpen] = useState<boolean>(false)
  const [isDrawerEditorOpen, setIsDrawerEditorOpen] = useState<boolean>(false)
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState<boolean>(false)
  const [isProcessingIncrementalOcr, setIsProcessingIncrementalOcr] = useState<boolean>(false)
  const renderTaskRef = useRef<any>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const adjustCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addPageFileInputRef = useRef<HTMLInputElement>(null)

  // 1. Initialize camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setIsCameraLoading(true)
    setCameraError(null)

    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost"
    ) {
      setCameraError(
        "El acceso a la cámara requiere conexión segura HTTPS. Podés usar la conexión por QR con tu celular o subir imágenes."
      )
      setIsCameraLoading(false)
      return
    }

    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }

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

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }

      // Detect available cameras & torch support
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === "videoinput")
      setCameras(videoDevices)

      const track = newStream.getVideoTracks()[0]
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) || {}
        setHasTorch(Boolean((capabilities as any).torch))
        if (!selectedCameraId) {
          setSelectedCameraId(track.getSettings().deviceId || "")
        }
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Permiso de cámara denegado. Habilitá la cámara en los permisos del navegador o escaneá con tu celular vía QR."
        )
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError(
          "No se encontró ninguna cámara activa en esta computadora. Usá la conexión por QR con tu celular."
        )
      } else {
        setCameraError(
          "No se pudo iniciar la cámara en este dispositivo. Podés conectar tu celular escaneando el código QR."
        )
      }
    } finally {
      setIsCameraLoading(false)
    }
  }, [stream, selectedCameraId])

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
  }, [isOpen, step, startCamera, stopCamera])

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

  // QR Session Management & Creation
  const startQrSession = async () => {
    stopCamera()
    setStep("qr_connect")
    setIsRegeneratingQr(true)
    setQrStatus("loading")
    setQrErrorMessage(null)

    // If an existing token was active, cleanly purge it in background
    if (qrSessionToken) {
      fetch("/api/scan-session/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: qrSessionToken }),
      }).catch(() => {})
    }

    setQrSessionToken(null)
    setQrUrl(null)
    setLanQrUrl(null)
    setOnlineQrUrl(null)

    try {
      const res = await fetch("/api/scan-session/create", { method: "POST" })
      if (!res.ok) throw new Error("No se pudo iniciar la sesión para el celular.")
      const data = await res.json()
      setQrSessionToken(data.sessionToken)
      setLanQrUrl(data.lanQrUrl || null)
      setOnlineQrUrl(data.onlineQrUrl || null)

      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.startsWith("192.168."))

      if (isLocalhost && data.lanQrUrl) {
        setQrNetworkMode("lan")
        setQrUrl(data.lanQrUrl)
      } else {
        setQrNetworkMode("online")
        setQrUrl(data.onlineQrUrl || data.qrUrl)
      }

      setQrStatus("pending")
    } catch (err: any) {
      setQrStatus("error")
      setQrErrorMessage(err?.message || "Error al generar el código QR de conexión.")
    } finally {
      setIsRegeneratingQr(false)
    }
  }

  // Switch between LAN Wi-Fi and Online Web Domain
  const handleSwitchQrNetwork = (mode: "lan" | "online") => {
    setQrNetworkMode(mode)
    if (mode === "lan" && lanQrUrl) {
      setQrUrl(lanQrUrl)
    } else if (mode === "online" && onlineQrUrl) {
      setQrUrl(onlineQrUrl)
    }
  }

  // Helper: Warp perspective, rotate and apply flat-field enhancement
  const generateProcessedDoc = useCallback(
    async (
      sourceCanvas: HTMLCanvasElement,
      pts: DocumentCorners,
      rot: number,
      filter: "color" | "grayscale" | "contrast"
    ) => {
      let warped = applyPerspectiveWarp(sourceCanvas, pts)
      if (rot !== 0) {
        warped = rotateCanvas(warped, rot)
      }
      applyImageFilters(warped, filter)
      const dataUrl = warped.toDataURL("image/png")
      const blob = await new Promise<Blob>((resolve) => {
        warped.toBlob((b) => resolve(b || new Blob()), "image/png")
      })
      return { dataUrl, blob }
    },
    []
  )

  // Helper: Generates actual PDF blob from pages according to active processingMode
  const generatePdfBlobFromConfirmedPages = useCallback(
    async (
      pages: ConfirmedScannedPage[],
      modeOverride?: "faithful" | "reconstruction"
    ) => {
      if (pages.length === 0) return null
      const activeMode = modeOverride || processingModeRef.current

      if (activeMode === "faithful") {
        const dataUrls = pages.map((p) => p.dataUrl).filter(Boolean)
        if (dataUrls.length === 0) return null
        return await exportScannedPagesToPdf(dataUrls, {
          fileName: documentTitle ? `${documentTitle}.pdf` : "escaneo_fiel.pdf",
          pageSize: "a4",
        })
      } else {
        const validPages = pages
          .map((p) => p.recognizedContent)
          .filter((rc): rc is RecognizedPageContent => Boolean(rc))

        if (validPages.length === 0) return null

        return await reconstructDigitalPdf(validPages, {
          documentTitle,
          fontFamily,
          fontSize: baseFontSize,
        })
      }
    },
    [documentTitle, fontFamily, baseFontSize]
  )

  // Batch import images from file selection (supports 1, 5, 10, 20+ photos)
  const handleBatchImportImages = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      setIsProcessingWarp(true)
      try {
        const newPages: ConfirmedScannedPage[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.onerror = reject
            image.src = dataUrl
          })

          const canvas = document.createElement("canvas")
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext("2d")
          if (!ctx) continue
          ctx.drawImage(img, 0, 0)

          const detected = detectDocumentCorners(canvas)
          const processed = await generateProcessedDoc(canvas, detected, 0, "color")

          newPages.push({
            id: `scan_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            dataUrl: processed.dataUrl,
            blob: processed.blob,
            filter: "color",
            rotation: 0,
          })
        }

        if (newPages.length > 0) {
          const updated = [...confirmedPagesRef.current, ...newPages]
          setConfirmedPages(updated)
          const targetIdx = updated.length - 1
          setPreviewPageIndex(targetIdx)
          setActiveEditorPageIndex(targetIdx)

          const newPdfBlob = await generatePdfBlobFromConfirmedPages(
            updated,
            processingModeRef.current
          )
          if (newPdfBlob) {
            setPreviewPdfBlob(newPdfBlob)
          }
          setStep("pdf_preview")
        }
      } catch (err: any) {
        alert("Error al procesar fotografías: " + (err?.message || err))
      } finally {
        setIsProcessingWarp(false)
      }
    },
    [generateProcessedDoc, generatePdfBlobFromConfirmedPages]
  )

  // Initial step & files routing on modal opening
  useEffect(() => {
    if (!isOpen) return

    if (initialFiles && initialFiles.length > 0) {
      handleBatchImportImages(initialFiles)
    } else if (initialStep === "qr_connect") {
      startQrSession()
    } else if (initialStep === "file_upload") {
      fileInputRef.current?.click()
    } else if (confirmedPagesRef.current.length === 0) {
      setStep("capture")
    }
  }, [isOpen, initialStep, initialFiles, handleBatchImportImages])

  // PERSISTENT BACKGROUND POLLING: Keeps running while qrSessionToken exists
  useEffect(() => {
    if (!qrSessionToken || qrStatus === "expired") {
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
          const currentList = confirmedPagesRef.current
          const existingIds = new Set(currentList.map((p) => p.id))
          const newEntries: ConfirmedScannedPage[] = []

          for (const ep of data.pages) {
            if (!existingIds.has(ep.id)) {
              newEntries.push({
                id: ep.id,
                dataUrl: ep.dataUrl,
                blob: new Blob(),
                filter: "color",
                rotation: 0,
              })
            }
          }

          if (newEntries.length > 0) {
            const updated = [...currentList, ...newEntries]
            setConfirmedPages(updated)
            const targetIdx = updated.length - 1
            setPreviewPageIndex(targetIdx)
            setActiveEditorPageIndex(targetIdx)

            // Auto-generate PDF in faithful mode and switch to preview!
            const newPdfBlob = await generatePdfBlobFromConfirmedPages(
              updated,
              processingModeRef.current
            )
            if (newPdfBlob) {
              setPreviewPdfBlob(newPdfBlob)
            }
            if (stepRef.current === "qr_connect") {
              setStep("pdf_preview")
            }
            setExportSuccessMessage(
              `Página ${updated.length} recibida desde tu celular.`
            )
          }
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
  }, [qrSessionToken, qrStatus, generatePdfBlobFromConfirmedPages])

  // Capture frame from webcam
  const handleCaptureFrame = async () => {
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

    const detected = detectDocumentCorners(canvas)
    setCorners(detected)
    setFilterMode("color")
    setAdjustRotation(0)

    setIsProcessingWarp(true)
    try {
      const { dataUrl, blob } = await generateProcessedDoc(canvas, detected, 0, "color")
      const pageObj: ConfirmedScannedPage = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataUrl,
        blob,
        filter: "color",
        rotation: 0,
      }

      let updatedPages = [...confirmedPages]
      let targetIdx = updatedPages.length
      if (pageIndexToRescan !== null && pageIndexToRescan < updatedPages.length) {
        updatedPages[pageIndexToRescan] = pageObj
        targetIdx = pageIndexToRescan
        setPageIndexToRescan(null)
      } else {
        updatedPages.push(pageObj)
      }

      setConfirmedPages(updatedPages)
      setCapturedCanvas(null)
      setCorners(null)
      setProcessedPreviewUrl(null)
      setProcessedBlob(null)
      setPreviewPageIndex(targetIdx)
      setActiveEditorPageIndex(targetIdx)

      const newPdfBlob = await generatePdfBlobFromConfirmedPages(
        updatedPages,
        processingMode
      )
      if (newPdfBlob) {
        setPreviewPdfBlob(newPdfBlob)
      }
      setStep("pdf_preview")
    } finally {
      setIsProcessingWarp(false)
    }
  }

  // File upload fallback (supports multiple files at once!)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const filesArray = Array.from(e.target.files)
    handleBatchImportImages(filesArray)
    e.target.value = ""
  }

  // Redraw corners on manual adjustment canvas
  const redrawAdjustCanvas = useCallback(() => {
    if (!adjustCanvasRef.current || !capturedCanvas || !corners) return
    const canvas = adjustCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const maxW = 540
    const scale = Math.min(1, maxW / capturedCanvas.width)
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

    // Shaded mask
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Clear cutout inside corners
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

    // Boundary outline
    ctx.beginPath()
    ctx.moveTo(dTL.x, dTL.y)
    ctx.lineTo(dTR.x, dTR.y)
    ctx.lineTo(dBR.x, dBR.y)
    ctx.lineTo(dBL.x, dBL.y)
    ctx.closePath()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = "#8b5cf6"
    ctx.stroke()

    // 4 Corner handles
    const drawHandle = (p: Point) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2)
      ctx.fillStyle = "#8b5cf6"
      ctx.fill()
      ctx.lineWidth = 2.5
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

  // Pointer interactions for dragging corners
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
    const threshold = 35 / scale

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

  const handleChangeFilter = async (newFilter: "color" | "grayscale" | "contrast") => {
    setFilterMode(newFilter)
    if (!capturedCanvas || !corners) return
    setIsProcessingWarp(true)
    try {
      const { dataUrl, blob } = await generateProcessedDoc(
        capturedCanvas,
        corners,
        adjustRotation,
        newFilter
      )
      setProcessedPreviewUrl(dataUrl)
      setProcessedBlob(blob)
    } finally {
      setIsProcessingWarp(false)
    }
  }

  const handleRotatePage = async () => {
    const newRot = (adjustRotation + 90) % 360
    setAdjustRotation(newRot)
    if (!capturedCanvas || !corners) return
    setIsProcessingWarp(true)
    try {
      const { dataUrl, blob } = await generateProcessedDoc(
        capturedCanvas,
        corners,
        newRot,
        filterMode
      )
      setProcessedPreviewUrl(dataUrl)
      setProcessedBlob(blob)
    } finally {
      setIsProcessingWarp(false)
    }
  }

  // Open manual crop/corner adjustment for active page in preview
  const handleOpenAdjustForActivePage = () => {
    const current = confirmedPages[previewPageIndex]
    if (!current) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      setCapturedCanvas(canvas)
      setCorners(detectDocumentCorners(canvas))
      setAdjustRotation(current.rotation || 0)
      setFilterMode(current.filter || "color")
      setPageIndexToRescan(previewPageIndex)
      setStep("adjust")
    }
    img.src = current.dataUrl
  }

  const handleApplyCrop = async () => {
    if (!capturedCanvas || !corners) return
    setIsProcessingWarp(true)
    try {
      const { dataUrl, blob } = await generateProcessedDoc(
        capturedCanvas,
        corners,
        adjustRotation,
        filterMode
      )

      const pageObj: ConfirmedScannedPage = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataUrl,
        blob,
        filter: filterMode,
        rotation: adjustRotation,
      }

      let updatedPages = [...confirmedPages]
      let targetIdx = updatedPages.length
      if (pageIndexToRescan !== null && pageIndexToRescan < updatedPages.length) {
        updatedPages[pageIndexToRescan] = pageObj
        targetIdx = pageIndexToRescan
        setPageIndexToRescan(null)
      } else {
        updatedPages.push(pageObj)
      }

      setConfirmedPages(updatedPages)
      setCapturedCanvas(null)
      setCorners(null)
      setProcessedPreviewUrl(null)
      setProcessedBlob(null)
      setPreviewPageIndex(targetIdx)
      setActiveEditorPageIndex(targetIdx)

      const newBlob = await generatePdfBlobFromConfirmedPages(
        updatedPages,
        processingMode
      )
      if (newBlob) setPreviewPdfBlob(newBlob)
      setStep("pdf_preview")
    } finally {
      setIsProcessingWarp(false)
    }
  }

  // Confirm single page adjustment
  const handleConfirmCurrentPage = async () => {
    let finalDataUrl = processedPreviewUrl
    let finalBlob = processedBlob

    if (!finalDataUrl || !finalBlob) {
      if (!capturedCanvas || !corners) return
      const res = await generateProcessedDoc(capturedCanvas, corners, adjustRotation, filterMode)
      finalDataUrl = res.dataUrl
      finalBlob = res.blob
    }

    const pageObj: ConfirmedScannedPage = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUrl: finalDataUrl,
      blob: finalBlob,
      filter: filterMode,
      rotation: adjustRotation,
    }

    let updatedPages = [...confirmedPages]
    let targetIdx = updatedPages.length
    if (pageIndexToRescan !== null && pageIndexToRescan < updatedPages.length) {
      updatedPages[pageIndexToRescan] = pageObj
      targetIdx = pageIndexToRescan
      setPageIndexToRescan(null)
    } else {
      updatedPages.push(pageObj)
    }

    setConfirmedPages(updatedPages)
    setCapturedCanvas(null)
    setCorners(null)
    setProcessedPreviewUrl(null)
    setProcessedBlob(null)
    setPreviewPageIndex(targetIdx)
    setActiveEditorPageIndex(targetIdx)

    const newBlob = await generatePdfBlobFromConfirmedPages(updatedPages, processingMode)
    if (newBlob) setPreviewPdfBlob(newBlob)
    setStep("pdf_preview")
  }

  // Confirm page and directly proceed to OCR & Real PDF Preview
  const handleConfirmAndRunOcr = async () => {
    let finalDataUrl = processedPreviewUrl
    let finalBlob = processedBlob

    if (!finalDataUrl || !finalBlob) {
      if (!capturedCanvas || !corners) return
      const res = await generateProcessedDoc(capturedCanvas, corners, adjustRotation, filterMode)
      finalDataUrl = res.dataUrl
      finalBlob = res.blob
    }

    const newPage: ConfirmedScannedPage = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUrl: finalDataUrl,
      blob: finalBlob,
      filter: filterMode,
      rotation: adjustRotation,
    }

    let allPages = [...confirmedPages]
    if (pageIndexToRescan !== null && pageIndexToRescan < allPages.length) {
      allPages[pageIndexToRescan] = newPage
      setPageIndexToRescan(null)
    } else {
      allPages.push(newPage)
    }

    setConfirmedPages(allPages)
    setCapturedCanvas(null)
    setCorners(null)
    setProcessedPreviewUrl(null)
    setProcessedBlob(null)

    await runOcrOnAllPages(allPages)
  }

  // OCR Processing logic (Incremental or Full)
  const runOcrOnAllPages = async (pagesToProcess: ConfirmedScannedPage[]) => {
    setStep("ocr_processing")
    setOcrProgressPercent(5)
    setOcrStatusMessage("Preparando imágenes y cargando motor OCR...")

    const updatedPages: ConfirmedScannedPage[] = []

    for (let i = 0; i < pagesToProcess.length; i++) {
      const page = pagesToProcess[i]
      const pageNum = i + 1

      // If page already has recognized content and wasn't newly captured, preserve user edits!
      if (page.recognizedContent) {
        updatedPages.push(page)
        continue
      }

      setOcrStatusMessage(`Reconociendo página ${pageNum} de ${pagesToProcess.length}...`)

      try {
        const recognized = await performOcrOnImage(page.dataUrl, {
          language: ocrLanguage,
          onProgress: (pct, msg) => {
            const overallPct = Math.round(((i + pct / 100) / pagesToProcess.length) * 100)
            setOcrProgressPercent(overallPct)
            setOcrStatusMessage(`Página ${pageNum}/${pagesToProcess.length}: ${msg}`)
          },
        })
        recognized.pageIndex = i
        updatedPages.push({ ...page, recognizedContent: recognized })
      } catch (err: any) {
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

    // Generate real PDF and switch straight to visual PDF preview!
    const newPdfBlob = await generatePdfBlobFromConfirmedPages(updatedPages)
    if (newPdfBlob) {
      setPreviewPdfBlob(newPdfBlob)
      setPreviewPageIndex(0)
      setStep("pdf_preview")
    } else {
      setStep("review")
    }
  }

  // Incremental OCR for newly added pages while in pdf_preview
  const handleProcessIncrementalOcr = async () => {
    setIsProcessingIncrementalOcr(true)
    setOcrProgressPercent(5)
    setOcrStatusMessage("Reconociendo nuevas páginas añadidas...")

    const updatedPages = [...confirmedPages]
    for (let i = 0; i < updatedPages.length; i++) {
      const page = updatedPages[i]
      if (page.recognizedContent) continue

      try {
        const recognized = await performOcrOnImage(page.dataUrl, {
          language: ocrLanguage,
          onProgress: (pct, msg) => {
            setOcrProgressPercent(pct)
            setOcrStatusMessage(`Página ${i + 1}: ${msg}`)
          },
        })
        recognized.pageIndex = i
        updatedPages[i] = { ...page, recognizedContent: recognized }
      } catch (err) {
        updatedPages[i] = {
          ...page,
          recognizedContent: {
            pageIndex: i,
            fullText: "",
            blocks: [
              {
                id: `block_empty_${Date.now()}`,
                type: "paragraph",
                text: "No se pudo reconocer texto automático en esta hoja añadida.",
                confidence: 0,
              },
            ],
            confidence: 0,
            hasText: false,
          },
        }
      }
    }

    setConfirmedPages(updatedPages)
    const newBlob = await generatePdfBlobFromConfirmedPages(updatedPages)
    if (newBlob) {
      setPreviewPdfBlob(newBlob)
    }
    setIsProcessingIncrementalOcr(false)
  }

  // Load PDF in pdfjs when previewPdfBlob changes
  useEffect(() => {
    let isCancelled = false
    if (!previewPdfBlob) {
      setPdfJsDoc(null)
      return
    }

    const loadDoc = async () => {
      try {
        const arrayBuffer = await previewPdfBlob.arrayBuffer()
        const pdfjs = await getPdfJs()
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) })
        const doc = await loadingTask.promise
        if (!isCancelled) {
          setPdfJsDoc(doc)
        }
      } catch (err) {
        console.error("Error loading PDF in viewer:", err)
      }
    }

    loadDoc()
    return () => {
      isCancelled = true
    }
  }, [previewPdfBlob])

  // High-DPI Canvas Rendering of current PDF page
  useEffect(() => {
    if (!pdfJsDoc || !pdfCanvasRef.current || step !== "pdf_preview") return

    let isCancelled = false

    const renderPage = async () => {
      setIsRenderingPdf(true)
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch {}
          renderTaskRef.current = null
        }

        const targetPageNumber = Math.min(
          Math.max(1, previewPageIndex + 1),
          pdfJsDoc.numPages
        )
        const page = await pdfJsDoc.getPage(targetPageNumber)
        if (isCancelled) return

        const unscaledViewport = page.getViewport({ scale: 1.0 })
        setCurrentDocPageSize({
          width: unscaledViewport.width,
          height: unscaledViewport.height,
        })

        const canvas = pdfCanvasRef.current
        if (!canvas) return

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const effectiveScale = previewScale * Math.min(dpr, 2)
        const viewport = page.getViewport({ scale: effectiveScale })

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width / Math.min(dpr, 2))}px`
        canvas.style.height = `${Math.floor(viewport.height / Math.min(dpr, 2))}px`

        const ctx = canvas.getContext("2d", { willReadFrequently: false })
        if (!ctx) return

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
        })
        renderTaskRef.current = renderTask
        await renderTask.promise
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Error rendering PDF page to canvas:", err)
          if (!isCancelled) {
            setRenderError(true)
          }
        }
      } finally {
        if (!isCancelled) {
          setIsRenderingPdf(false)
        }
      }
    }

    renderPage()

    return () => {
      isCancelled = true
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {}
      }
    }
  }, [pdfJsDoc, previewPageIndex, previewScale, step])

  // Dynamic zoom fit calculated from available screen space and page dimensions
  const handleFitToScreen = useCallback(() => {
    if (!previewContainerRef.current) {
      setPreviewScale(1.0)
      return
    }
    const container = previewContainerRef.current
    const availW = Math.max(220, container.clientWidth - 48)
    const availH = Math.max(300, container.clientHeight - 48)

    const pageW = currentDocPageSize.width || 595.28
    const pageH = currentDocPageSize.height || 841.89

    const scaleW = availW / pageW
    const scaleH = availH / pageH
    const fitted = Math.min(scaleW, scaleH)

    setPreviewScale(Math.max(0.35, Math.min(2.0, Number(fitted.toFixed(2)))))
  }, [currentDocPageSize])

  // Switch between faithful color scan and digital OCR reconstruction
  const handleSwitchProcessingMode = async (newMode: "faithful" | "reconstruction") => {
    setProcessingMode(newMode)
    if (confirmedPages.length === 0) return

    if (newMode === "reconstruction") {
      const needsOcr = confirmedPages.some((p) => !p.recognizedContent)
      if (needsOcr) {
        await runOcrOnAllPages(confirmedPages)
        return
      }
    }

    const newBlob = await generatePdfBlobFromConfirmedPages(confirmedPages, newMode)
    if (newBlob) {
      setPreviewPdfBlob(newBlob)
    }
  }

  // Move page in list
  const handleMoveScannedPage = async (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1
    if (target < 0 || target >= confirmedPages.length) return
    const updated = [...confirmedPages]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    setConfirmedPages(updated)

    if (step === "pdf_preview") {
      setPreviewPageIndex(target)
      setActiveEditorPageIndex(target)
      const newBlob = await generatePdfBlobFromConfirmedPages(updated, processingMode)
      if (newBlob) setPreviewPdfBlob(newBlob)
    }
  }

  // Remove page (allows deleting all pages down to 0)
  const handleRemoveScannedPage = async (id: string) => {
    const confirmed = window.confirm("¿Querés eliminar esta página del documento?")
    if (!confirmed) return

    const updated = confirmedPages.filter((p) => p.id !== id)
    setConfirmedPages(updated)

    if (updated.length === 0) {
      setPreviewPdfBlob(null)
      setPdfJsDoc(null)
      setPreviewPageIndex(0)
      setActiveEditorPageIndex(0)
      return
    }

    const nextIdx = Math.max(0, Math.min(previewPageIndex, updated.length - 1))
    setPreviewPageIndex(nextIdx)
    setActiveEditorPageIndex(nextIdx)

    if (step === "pdf_preview") {
      const newBlob = await generatePdfBlobFromConfirmedPages(updated, processingMode)
      if (newBlob) setPreviewPdfBlob(newBlob)
    }
  }

  // Rescan / Repeat a specific page
  const handleRescanPage = (index: number) => {
    setPageIndexToRescan(index)
    setStep("capture")
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

  // Toggle bold for a block
  const handleToggleBlockBold = (blockIndex: number) => {
    const current = confirmedPages[activeEditorPageIndex]
    if (!current || !current.recognizedContent) return

    const newBlocks = [...current.recognizedContent.blocks]
    const currentBlock = newBlocks[blockIndex]
    newBlocks[blockIndex] = {
      ...currentBlock,
      isBold: !currentBlock.isBold,
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

  // Apply edits from drawer and update the visual PDF preview
  const handleApplyDrawerEditsAndRefreshPreview = async () => {
    const newBlob = await generatePdfBlobFromConfirmedPages(confirmedPages)
    if (newBlob) {
      setPreviewPdfBlob(newBlob)
    }
  }

  // Export active PDF according to processingMode (faithful color scan or digital OCR reconstruction)
  const handleExportCurrentPdf = async () => {
    if (confirmedPages.length === 0) return

    setIsExportingPdf(true)
    setExportSuccessMessage(null)

    try {
      let pdfBlob: Blob | null = previewPdfBlob

      if (processingMode === "faithful") {
        if (!pdfBlob) {
          const dataUrls = confirmedPages.map((p) => p.dataUrl).filter(Boolean)
          pdfBlob = await exportScannedPagesToPdf(dataUrls, {
            fileName: documentTitle ? `${documentTitle}.pdf` : "escaneo_fiel.pdf",
            pageSize: "a4",
          })
        }
      } else {
        const validPages = confirmedPages
          .map((p) => p.recognizedContent)
          .filter((rc): rc is RecognizedPageContent => Boolean(rc))

        if (validPages.length === 0) {
          alert("Por favor iniciá el reconocimiento OCR antes de exportar el PDF digital.")
          setIsExportingPdf(false)
          return
        }

        if (!pdfBlob) {
          pdfBlob = await reconstructDigitalPdf(validPages, {
            documentTitle,
            fontFamily,
            fontSize: baseFontSize,
          })
        }
      }

      if (!pdfBlob) throw new Error("No se pudo generar el documento PDF.")

      const safeTitle = (
        documentTitle ||
        (processingMode === "faithful" ? "documento_escaneado" : "reconstruccion_digital")
      )
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
      const fileName = `${safeTitle}.pdf`

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccessMessage(
        processingMode === "faithful"
          ? `PDF en color descargado (${confirmedPages.length} pág, ${formatBytes(pdfBlob.size)}).`
          : `PDF digital descargado (${confirmedPages.length} pág, ${formatBytes(pdfBlob.size)}).`
      )
    } catch (err: any) {
      alert("Error al exportar el PDF: " + (err?.message || err))
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleExportReconstructedPdf = handleExportCurrentPdf

  // Send to workbench
  const handleSendToWorkbench = () => {
    if (confirmedPages.length === 0) return

    const newDocPages: DocumentPage[] = confirmedPages.map((cp, idx) => ({
      id: `scanned_page_${Date.now()}_${idx}`,
      sourceFileId: "camera_scanner",
      sourceFileName: documentTitle || "Documento Escaneado",
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
    setQrSessionToken(null)
    setQrUrl(null)
    setLanQrUrl(null)
    setOnlineQrUrl(null)
    setQrStatus("loading")
    setIsRegeneratingQr(false)
    setPreviewPdfBlob(null)
    setPdfJsDoc(null)
    onClose()
  }

  if (!isOpen) return null

  const activePage = confirmedPages[activeEditorPageIndex] || confirmedPages[previewPageIndex]
  const pendingOcrCount = confirmedPages.filter((p) => !p.recognizedContent).length
  const totalPreviewPages = pdfJsDoc ? pdfJsDoc.numPages : confirmedPages.length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          className="relative w-full max-w-5xl rounded-2xl bg-gray-900 border border-gray-800 text-white overflow-hidden flex flex-col max-h-[96vh] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-gray-800 bg-gray-900/95 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
                {step === "pdf_preview" ? (
                  <FileText className="h-5 w-5" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  {step === "pdf_preview"
                    ? processingMode === "faithful"
                      ? "Vista previa: Escaneo fiel en color"
                      : "Vista previa: Reconstrucción digital (OCR)"
                    : "Escanear y procesar documentos"}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {step === "capture" &&
                    (pageIndexToRescan !== null
                      ? `Repetir captura de la página ${pageIndexToRescan + 1}`
                      : "Alineá la hoja A4 o conectá el celular mediante QR")}
                  {step === "qr_connect" && "Escaneá el código QR con la cámara de tu celular"}
                  {step === "preview_processed" &&
                    "Resultado del escaneo limpio: verificá la hoja procesada"}
                  {step === "adjust" && "Ajustá manualmente las esquinas de recorte"}
                  {step === "review" && `${confirmedPages.length} páginas capturadas para procesar`}
                  {step === "ocr_processing" && "Reconociendo contenido y jerarquías tipográficas..."}
                  {step === "pdf_preview" &&
                    (processingMode === "faithful"
                      ? "Documento PDF fiel con colores originales y proporciones A4"
                      : "Texto digital real y proporciones A4 exactamente como se descargará el PDF")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {confirmedPages.length > 0 &&
                step !== "review" &&
                step !== "pdf_preview" &&
                step !== "ocr_processing" && (
                  <button
                    type="button"
                    onClick={() => setStep(previewPdfBlob ? "pdf_preview" : "review")}
                    className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-colors"
                  >
                    {previewPdfBlob ? "Ver PDF" : `Páginas (${confirmedPages.length})`}
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col justify-center items-center bg-gray-950/80 min-h-[380px] relative">
            {/* ETAPA 1: CAPTURA DE CÁMARA */}
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
                    <div className="relative w-full max-w-sm aspect-9/16 max-h-[58vh] rounded-3xl overflow-hidden bg-black flex items-center justify-center shadow-2xl border border-gray-800">
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

                    {/* CONTROLES DE CAPTURA */}
                    <div className="w-full max-w-sm flex items-center justify-between px-2 pt-1">
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

                      <button
                        type="button"
                        onClick={handleCaptureFrame}
                        aria-label="Capturar fotografía de página"
                        className="h-17 w-17 rounded-full border-4 border-white/80 bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all shadow-xl flex items-center justify-center"
                      >
                        <div className="h-6 w-6 rounded-full bg-white shadow-xs" />
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
              <div className="w-full max-w-md p-6 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-5 shadow-2xl">
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Conectar celular con código QR
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Escaneá este código con la cámara de tu teléfono. Podés capturar una o varias
                    páginas consecutivas sin tener que reconectar.
                  </p>
                </div>

                {qrStatus === "loading" && (
                  <div className="py-10 flex flex-col items-center justify-center gap-3">
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
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium"
                    >
                      Reintentar conexión
                    </button>
                  </div>
                )}

                {(qrStatus === "pending" ||
                  qrStatus === "connected" ||
                  qrStatus === "receiving") &&
                  qrUrl && (
                    <div className="space-y-4">
                      {lanQrUrl && onlineQrUrl && (
                        <div className="flex items-center justify-center gap-1.5 p-1 bg-gray-950/70 border border-gray-800 rounded-xl max-w-xs mx-auto text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleSwitchQrNetwork("lan")}
                            className={`flex-1 py-1 px-2.5 rounded-lg font-medium transition-colors ${
                              qrNetworkMode === "lan"
                                ? "bg-violet-600 text-white shadow-xs"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            Misma red Wi-Fi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchQrNetwork("online")}
                            className={`flex-1 py-1 px-2.5 rounded-lg font-medium transition-colors ${
                              qrNetworkMode === "online"
                                ? "bg-violet-600 text-white shadow-xs"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            Internet Web
                          </button>
                        </div>
                      )}

                      <div className="inline-block p-4 rounded-2xl bg-white shadow-xl relative group">
                        <QRCodeSVG
                          value={qrUrl}
                          size={190}
                          level="M"
                          includeMargin={false}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            qrStatus === "connected" || qrStatus === "receiving"
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-amber-400 animate-ping"
                          }`}
                        />
                        <span className="text-xs font-semibold text-gray-300">
                          {qrStatus === "receiving"
                            ? "Transfiriendo fotografías desde el celular..."
                            : qrStatus === "connected"
                              ? "¡Celular conectado! Listo para capturar"
                              : "Esperando escaneo del código QR..."}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (qrUrl) {
                              navigator.clipboard.writeText(qrUrl)
                              setCopiedQrLink(true)
                              setTimeout(() => setCopiedQrLink(false), 2000)
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>{copiedQrLink ? "Enlace copiado" : "Copiar enlace"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={startQrSession}
                          disabled={isRegeneratingQr}
                          className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${isRegeneratingQr ? "animate-spin" : ""}`}
                          />
                          <span>Regenerar QR</span>
                        </button>
                      </div>

                      {confirmedPages.length > 0 && (
                        <div className="pt-2 border-t border-gray-800">
                          <p className="text-xs text-emerald-400 font-semibold mb-2">
                            {confirmedPages.length}{" "}
                            {confirmedPages.length === 1 ? "página recibida" : "páginas recibidas"}
                          </p>
                          <button
                            type="button"
                            onClick={() => setStep(previewPdfBlob ? "pdf_preview" : "review")}
                            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
                          >
                            <span>Continuar con {confirmedPages.length} páginas</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(previewPdfBlob ? "pdf_preview" : "capture")}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA: VISTA PREVIA LIMPIA DE LA HOJA PROCESADA */}
            {step === "preview_processed" && processedPreviewUrl && (
              <div className="w-full max-w-2xl flex flex-col items-center space-y-4">
                <div className="relative aspect-3/4 max-h-[50vh] rounded-2xl overflow-hidden bg-white shadow-2xl border border-gray-800 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedPreviewUrl}
                    alt="Página escaneada procesada"
                    className="max-h-full max-w-full object-contain"
                  />
                  {isProcessingWarp && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-2">
                      <div className="h-6 w-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                      <span>Aplicando corrección...</span>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleChangeFilter("contrast")}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          filterMode === "contrast"
                            ? "bg-violet-600 text-white"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        Documento nítido
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeFilter("color")}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          filterMode === "color"
                            ? "bg-violet-600 text-white"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        Color original
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeFilter("grayscale")}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          filterMode === "grayscale"
                            ? "bg-violet-600 text-white"
                            : "text-gray-300 hover:text-white"
                        }`}
                      >
                        Escala de grises
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRotatePage}
                        className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <RotateCw className="h-3.5 w-3.5" /> Girar 90°
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("adjust")}
                        className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Crop className="h-3.5 w-3.5 text-violet-400" /> Reajustar bordes
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("capture")}
                      className="px-4 py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      Repetir foto
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmCurrentPage}
                        disabled={isProcessingWarp}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700 transition-colors"
                      >
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Confirmar página</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmAndRunOcr}
                        disabled={isProcessingWarp}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-colors"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Reconocer texto (OCR)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA: AJUSTE MANUAL DE ESQUINAS */}
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
                    className="cursor-crosshair max-h-[46vh] max-w-full"
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

                  <div className="w-full flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("preview_processed")}
                      className="px-4 py-2.5 rounded-xl border border-gray-700 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      Volver a vista previa
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyCrop}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition-colors"
                    >
                      <Check className="h-4 w-4" /> Aplicar recorte
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA: REVISIÓN DE LOTE DE PÁGINAS */}
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
                      onClick={() => {
                        if (qrSessionToken) {
                          setStep("qr_connect")
                        } else {
                          startQrSession()
                        }
                      }}
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

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRescanPage(idx)}
                              className="p-1 text-gray-400 hover:text-white"
                              title="Repetir captura de esta hoja"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </button>
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
                      </div>
                    ))}
                  </div>
                )}

                {/* Idioma del OCR */}
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h5 className="font-bold text-white">Reconocimiento OCR con formato</h5>
                    <p className="text-gray-400">
                      Reconstruye títulos, negritas, subtítulos y párrafos en texto digital real A4.
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
                    onClick={() => runOcrOnAllPages(confirmedPages)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-40"
                  >
                    <Sparkles className="h-4 w-4 text-violet-200" />
                    <span>Reconocer texto y ver vista previa del PDF</span>
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA: OCR EN PROCESO */}
            {step === "ocr_processing" && (
              <div className="w-full max-w-md p-8 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-6 shadow-2xl">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white">Reconstruyendo documento</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{ocrStatusMessage}</p>
                </div>

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
                  El procesamiento se realiza de manera 100% privada dentro de tu navegador. Tus
                  hojas nunca se envían a servidores externos.
                </p>
              </div>
            )}

            {/* ETAPA PRINCIPAL: VISTA PREVIA VISUAL DEL PDF */}
            {step === "pdf_preview" && (
              <div className="w-full flex flex-col items-center space-y-4">
                {/* Banner de aviso si hay páginas recibidas sin OCR (solo en modo reconstrucción) */}
                {processingMode === "reconstruction" && pendingOcrCount > 0 && (
                  <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        Se agregaron {pendingOcrCount} página(s) nueva(s) sin procesar por OCR.
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessingIncrementalOcr}
                      onClick={handleProcessIncrementalOcr}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {isProcessingIncrementalOcr
                          ? "Procesando..."
                          : "Procesar e incorporar al PDF"}
                      </span>
                    </button>
                  </div>
                )}

                {/* BARRA DE HERRAMIENTAS SUPERIOR DE LA VISTA PREVIA */}
                <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-gray-900 border border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
                  {/* Selector de modo: Escaneo fiel en color vs Reconstrucción OCR */}
                  <div className="flex items-center rounded-xl bg-gray-950/80 p-0.5 border border-gray-800">
                    <button
                      type="button"
                      onClick={() => handleSwitchProcessingMode("faithful")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                        processingMode === "faithful"
                          ? "bg-violet-600 text-white shadow-xs"
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Escaneo fiel que conserva colores originales, tintas y fotos"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <span>Escaneo fiel en color</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchProcessingMode("reconstruction")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                        processingMode === "reconstruction"
                          ? "bg-violet-600 text-white shadow-xs"
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Reconstrucción de texto digital con OCR"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Reconstrucción digital (OCR)</span>
                    </button>
                  </div>

                  {/* Navegación de páginas */}
                  {confirmedPages.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={previewPageIndex === 0}
                        onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-30 transition-colors"
                        title="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-semibold text-gray-200 px-2 min-w-24 text-center">
                        Página {previewPageIndex + 1} de {totalPreviewPages}
                      </span>
                      <button
                        type="button"
                        disabled={previewPageIndex >= totalPreviewPages - 1}
                        onClick={() =>
                          setPreviewPageIndex((p) => Math.min(totalPreviewPages - 1, p + 1))
                        }
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-30 transition-colors"
                        title="Página siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Controles de Zoom y Ajuste dinámico */}
                  <div className="flex items-center gap-1 bg-gray-950/70 border border-gray-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewScale((s) => Math.max(0.4, s - 0.15))}
                      className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Alejar"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] font-mono px-1.5 text-gray-300">
                      {Math.round(previewScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewScale((s) => Math.min(2.5, s + 0.15))}
                      className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Acercar"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleFitToScreen}
                      className="px-2 py-0.5 rounded-lg text-[10px] text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-1"
                      title="Ajustar al espacio de pantalla"
                    >
                      Ajustar
                    </button>
                  </div>

                  {/* Acciones sobre la página activa y botón Agregar Páginas */}
                  <div className="flex items-center gap-2">
                    {confirmedPages.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenAdjustForActivePage}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                          title="Reajustar bordes y recorte de esta hoja"
                        >
                          <Crop className="h-3.5 w-3.5 text-violet-400" />
                          <span className="hidden sm:inline">Bordes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRescanPage(previewPageIndex)}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                          title="Repetir captura de esta página"
                        >
                          <RotateCw className="h-3.5 w-3.5 text-blue-400" />
                          <span className="hidden sm:inline">Repetir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (activePage) handleRemoveScannedPage(activePage.id)
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-rose-950/50 hover:text-rose-300 border border-transparent hover:border-rose-800/40 text-gray-400 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                          title="Eliminar esta página del documento"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </>
                    )}

                    {processingMode === "reconstruction" && confirmedPages.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsReferencePhotoOpen((prev) => !prev)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                            isReferencePhotoOpen
                              ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                          }`}
                          title="Comparar con la foto original"
                        >
                          {isReferencePhotoOpen ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden md:inline">Foto original</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsDrawerEditorOpen((prev) => !prev)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                            isDrawerEditorOpen
                              ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30"
                              : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                          }`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Editar texto</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsAddPageModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Agregar páginas</span>
                    </button>
                  </div>
                </div>

                {/* ÁREA CENTRAL: VISTA PREVIA O PANTALLA VACÍA */}
                {confirmedPages.length === 0 ? (
                  <div className="w-full max-w-md py-12 px-6 rounded-3xl bg-gray-900/90 border border-gray-800 text-center space-y-4 my-8 shadow-xl">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-800 text-gray-400 flex items-center justify-center">
                      <FileX className="h-8 w-8 stroke-1" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">No quedan páginas en el documento</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Eliminaste todas las hojas del escáner. Podés capturar una nueva hoja con la cámara, subir fotos desde tu dispositivo o conectar tu celular mediante QR.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep("capture")}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Escanear con cámara</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addPageFileInputRef.current?.click()}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span>Subir fotos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (qrSessionToken) {
                            setStep("qr_connect")
                          } else {
                            startQrSession()
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-violet-400 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Conectar celular (QR)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex justify-center items-start gap-4 overflow-x-auto py-2">
                    {/* Foto de referencia lateral (opcional) */}
                    {isReferencePhotoOpen && activePage && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-64 shrink-0 rounded-2xl bg-gray-900 border border-gray-800 p-3 space-y-2 self-start shadow-xl"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
                          <span>Foto capturada (Pág. {previewPageIndex + 1})</span>
                          <button
                            type="button"
                            onClick={() => setIsReferencePhotoOpen(false)}
                            className="p-1 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activePage.dataUrl}
                            alt="Foto original de referencia"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <p className="text-[10px] text-gray-500 leading-tight">
                          Foto original de la captura. Podés verificar que los datos visuales coincidan con el PDF generado.
                        </p>
                      </motion.div>
                    )}

                    {/* LIENZO REAL DE RENDERIZADO DEL PDF (A4) */}
                    <div
                      ref={previewContainerRef}
                      className="relative flex flex-col items-center justify-center rounded-2xl bg-gray-950 p-4 border border-gray-800/80 shadow-2xl min-h-[460px] max-w-full overflow-auto"
                    >
                      {isRenderingPdf && (
                        <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center text-xs text-violet-300 gap-2 z-10 rounded-2xl">
                          <div className="h-6 w-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                          <span>Renderizando vista previa...</span>
                        </div>
                      )}

                      {renderError ? (
                        <div className="p-6 text-center space-y-3 bg-gray-900/95 text-white max-w-sm rounded-xl border border-rose-500/30">
                          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
                          <h5 className="text-xs font-bold text-white">No se pudo renderizar la vista previa del PDF</h5>
                          <p className="text-[11px] text-gray-400">
                            Hubo un problema al procesar la visualización en el visor. Tu captura original y el documento siguen seguros.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                setRenderError(false)
                                const newBlob = await generatePdfBlobFromConfirmedPages(confirmedPages, processingMode)
                                if (newBlob) setPreviewPdfBlob(newBlob)
                              }}
                              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
                            >
                              Reintentar renderizado
                            </button>
                          </div>
                          {activePage && (
                            <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-500">
                              <span>Mostrando imagen procesada de respaldo:</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={activePage.dataUrl}
                                alt="Vista previa de respaldo"
                                className="mt-1 max-h-48 rounded-lg object-contain mx-auto border border-gray-800"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="bg-white rounded-md shadow-2xl overflow-hidden border border-gray-300 ring-1 ring-black/10 transition-all flex items-center justify-center"
                          style={{
                            aspectRatio: `${currentDocPageSize.width} / ${currentDocPageSize.height}`,
                            maxWidth: "100%",
                          }}
                        >
                          <canvas ref={pdfCanvasRef} className="block" />
                        </div>
                      )}
                    </div>

                    {/* CAJÓN LATERAL SLIDE-OVER: EDICIÓN DE TEXTO EN MODO RECONSTRUCCIÓN */}
                    {isDrawerEditorOpen && activePage && activePage.recognizedContent && (
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        className="w-84 sm:w-96 shrink-0 rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-3 self-start shadow-2xl max-h-[70vh] flex flex-col"
                      >
                        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Sliders className="h-3.5 w-3.5 text-violet-400" />
                              <span>Editar Página {previewPageIndex + 1}</span>
                            </h4>
                            <p className="text-[10px] text-gray-400">
                              {activePage.recognizedContent.blocks.length} bloques reconocidos
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAddBlock}
                              className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-violet-300 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Bloque
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsDrawerEditorOpen(false)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Lista de bloques scrollable */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                          {activePage.recognizedContent.blocks.map((block, bIdx) => (
                            <div
                              key={block.id}
                              className="p-2.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-gray-500 font-mono">
                                    #{bIdx + 1}
                                  </span>
                                  <select
                                    value={block.type}
                                    onChange={(e) =>
                                      handleChangeBlockType(
                                        bIdx,
                                        e.target.value as RecognizedBlockType
                                      )
                                    }
                                    className="px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-white text-[11px]"
                                  >
                                    <option value="title">Título Principal</option>
                                    <option value="heading">Encabezado</option>
                                    <option value="subheading">Subtítulo</option>
                                    <option value="paragraph">Párrafo normal</option>
                                    <option value="list_item">Lista (•)</option>
                                    <option value="table_row">Fila de tabla</option>
                                  </select>

                                  {/* Toggle Negrita */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBlockBold(bIdx)}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                                      block.isBold
                                        ? "bg-violet-600 text-white shadow-xs"
                                        : "bg-gray-800 text-gray-400 hover:text-white"
                                    }`}
                                    title="Alternar formato negrita"
                                  >
                                    <Bold className="h-3 w-3" /> Negrita
                                  </button>
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
                                rows={Math.min(3, Math.max(1, Math.ceil(block.text.length / 50)))}
                                className="w-full p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 text-xs leading-relaxed focus:border-violet-500 focus:outline-hidden resize-y"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Botón para aplicar y refrescar canvas */}
                        <div className="pt-2 border-t border-gray-800">
                          <button
                            type="button"
                            onClick={handleApplyDrawerEditsAndRefreshPreview}
                            className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Check className="h-4 w-4" />
                            <span>Actualizar vista previa</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* TIRA DE MINIATURAS (FILMSTRIP) INFERIOR PARA NAVEGAR Y GESTIONAR HOJAS */}
                {confirmedPages.length > 0 && (
                  <div className="w-full p-2.5 rounded-2xl bg-gray-900 border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between text-xs px-1 text-gray-400">
                      <span className="font-semibold text-gray-300">
                        Páginas del documento ({confirmedPages.length})
                      </span>
                      <span className="text-[11px]">
                        Hacé clic para cambiar de página o usá las flechas para reordenar
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                      {confirmedPages.map((page, idx) => {
                        const isActive = previewPageIndex === idx
                        return (
                          <div
                            key={page.id}
                            onClick={() => {
                              setPreviewPageIndex(idx)
                              setActiveEditorPageIndex(idx)
                            }}
                            className={`relative rounded-xl overflow-hidden border-2 cursor-pointer shrink-0 transition-all p-1 bg-gray-950 flex flex-col items-center ${
                              isActive
                                ? "border-violet-500 shadow-md shadow-violet-500/20 scale-105"
                                : "border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100"
                            }`}
                            style={{ width: 88 }}
                          >
                            <div className="relative aspect-3/4 w-full rounded-lg overflow-hidden bg-white flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={page.dataUrl}
                                alt={`Página ${idx + 1}`}
                                className="max-h-full max-w-full object-contain"
                              />
                              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {idx + 1}
                              </span>
                            </div>

                            {/* Mini controles de orden y borrado */}
                            <div
                              className="flex items-center justify-between w-full pt-1 px-1 text-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveScannedPage(idx, "left")}
                                className="p-0.5 hover:text-white disabled:opacity-20"
                                title="Mover antes"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRescanPage(idx)}
                                className="p-0.5 text-gray-400 hover:text-white"
                                title="Repetir captura de esta página"
                              >
                                <RotateCw className="h-3 w-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveScannedPage(page.id)}
                                className="p-0.5 text-rose-400 hover:text-rose-300"
                                title="Eliminar página"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>

                              <button
                                type="button"
                                disabled={idx === confirmedPages.length - 1}
                                onClick={() => handleMoveScannedPage(idx, "right")}
                                className="p-0.5 hover:text-white disabled:opacity-20"
                                title="Mover después"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ACCIONES FINALES INFERIORES: LLEVAR A MESA Y DESCARGAR PDF */}
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-gray-800">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={confirmedPages.length === 0}
                      onClick={() => setStep("review")}
                      className="px-4 py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40"
                    >
                      Volver al lote
                    </button>
                    <button
                      type="button"
                      disabled={confirmedPages.length === 0}
                      onClick={handleSendToWorkbench}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-colors disabled:opacity-40"
                    >
                      <Layers className="h-4 w-4" /> Mesa de trabajo
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {exportSuccessMessage && (
                      <span className="text-emerald-400 text-xs font-medium truncate">
                        {exportSuccessMessage}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isExportingPdf || confirmedPages.length === 0}
                      onClick={handleExportCurrentPdf}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-40"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {confirmedPages.length === 0
                          ? "Agregá páginas para descargar el PDF"
                          : isExportingPdf
                          ? "Generando archivo..."
                          : processingMode === "faithful"
                          ? "Descargar PDF Color (.pdf)"
                          : "Descargar PDF Digital (.pdf)"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL / DIÁLOGO FLOTANTE: AGREGAR PÁGINAS CONTINUO */}
            {isAddPageModalOpen && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md p-6 rounded-3xl bg-gray-900 border border-gray-800 text-white space-y-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                        <Plus className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Agregar más páginas</h4>
                        <p className="text-[11px] text-gray-400">
                          Conservá el documento actual y sumá hojas nuevas
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddPageModalOpen(false)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {/* Opción 1: Celular conectado (persistencia de sesión) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddPageModalOpen(false)
                        if (qrSessionToken) {
                          setStep("qr_connect")
                        } else {
                          startQrSession()
                        }
                      }}
                      className="w-full p-3.5 rounded-2xl bg-gray-950 border border-gray-800 hover:border-violet-500/50 flex items-center gap-3 text-left transition-all group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            Desde el celular conectado
                          </span>
                          {qrSessionToken && qrStatus === "connected" && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {qrSessionToken
                            ? "Tu celular sigue listo para fotografiar la siguiente página sin escanear otro QR."
                            : "Conectá tu teléfono mediante código QR para capturar hojas."}
                        </p>
                      </div>
                    </button>

                    {/* Opción 2: Cámara de esta PC */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddPageModalOpen(false)
                        setStep("capture")
                      }}
                      className="w-full p-3.5 rounded-2xl bg-gray-950 border border-gray-800 hover:border-violet-500/50 flex items-center gap-3 text-left transition-all group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white block">
                          Cámara de esta computadora
                        </span>
                        <p className="text-[11px] text-gray-400">
                          Abrí la webcam para fotografiar la hoja A4 con guía de encuadre.
                        </p>
                      </div>
                    </button>

                    {/* Opción 3: Subir foto o fotos locales */}
                    <input
                      ref={addPageFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        setIsAddPageModalOpen(false)
                        if (!e.target.files || e.target.files.length === 0) return
                        const files = Array.from(e.target.files)
                        handleBatchImportImages(files)
                        e.target.value = ""
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addPageFileInputRef.current?.click()}
                      className="w-full p-3.5 rounded-2xl bg-gray-950 border border-gray-800 hover:border-violet-500/50 flex items-center gap-3 text-left transition-all group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white block">
                          Subir fotografía desde archivo
                        </span>
                        <p className="text-[11px] text-gray-400">
                          Elegí una imagen de tu disco para sumarla como nueva página.
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setIsAddPageModalOpen(false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
