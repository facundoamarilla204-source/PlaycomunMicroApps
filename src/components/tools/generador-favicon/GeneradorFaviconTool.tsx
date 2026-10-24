"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Upload,
  Download,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  FileCode,
  Archive,
  Eye,
  Sliders,
  Sparkles,
  Info,
  RefreshCw,
  X,
} from "lucide-react"
import {
  FaviconConfig,
  DEFAULT_FAVICON_CONFIG,
  FAVICON_TARGET_SIZES,
  FaviconPackageResult,
  generateFaviconPackage,
  renderFaviconCanvas,
} from "@/lib/favicon/favicon-engine"

export function GeneradorFaviconTool() {
  // Source image state
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; hasTransparency: boolean } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Editor configurations
  const [config, setConfig] = useState<FaviconConfig>(DEFAULT_FAVICON_CONFIG)
  const [appName, setAppName] = useState<string>("Mi Sitio Web")

  // Generated package state
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [packageResult, setPackageResult] = useState<FaviconPackageResult | null>(null)
  const [copiedCode, setCopiedCode] = useState<boolean>(false)

  // Live preview canvases for sizes
  const preview16Ref = useRef<HTMLCanvasElement>(null)
  const preview32Ref = useRef<HTMLCanvasElement>(null)
  const preview48Ref = useRef<HTMLCanvasElement>(null)
  const preview180Ref = useRef<HTMLCanvasElement>(null)
  const previewLargeRef = useRef<HTMLCanvasElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check transparency helper
  const detectTransparency = (img: HTMLImageElement, w: number, h: number): boolean => {
    try {
      const sampleW = Math.min(w, 100)
      const sampleH = Math.min(h, 100)
      const canvas = document.createElement("canvas")
      canvas.width = sampleW
      canvas.height = sampleH
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return false
      ctx.drawImage(img, 0, 0, sampleW, sampleH)
      const data = ctx.getImageData(0, 0, sampleW, sampleH).data
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  // Load image file into HTMLImageElement
  const handleFileSelected = (file: File) => {
    setErrorMessage(null)
    setPackageResult(null)

    // Allowed mime types
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    const isExtensionValid = ["png", "jpg", "jpeg", "webp", "svg"].includes(ext)

    if (!validTypes.includes(file.type) && !isExtensionValid) {
      setErrorMessage("Formato no compatible. Por favor subí una imagen PNG, JPG, WebP o SVG.")
      return
    }

    // Max 15MB to prevent browser memory exhaustion
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("El archivo supera el tamaño máximo de 15 MB.")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height

      if (!width || !height) {
        URL.revokeObjectURL(objectUrl)
        setErrorMessage("No se pudieron leer las dimensiones de la imagen.")
        return
      }

      const hasTransparency = detectTransparency(img, width, height)

      setSourceFile(file)
      setImageElement(img)
      setImageMeta({ width, height, hasTransparency })

      // Auto preserve transparency if present
      setConfig((prev) => ({
        ...prev,
        backgroundType: hasTransparency ? "transparent" : prev.backgroundType,
      }))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setErrorMessage("No se pudo decodificar la imagen. Verificá que no esté dañada.")
    }

    img.src = objectUrl
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Draw real-time previews whenever image or config changes
  const updatePreviews = useCallback(() => {
    if (!imageElement || !imageMeta) return

    const drawToCanvas = (canvas: HTMLCanvasElement | null, targetSize: number) => {
      if (!canvas) return
      canvas.width = targetSize
      canvas.height = targetSize
      const offscreen = renderFaviconCanvas(
        imageElement,
        imageMeta.width,
        imageMeta.height,
        targetSize,
        config
      )
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, targetSize, targetSize)
        ctx.drawImage(offscreen, 0, 0)
      }
    }

    drawToCanvas(preview16Ref.current, 16)
    drawToCanvas(preview32Ref.current, 32)
    drawToCanvas(preview48Ref.current, 48)
    drawToCanvas(preview180Ref.current, 180)
    drawToCanvas(previewLargeRef.current, 256)
  }, [imageElement, imageMeta, config])

  useEffect(() => {
    updatePreviews()
  }, [updatePreviews])

  // Generate full favicon package
  const handleGeneratePackage = async () => {
    if (!imageElement) return
    try {
      setIsGenerating(true)
      setErrorMessage(null)

      // Clean previously generated URLs if any
      if (packageResult) {
        packageResult.assets.forEach((a) => URL.revokeObjectURL(a.previewUrl))
      }

      const res = await generateFaviconPackage(imageElement, config, appName.trim() || "Mi Sitio Web")
      setPackageResult(res)
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocurrió un error al compilar los favicons.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Download entire ZIP
  const handleDownloadZip = () => {
    if (!packageResult) return
    const url = URL.createObjectURL(packageResult.zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `favicons-${(appName || "web").toLowerCase().replace(/[^a-z0-9]/g, "-")}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  // Download single asset
  const handleDownloadSingleAsset = (asset: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(asset.blob)
    const a = document.createElement("a")
    a.href = url
    a.download = asset.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  // Copy HTML integration snippet
  const handleCopyCode = async () => {
    if (!packageResult) return
    try {
      await navigator.clipboard.writeText(packageResult.htmlCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2500)
    } catch {
      setErrorMessage("No se pudo copiar automáticamente. Por favor seleccioná el texto manualmente.")
    }
  }

  // Reset adjustments to default
  const handleResetConfig = () => {
    setConfig({
      ...DEFAULT_FAVICON_CONFIG,
      backgroundType: imageMeta?.hasTransparency ? "transparent" : "solid",
    })
  }

  // Clear workspace and start over
  const handleClearImage = () => {
    if (packageResult) {
      packageResult.assets.forEach((a) => URL.revokeObjectURL(a.previewUrl))
    }
    setSourceFile(null)
    setImageElement(null)
    setImageMeta(null)
    setPackageResult(null)
    setErrorMessage(null)
    setConfig(DEFAULT_FAVICON_CONFIG)
  }

  // Small size readability heuristic
  const isImageTooWideOrTall = imageMeta ? Math.max(imageMeta.width, imageMeta.height) / Math.min(imageMeta.width, imageMeta.height) > 2.5 : false

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans">
      {/* Mensaje de Error */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Atención</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
            aria-label="Cerrar advertencia"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ESTADO 1: ZONA DE CARGA INICIAL */}
      {!imageElement ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center transition-all hover:border-slate-300 hover:shadow-xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelected(e.target.files[0])
                e.target.value = ""
              }
            }}
          />

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition-colors group-hover:bg-brand-light group-hover:text-brand mb-4">
            <Upload className="h-6 w-6" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Subí tu logo o imagen
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Arrastrá un archivo PNG, JPG, WebP o SVG aquí, o hacé clic para explorar tus archivos.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-xs">
            Seleccionar imagen
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 border-t border-slate-100 pt-5">
            <span>• Procesa en tu navegador (100% privado)</span>
            <span>• Mantiene transparencia PNG/SVG</span>
            <span>• Genera ICO y PNGs listos para web</span>
          </div>
        </div>
      ) : (
        /* ESTADO 2: EDITOR, CONFIGURADOR Y PREVISUALIZACIÓN */
        <div className="space-y-6">
          {/* Barra superior de estado de imagen cargada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Sliders className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {sourceFile?.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {imageMeta?.width} × {imageMeta?.height} px • {imageMeta?.hasTransparency ? "Con canal alfa (transparencia)" : "Fondo opaco"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cambiar imagen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelected(e.target.files[0])
                    e.target.value = ""
                  }
                }}
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Advertencia de legibilidad si la imagen es muy apaisada o vertical */}
          {isImageTooWideOrTall && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-start gap-2.5">
              <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <p>
                <strong>Nota de legibilidad:</strong> La imagen original tiene una proporción muy alargada. Los favicons son cuadrados (1:1); para que el isotipo sea legible en pestañas (16px), te recomendamos usar el modo <em>Contener</em> y verificar la previsualización inferior.
              </p>
            </div>
          )}

          {/* Grilla principal: Controles a la izquierda, Vista previa a la derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel de Controles (5 columnas) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Ajustes de Favicon
                </h3>
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  title="Restablecer a valores por defecto"
                >
                  <RotateCcw className="h-3 w-3" /> Restablecer
                </button>
              </div>

              {/* 1. Modo de adaptación */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800 block">
                  Encuadre en el lienzo cuadrado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, fitMode: "contain" }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      config.fitMode === "contain"
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Contener (completo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, fitMode: "cover" }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      config.fitMode === "cover"
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Recortar (llenar área)
                  </button>
                </div>
              </div>

              {/* 2. Escala visual */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="scale-slider" className="font-semibold text-slate-800">
                    Escala del logo
                  </label>
                  <span className="tabular-nums text-slate-500 font-medium">{config.scale}%</span>
                </div>
                <input
                  id="scale-slider"
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={config.scale}
                  onChange={(e) => setConfig((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              {/* 3. Margen interior / Padding */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="padding-slider" className="font-semibold text-slate-800">
                    Margen de seguridad
                  </label>
                  <span className="tabular-nums text-slate-500 font-medium">{config.padding}%</span>
                </div>
                <input
                  id="padding-slider"
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={config.padding}
                  onChange={(e) => setConfig((prev) => ({ ...prev, padding: Number(e.target.value) }))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              {/* 4. Fondo del icono */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-800 block">
                  Fondo del icono
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, backgroundType: "transparent" }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      config.backgroundType === "transparent"
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Transparente
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, backgroundType: "solid" }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      config.backgroundType === "solid"
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Color sólido
                  </button>
                </div>

                {config.backgroundType === "solid" && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="h-9 w-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                      title="Elegir color de fondo"
                    />
                    <input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      placeholder="#ffffff"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* 5. Nombre de la web para el manifiesto */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label htmlFor="app-name-input" className="text-xs font-semibold text-slate-800 block">
                  Nombre de tu web o marca
                </label>
                <input
                  id="app-name-input"
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Ej: Mi Proyecto Web"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-500">
                  Se usa en el manifiesto PWA y en los comentarios del código HTML.
                </p>
              </div>

              {/* Botón principal de compilación */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGeneratePackage}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Generando paquete de favicons...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      <span>Generar paquete de favicons</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Vista Previa en Contextos y Tamaños Reales (7 columnas) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Contexto 1: Simulación de Pestaña de Navegador Real */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Simulación en pestaña de navegador
                  </h4>
                  <span className="text-[11px] text-slate-500">Tamaño real: 16 × 16 px</span>
                </div>

                {/* Mockup de barra de navegador */}
                <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden text-xs">
                  {/* Pestañas simuladas */}
                  <div className="flex items-center px-3 pt-2 gap-2 bg-slate-200/70 border-b border-slate-200">
                    {/* Botones de ventana */}
                    <div className="flex items-center gap-1.5 mr-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    </div>

                    {/* Pestaña activa */}
                    <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-t-lg shadow-2xs max-w-xs border border-b-0 border-slate-200">
                      <div className="h-4 w-4 shrink-0 flex items-center justify-center overflow-hidden">
                        <canvas ref={preview16Ref} width="16" height="16" className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {appName || "Inicio"} — {sourceFile?.name || "Web"}
                      </span>
                      <span className="text-slate-400 text-xs ml-1">×</span>
                    </div>

                    {/* Pestaña inactiva */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-slate-500 text-[11px]">
                      <span>Otra pestaña</span>
                    </div>
                  </div>

                  {/* Barra de direcciones simulada */}
                  <div className="p-2 bg-white flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-md px-3 py-1 text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                      <span className="text-emerald-600">🔒</span>
                      <span>https://tusitio.com</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contexto 2: Grilla de resoluciones estándar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Resoluciones estándar generadas
                  </h4>
                  <span className="text-[11px] text-slate-500">Muestra fiel con canal alfa</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {/* 16x16 */}
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 flex items-center justify-center bg-[conic-gradient(#f1f5f9_25%,transparent_0_50%,#f1f5f9_0_75%,transparent_0)] bg-[size:8px_8px] rounded-md border border-slate-200/80 mb-2">
                      <canvas ref={preview16Ref} width="16" height="16" className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900">16 × 16</span>
                    <span className="text-[10px] text-slate-500">Pestañas estándar</span>
                  </div>

                  {/* 32x32 */}
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 flex items-center justify-center bg-[conic-gradient(#f1f5f9_25%,transparent_0_50%,#f1f5f9_0_75%,transparent_0)] bg-[size:8px_8px] rounded-md border border-slate-200/80 mb-2">
                      <canvas ref={preview32Ref} width="32" height="32" className="h-8 w-8" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900">32 × 32</span>
                    <span className="text-[10px] text-slate-500">Marcadores / retina</span>
                  </div>

                  {/* 48x48 */}
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <div className="h-14 w-14 flex items-center justify-center bg-[conic-gradient(#f1f5f9_25%,transparent_0_50%,#f1f5f9_0_75%,transparent_0)] bg-[size:8px_8px] rounded-md border border-slate-200/80 mb-2">
                      <canvas ref={preview48Ref} width="48" height="48" className="h-10 w-10" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900">48 × 48</span>
                    <span className="text-[10px] text-slate-500">Escritorio Windows</span>
                  </div>

                  {/* 180x180 Apple Touch */}
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <div className="h-14 w-14 flex items-center justify-center bg-[conic-gradient(#f1f5f9_25%,transparent_0_50%,#f1f5f9_0_75%,transparent_0)] bg-[size:8px_8px] rounded-xl border border-slate-200/80 mb-2 overflow-hidden shadow-2xs">
                      <canvas ref={preview180Ref} width="180" height="180" className="h-12 w-12" />
                    </div>
                    <span className="text-xs font-semibold text-slate-900">180 × 180</span>
                    <span className="text-[10px] text-slate-500">Apple Touch Icon</span>
                  </div>
                </div>

                {/* Vista previa ampliada de alta fidelidad */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 flex items-center justify-center bg-[conic-gradient(#f1f5f9_25%,transparent_0_50%,#f1f5f9_0_75%,transparent_0)] bg-[size:8px_8px] rounded-xl border border-slate-200 overflow-hidden">
                      <canvas ref={previewLargeRef} width="256" height="256" className="h-16 w-16" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Alta resolución PWA (192 & 512 px)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        El paquete genera automáticamente los iconos de pantalla de inicio y arranque PWA para Android.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: RESULTADOS GENERADOS, DESCARGA Y CÓDIGO HTML */}
          {packageResult && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Paquete compilado con éxito
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Incluye archivo multi-resolución ICO, imágenes PNG exactas, manifiesto PWA y guía README.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar paquete ZIP</span>
                </button>
              </div>

              {/* Lista de archivos generados con opción de descarga individual */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Archivos incluidos en el paquete
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {packageResult.assets.map((asset) => (
                    <div
                      key={asset.name}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={asset.previewUrl}
                          alt={asset.name}
                          className="h-7 w-7 rounded border border-slate-200 bg-white p-0.5 object-contain shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{asset.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{asset.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleAsset(asset)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-white transition-colors shrink-0"
                        title={`Descargar ${asset.name}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCode className="h-7 w-7 text-slate-500 shrink-0 p-1" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">site.webmanifest</p>
                        <p className="text-[10px] text-slate-500 truncate">Manifiesto web PWA</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCode className="h-7 w-7 text-slate-500 shrink-0 p-1" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">README.md</p>
                        <p className="text-[10px] text-slate-500 truncate">Instrucciones de instalación</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque de código HTML para integrar */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Código HTML de integración
                    </h4>
                    <p className="text-xs text-slate-500">
                      Copiá este bloque y pegalo dentro de la etiqueta <code className="text-slate-800 font-mono">&lt;head&gt;</code> de tu sitio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar código</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {packageResult.htmlCode}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
