"use client"

import React from "react"
import {
  ConversionOperationId,
  GlobalConversionConfig,
} from "@/lib/converter/types"
import { Sliders, HelpCircle, Layers, FileCheck } from "lucide-react"

interface OptionsPanelProps {
  operationId: ConversionOperationId
  config: GlobalConversionConfig
  onChangeConfig: (newConfig: GlobalConversionConfig) => void
  detectedPageCount?: number
}

export function OptionsPanel({
  operationId,
  config,
  onChangeConfig,
  detectedPageCount,
}: OptionsPanelProps) {
  // Only show options if the operation has customizable settings
  const hasOptions = [
    "images-to-pdf",
    "excel-to-pdf",
    "pdf-to-images",
    "pdf-to-pdfa",
  ].includes(operationId)

  if (!hasOptions) {
    return null
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-violet-600" />
          <h4 className="text-sm font-bold text-gray-900">
            Opciones de conversión
          </h4>
        </div>
        {detectedPageCount && detectedPageCount > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
            {detectedPageCount} {detectedPageCount === 1 ? "página detectada" : "páginas detectadas"}
          </span>
        )}
      </div>

      {/* 1. OPCIONES DE IMÁGENES A PDF */}
      {operationId === "images-to-pdf" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Orientación
            </label>
            <select
              value={config.imagesToPdf.orientation}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  imagesToPdf: {
                    ...config.imagesToPdf,
                    orientation: e.target.value as any,
                  },
                })
              }
              className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            >
              <option value="auto">Automática (según imagen)</option>
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Tamaño de página
            </label>
            <select
              value={config.imagesToPdf.pageSize}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  imagesToPdf: {
                    ...config.imagesToPdf,
                    pageSize: e.target.value as any,
                  },
                })
              }
              className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            >
              <option value="a4">A4 (Estándar)</option>
              <option value="letter">Carta (Letter)</option>
              <option value="fit">Ajustar al tamaño exacto</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Márgenes
            </label>
            <select
              value={config.imagesToPdf.margin}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  imagesToPdf: {
                    ...config.imagesToPdf,
                    margin: e.target.value as any,
                  },
                })
              }
              className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            >
              <option value="none">Sin margen</option>
              <option value="small">Estrecho (0.25 pulgadas)</option>
              <option value="normal">Normal (0.5 pulgadas)</option>
            </select>
          </div>
        </div>
      )}

      {/* 2. OPCIONES DE EXCEL A PDF */}
      {operationId === "excel-to-pdf" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Orientación de página
            </label>
            <select
              value={config.excelToPdf.orientation}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  excelToPdf: {
                    ...config.excelToPdf,
                    orientation: e.target.value as any,
                  },
                })
              }
              className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            >
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal (recomendada para tablas anchas)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Tamaño de papel
            </label>
            <select
              value={config.excelToPdf.paperSize}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  excelToPdf: {
                    ...config.excelToPdf,
                    paperSize: e.target.value as any,
                  },
                })
              }
              className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            >
              <option value="a4">A4</option>
              <option value="letter">Carta</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={config.excelToPdf.fitToPage}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    excelToPdf: {
                      ...config.excelToPdf,
                      fitToPage: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 h-4 w-4"
              />
              <span>Ajustar ancho de hoja en página</span>
            </label>
          </div>
        </div>
      )}

      {/* 3. OPCIONES DE PDF A IMÁGENES */}
      {operationId === "pdf-to-images" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Formato de imagen
              </label>
              <select
                value={config.pdfToImages.format}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    pdfToImages: {
                      ...config.pdfToImages,
                      format: e.target.value as any,
                    },
                  })
                }
                className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              >
                <option value="jpg">JPG (peso reducido, fotos y documentos)</option>
                <option value="png">PNG (máxima nitidez y gráficos)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Resolución / Calidad
              </label>
              <select
                value={config.pdfToImages.dpi}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    pdfToImages: {
                      ...config.pdfToImages,
                      dpi: parseInt(e.target.value, 10) as any,
                    },
                  })
                }
                className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              >
                <option value={150}>150 DPI (Equilibrada, recomendada)</option>
                <option value={300}>300 DPI (Alta resolución para imprimir)</option>
                <option value={72}>72 DPI (Rápida, pantallas pequeñas)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Páginas a convertir
              </label>
              <select
                value={config.pdfToImages.pageRange}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    pdfToImages: {
                      ...config.pdfToImages,
                      pageRange: e.target.value as any,
                    },
                  })
                }
                className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              >
                <option value="all">Todas las páginas</option>
                <option value="custom">Rango personalizado</option>
              </select>
            </div>
          </div>

          {config.pdfToImages.pageRange === "custom" && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Especificá las páginas o rangos (ej: 1, 3-5):
              </label>
              <input
                type="text"
                value={config.pdfToImages.customPageRange}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    pdfToImages: {
                      ...config.pdfToImages,
                      customPageRange: e.target.value,
                    },
                  })
                }
                placeholder="Ejemplo: 1-3, 5"
                className="w-full min-h-[44px] text-xs sm:text-sm bg-white border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              />
              <p className="text-xs text-slate-600">
                Separadas por comas. Usá guión para intervalos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. OPCIONES DE PDF A PDF/A */}
      {operationId === "pdf-to-pdfa" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Perfil de conformidad PDF/A
            </label>
            <select
              value={config.pdfToPdfA.conformance}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  pdfToPdfA: {
                    ...config.pdfToPdfA,
                    conformance: e.target.value as any,
                  },
                })
              }
              className="w-full min-h-[44px] text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-800 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            >
              <option value="PDF/A-1b">PDF/A-1b (Preservación visual básica, ISO 19005-1)</option>
              <option value="PDF/A-2b">PDF/A-2b (Soporte de capas y compresión moderna, ISO 19005-2)</option>
            </select>
          </div>
          <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex items-start gap-2 text-xs text-violet-900">
            <FileCheck className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
            <p>
              Incorpora el esquema de metadatos formal XMP y el perfil de color sRGB requerido para archivo legal e institucional a largo plazo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
