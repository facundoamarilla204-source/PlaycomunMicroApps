"use client"

import { useState, useRef, useEffect } from "react"
import { UploadCloud, Image as ImageIcon, Check, Copy, ArrowRight, Trash2, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react"
import { ExtractedColor } from "@/lib/color-palette/types"
import {
  extractDominantColorsFromImage,
  validateImageFile,
} from "@/lib/color-palette/image-quantizer"
import { copyToClipboard } from "@/lib/color-palette/palette-exporter"
import { getContrastingTextColor } from "@/lib/color-palette/color-converter"

interface ImageExtractorProps {
  onTransferToEditor: (colors: string[]) => void
}

export function ImageExtractor({ onTransferToEditor }: ImageExtractorProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState<number>(5)
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [transferred, setTransferred] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageElementRef = useRef<HTMLImageElement | null>(null)

  // Liberar URL de objeto al desmontar o cambiar de imagen
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const processImage = (file: File) => {
    setError(null)
    setTransferred(false)
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || "Archivo de imagen inválido.")
      return
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setImageFile(file)
    setImageUrl(objectUrl)
    setExtractedColors([])

    // Decodificar y analizar automáticamente
    setIsAnalyzing(true)
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        imageElementRef.current = img
        const results = extractDominantColorsFromImage(img, colorCount)
        setExtractedColors(results)
      } catch (err: any) {
        setError(err.message || "No se pudieron extraer los colores de la imagen.")
      } finally {
        setIsAnalyzing(false)
      }
    }

    img.onerror = () => {
      setError("No fue posible decodificar la imagen seleccionada. El archivo podría estar dañado.")
      setIsAnalyzing(false)
    }

    img.src = objectUrl
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) processImage(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const reanalyzeWithCount = (newCount: number) => {
    setColorCount(newCount)
    if (!imageElementRef.current) return

    setIsAnalyzing(true)
    setError(null)
    setTimeout(() => {
      try {
        const results = extractDominantColorsFromImage(imageElementRef.current!, newCount)
        setExtractedColors(results)
      } catch (err: any) {
        setError(err.message || "Error al recalcular colores.")
      } finally {
        setIsAnalyzing(false)
      }
    }, 40)
  }

  const handleClear = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageFile(null)
    setImageUrl(null)
    setExtractedColors([])
    setError(null)
    setTransferred(false)
    imageElementRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCopy = async (hex: string, index: number) => {
    const success = await copyToClipboard(hex)
    if (success) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1800)
    }
  }

  const handleTransfer = () => {
    if (extractedColors.length === 0) return
    const hexList = extractedColors.map((c) => c.hex)
    onTransferToEditor(hexList)
    setTransferred(true)
    setTimeout(() => setTransferred(false), 2500)
  }

  return (
    <div className="w-full space-y-8">
      {/* Zona de carga o vista previa */}
      {!imageUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-purple-600 bg-slate-50/70 hover:bg-purple-50/20 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all focus-within:ring-2 focus-within:ring-purple-600"
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          aria-label="Cargar imagen para extraer colores"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            Arrastrá una imagen o hacé clic para seleccionarla
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-3">
            Formatos admitidos: JPG, PNG o WebP (hasta 15 MB)
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-200/70 text-slate-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Procesamiento 100% privado en tu dispositivo (sin subir a servidores)</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate max-w-[240px] sm:max-w-md">
                  {imageFile?.name}
                </p>
                <p className="text-xs text-slate-500">
                  {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : ""} · Procesada localmente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => reanalyzeWithCount(colorCount)}
                disabled={isAnalyzing}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                title="Repetir análisis de color"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} aria-hidden="true" />
                <span>Reanalizar</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                title="Quitar imagen actual"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Quitar</span>
              </button>
            </div>
          </div>

          {/* Grid de imagen y controles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Vista previa en miniatura */}
            <div className="md:col-span-1 max-h-[220px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Vista previa de la imagen cargada"
                className="max-h-[200px] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Selector de cantidad de colores */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cantidad de colores a extraer ({colorCount} muestras):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => reanalyzeWithCount(n)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                        colorCount === n
                          ? "bg-purple-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                El algoritmo analiza los píxeles descartando la transparencia alfa y agrupa las tonalidades más representativas mediante cuantización de color.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de error si ocurre */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultados de colores extraídos */}
      {extractedColors.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Colores dominantes detectados ({extractedColors.length})
              </h3>
              <p className="text-xs text-slate-600">
                Porcentaje estimado de presencia en la composición de la imagen
              </p>
            </div>

            <button
              type="button"
              onClick={handleTransfer}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              {transferred ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                  <span>¡Transferida al editor!</span>
                </>
              ) : (
                <>
                  <span>Editar esta paleta</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {/* Grilla visual de colores extraídos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {extractedColors.map((item, index) => {
              const textColor = getContrastingTextColor(item.hex)
              const isCopied = copiedIndex === index

              return (
                <div
                  key={`${item.hex}-${index}`}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between shadow-2xs"
                >
                  {/* Muestra visual de color */}
                  <div
                    style={{ backgroundColor: item.hex }}
                    className="h-24 w-full p-2 flex items-start justify-between"
                  >
                    <span
                      style={{
                        color: textColor,
                        backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)",
                      }}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs"
                    >
                      ~{item.percentage}%
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.hex, index)}
                      title="Copiar código HEX"
                      style={{
                        color: textColor,
                        backgroundColor: textColor === "#FFFFFF" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)",
                      }}
                      className="p-1.5 rounded-md backdrop-blur-xs transition-transform active:scale-90 cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {/* Datos del color */}
                  <div className="p-2.5 text-center bg-white space-y-0.5">
                    <p className="font-mono font-bold text-xs text-slate-900">
                      {item.hex}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      RGB({item.rgb.r}, {item.rgb.g}, {item.rgb.b})
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
