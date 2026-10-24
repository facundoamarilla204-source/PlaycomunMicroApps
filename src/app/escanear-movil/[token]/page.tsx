"use client"

import React, { useState, useRef, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Camera,
  RefreshCw,
  Image as ImageIcon,
  RotateCw,
  Crop,
  Check,
  Trash2,
  AlertCircle,
  Smartphone,
  CheckCircle2,
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

interface MobileScannerPageProps {
  params: Promise<{ token: string }>
}

interface CapturedMobilePage {
  id: string
  dataUrl: string
  pageNumber: number
}

type MobileStep = "capture" | "adjust" | "sent_summary"

export default function MobileScannerPage({ params }: MobileScannerPageProps) {
  const resolvedParams = use(params)
  const uploadToken = resolvedParams.token

  const [step, setStep] = useState<MobileStep>("capture")
  const [sessionState, setSessionState] = useState<"connecting" | "ready" | "error" | "expired">(
    "connecting"
  )
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null)

  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false)
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false)
  const [hasTorch, setHasTorch] = useState<boolean>(false)

  // Captured frame for adjustment
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [corners, setCorners] = useState<DocumentCorners | null>(null)
  const [activeCorner, setActiveCorner] = useState<keyof DocumentCorners | null>(null)
  const [adjustRotation, setAdjustRotation] = useState<number>(0)
  const [filterMode, setFilterMode] = useState<"color" | "contrast" | "grayscale">("contrast")

  // Syncing state
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [sentPages, setSentPages] = useState<CapturedMobilePage[]>([])
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const adjustCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Initial Ping to verify session
  useEffect(() => {
    let isMounted = true
    const pingSession = async () => {
      try {
        const res = await fetch(`/api/scan-session/ping?token=${uploadToken}`)
        const data = await res.json()
        if (!isMounted) return

        if (!res.ok || !data.ok) {
          if (data.status === "expired") {
            setSessionState("expired")
            setSessionErrorMessage("La sesión ha expirado. Por favor solicitá un nuevo código QR en tu PC.")
          } else {
            setSessionState("error")
            setSessionErrorMessage("El enlace o código QR de escaneo no es válido.")
          }
          return
        }

        setSessionState("ready")
      } catch {
        if (isMounted) {
          setSessionState("error")
          setSessionErrorMessage("Error de conexión al servidor. Verificá tu acceso a internet.")
        }
      }
    }

    pingSession()
    return () => {
      isMounted = false
    }
  }, [uploadToken])

  // 2. Start Camera
  const startCamera = useCallback(
    async (deviceId?: string) => {
      setIsCameraLoading(true)
      setCameraError(null)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          "Tu navegador móvil no admite acceso directo a la cámara. Podés subir fotografías de la galería."
        )
        setIsCameraLoading(false)
        return
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

        // Check torch support
        const videoTrack = mediaStream.getVideoTracks()[0]
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) || {}
          setHasTorch(Boolean((capabilities as any).torch))
        }

        // List cameras
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === "videoinput")
        setCameras(videoDevices)
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraError(
            "Permiso de cámara denegado. Habilitá el permiso en tu navegador o cargá fotos existentes."
          )
        } else {
          setCameraError("No se pudo iniciar la cámara móvil. Podés seleccionar fotos de tu galería.")
        }
      } finally {
        setIsCameraLoading(false)
      }
    },
    [stream]
  )

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
    if (sessionState === "ready" && step === "capture") {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [sessionState, step])

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

  // Flashlight / Torch toggle
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
    stopCamera()

    setCapturedCanvas(canvas)
    const detected = detectDocumentCorners(canvas)
    setCorners(detected)
    setAdjustRotation(0)
    setFilterMode("contrast")
    setStep("adjust")
  }

  // Fallback: Upload from file/gallery
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
      setAdjustRotation(0)
      setFilterMode("contrast")
      setStep("adjust")
    }

    img.src = url
  }

  // Draw interactive adjustment canvas
  const redrawAdjustCanvas = useCallback(() => {
    if (!adjustCanvasRef.current || !capturedCanvas || !corners) return
    const canvas = adjustCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return
    const maxW = parent.clientWidth
    const maxH = Math.min(window.innerHeight * 0.58, 460)

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

    // Shaded mask
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Clear quad cutout
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

    // Quadrilateral boundary line
    ctx.beginPath()
    ctx.moveTo(dTL.x, dTL.y)
    ctx.lineTo(dTR.x, dTR.y)
    ctx.lineTo(dBR.x, dBR.y)
    ctx.lineTo(dBL.x, dBL.y)
    ctx.closePath()
    ctx.lineWidth = 3
    ctx.strokeStyle = "#10B981" // Emerald
    ctx.stroke()

    // 4 Corner Touch Handles
    const drawHandle = (p: Point) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2)
      ctx.fillStyle = "#10B981"
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = "#ffffff"
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
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

  // Touch pointer handlers for dragging corners
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
    const threshold = 45 / scale

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

  // Confirm and upload page to desktop session
  const handleConfirmAndUploadPage = async () => {
    if (!capturedCanvas || !corners) return

    setIsUploading(true)
    setUploadFeedback(null)

    try {
      // 1. Perspective warp
      let warped = applyPerspectiveWarp(capturedCanvas, corners)

      // 2. Rotate if needed
      if (adjustRotation !== 0) {
        warped = rotateCanvas(warped, adjustRotation)
      }

      // 3. Document enhancement filter
      applyImageFilters(warped, filterMode)

      // 4. Data URL
      const dataUrl = warped.toDataURL("image/jpeg", 0.88)

      // 5. Send to session API
      const res = await fetch("/api/scan-session/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadToken,
          dataUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo transferir la página a la PC.")
      }

      const newPageNumber = sentPages.length + 1
      setSentPages([
        ...sentPages,
        {
          id: `page_${Date.now()}`,
          dataUrl,
          pageNumber: newPageNumber,
        },
      ])

      setUploadFeedback(`¡Página ${newPageNumber} enviada con éxito a tu computadora!`)
      setCapturedCanvas(null)
      setCorners(null)
      setStep("sent_summary")
    } catch (err: any) {
      alert("Error al transferir página: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (sessionState === "connecting") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-10 w-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-300">Conectando con la sesión de escaneo...</p>
      </div>
    )
  }

  if (sessionState === "error" || sessionState === "expired") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-lg font-bold text-white">Sesión no disponible</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {sessionErrorMessage || "El código QR ha expirado o no existe."}
          </p>
        </div>
        <p className="text-[11px] text-gray-500 max-w-xs">
          Regresá a tu computadora y hacé clic en &laquo;Escanear con el celular&raquo; para generar un nuevo código QR.
        </p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto select-none">
      {/* Top Bar */}
      <header className="p-4 border-b border-gray-800/80 bg-gray-900/80 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">PlayComún Escáner</h1>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado con tu PC
            </p>
          </div>
        </div>

        {sentPages.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300">
            {sentPages.length} {sentPages.length === 1 ? "hoja enviada" : "hojas enviadas"}
          </span>
        )}
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col p-4">
        {/* STEP 1: CAMERA CAPTURE (VERTICAL 9:16 COMPOSITION WITH A4 1:1.414 GUIDE) */}
        {step === "capture" && (
          <div className="flex-1 flex flex-col items-center justify-between space-y-4">
            {cameraError ? (
              <div className="my-auto w-full p-6 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-4 shadow-xl">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Cámara no disponible</h3>
                  <p className="text-xs text-gray-400">{cameraError}</p>
                </div>
                <div>
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
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-600/20"
                  >
                    Tomar o subir foto de la galería
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 9:16 VERTICAL CAMERA VIEWPORT */}
                <div className="relative w-full aspect-9/16 max-h-[72vh] rounded-3xl overflow-hidden bg-black flex items-center justify-center shadow-2xl border border-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* RECTÁNGULO DE ENCUADRE A4 (1 : 1.414) */}
                  <div
                    className="pointer-events-none absolute border-2 border-emerald-400/80 rounded-2xl flex items-center justify-center shadow-2xs"
                    style={{
                      width: "82%",
                      // A4 aspect ratio: height = width * 1.414
                      aspectRatio: "1 / 1.414",
                    }}
                  >
                    {/* Corner L-Brackets */}
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-3 border-l-3 border-white rounded-tl-sm" />
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-3 border-r-3 border-white rounded-tr-sm" />
                    <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-3 border-l-3 border-white rounded-bl-sm" />
                    <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-3 border-r-3 border-white rounded-br-sm" />

                    <span className="text-[10px] font-semibold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      Hoja A4
                    </span>
                  </div>

                  {isCameraLoading && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-xs text-gray-300 gap-2">
                      <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      <span>Iniciando sensor de cámara...</span>
                    </div>
                  )}
                </div>

                {/* BOTTOM CONTROLS */}
                <div className="w-full flex items-center justify-around px-4 py-2">
                  {/* File / Gallery button */}
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
                    className="flex flex-col items-center gap-1 text-[11px] text-gray-400 hover:text-white"
                  >
                    <div className="p-3 rounded-full bg-gray-900 border border-gray-800">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <span>Galería</span>
                  </button>

                  {/* Main Shutter Button */}
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    aria-label="Capturar fotografía de página"
                    className="h-19 w-19 rounded-full border-4 border-white/90 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-xl flex items-center justify-center"
                  >
                    <div className="h-8 w-8 rounded-full bg-white shadow-xs" />
                  </button>

                  {/* Flashlight / Torch toggle or Camera Switch */}
                  {hasTorch ? (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className="flex flex-col items-center gap-1 text-[11px] text-gray-400 hover:text-white"
                    >
                      <div
                        className={`p-3 rounded-full border ${
                          isTorchOn
                            ? "bg-amber-500 text-black border-amber-400"
                            : "bg-gray-900 border-gray-800"
                        }`}
                      >
                        {isTorchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
                      </div>
                      <span>Linterna</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      disabled={cameras.length <= 1}
                      className="flex flex-col items-center gap-1 text-[11px] text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <div className="p-3 rounded-full bg-gray-900 border border-gray-800">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                      <span>Girar</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: CORNER ADJUSTMENT & PERSPECTIVE WARP */}
        {step === "adjust" && (
          <div className="flex-1 flex flex-col items-center justify-between space-y-4">
            <div className="w-full text-center space-y-0.5">
              <h2 className="text-sm font-bold text-white">Ajustá los 4 bordes</h2>
              <p className="text-[11px] text-gray-400">
                Arrastrá los puntos verdes para encuadrar la hoja exactamente.
              </p>
            </div>

            <div className="relative border border-gray-800 rounded-3xl overflow-hidden bg-black flex items-center justify-center select-none touch-none shadow-2xl w-full">
              <canvas
                ref={adjustCanvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className="cursor-crosshair max-h-[52vh] max-w-full"
              />
            </div>

            {/* Adjustment Tools */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-xs gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (capturedCanvas) {
                      setCorners(detectDocumentCorners(capturedCanvas))
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-200 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Crop className="h-3.5 w-3.5 text-emerald-400" /> Auto-ajustar
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustRotation((prev) => (prev + 90) % 360)}
                  className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-200 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Girar 90°
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilterMode(filterMode === "contrast" ? "grayscale" : filterMode === "grayscale" ? "color" : "contrast")
                  }
                  className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-200 text-xs font-medium"
                >
                  Filtro: {filterMode === "contrast" ? "Contraste" : filterMode === "grayscale" ? "Gris" : "Color"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedCanvas(null)
                    setCorners(null)
                    setStep("capture")
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-800 text-xs font-semibold text-gray-300 hover:bg-gray-900 transition-colors"
                >
                  Repetir toma
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleConfirmAndUploadPage}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Enviar a la PC</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SENT SUMMARY & NEXT STEPS */}
        {step === "sent_summary" && (
          <div className="my-auto w-full p-6 rounded-3xl bg-gray-900 border border-gray-800 text-center space-y-5 shadow-2xl">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white">
                {uploadFeedback || "¡Página recibida en tu computadora!"}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ya podés ver la captura en la pantalla de tu PC. Podés seguir fotografiando más páginas o pasar a la computadora para procesar el texto con OCR.
              </p>
            </div>

            {/* Thumbnail list */}
            {sentPages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2 justify-center">
                {sentPages.map((sp, idx) => (
                  <div
                    key={sp.id}
                    className="relative w-14 h-19 rounded-lg overflow-hidden border border-gray-700 bg-black shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sp.dataUrl}
                      alt={`Página ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 rounded">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep("capture")}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Escanear siguiente página</span>
              </button>

              <p className="text-[11px] text-gray-500 pt-1">
                Cuando termines, continuá desde la computadora para revisar el OCR y descargar el PDF reconstruido.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
