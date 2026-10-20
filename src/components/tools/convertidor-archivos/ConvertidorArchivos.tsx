"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  ConversionCategory,
  ConversionOperationId,
  FileItem,
  ConvertedResultItem,
  GlobalConversionConfig,
  WorkerHealthState,
  ConversionQuotaState,
} from "@/lib/converter/types"
import {
  CONVERSION_CATEGORIES,
  CONVERSION_OPERATIONS,
  getOperationById,
} from "@/lib/converter/operations"
import {
  validateFileForOperation,
  getFilenameWithoutExtension,
} from "@/lib/converter/utils"
import {
  convertImagesToPdf,
  convertPdfToImages,
  convertPdfToWord,
  convertPdfToExcel,
  convertPdfToPptx,
  convertPdfToPdfA,
  getPdfPageCount,
} from "@/lib/converter/pdf-engine"
import {
  checkWorkerHealth,
  convertOfficeDocumentWithWorker,
  fetchCurrentQuota,
  QuotaExceededError,
  FileTooLargeError,
} from "@/lib/converter/worker-client"

import { CategoryTabs } from "./CategoryTabs"
import { OperationSelector } from "./OperationSelector"
import { DropzoneConverter } from "./DropzoneConverter"
import { OptionsPanel } from "./OptionsPanel"
import { FileList } from "./FileList"
import { ResultsPanel } from "./ResultsPanel"
import { WorkerStatusNotice } from "./WorkerStatusNotice"
import { QuotaNotice } from "./QuotaNotice"

import {
  Play,
  AlertTriangle,
  Info,
  Lock,
  Loader2,
  Sparkles,
} from "lucide-react"

const DEFAULT_CONFIG: GlobalConversionConfig = {
  operationId: "images-to-pdf",
  imagesToPdf: {
    orientation: "auto",
    pageSize: "a4",
    margin: "none",
    combineIntoSinglePdf: true,
  },
  excelToPdf: {
    orientation: "portrait",
    paperSize: "a4",
    fitToPage: true,
  },
  pdfToImages: {
    format: "jpg",
    dpi: 150,
    pageRange: "all",
    customPageRange: "",
  },
  pdfToPdfA: {
    conformance: "PDF/A-1b",
  },
}

export function ConvertidorArchivos() {
  const [activeCategory, setActiveCategory] = useState<ConversionCategory>("to-pdf")
  const [selectedOperationId, setSelectedOperationId] =
    useState<ConversionOperationId>("images-to-pdf")
  const [files, setFiles] = useState<FileItem[]>([])
  const [config, setConfig] = useState<GlobalConversionConfig>(DEFAULT_CONFIG)
  const [isProcessing, setIsProcessing] = useState(false)
  const [allResults, setAllResults] = useState<ConvertedResultItem[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Quota state for server worker operations (5 Free, 100 Pro)
  const [quotaState, setQuotaState] = useState<ConversionQuotaState | null>(null)

  // Worker health status
  const [workerState, setWorkerState] = useState<WorkerHealthState | null>(null)
  const [isCheckingWorker, setIsCheckingWorker] = useState(false)

  const currentOperation = useMemo(
    () => getOperationById(selectedOperationId),
    [selectedOperationId]
  )

  const categoryOperations = useMemo(
    () => CONVERSION_OPERATIONS.filter((o) => o.category === activeCategory),
    [activeCategory]
  )

  // Fetch quota on mount and after conversions
  const refreshQuota = useCallback(async () => {
    try {
      const q = await fetchCurrentQuota()
      if (q) setQuotaState(q)
    } catch {
      // Ignore network errors
    }
  }, [])

  // Check worker health on mount and when selecting a worker-based operation
  const refreshWorkerHealth = useCallback(async () => {
    setIsCheckingWorker(true)
    try {
      const state = await checkWorkerHealth()
      setWorkerState(state)
    } finally {
      setIsCheckingWorker(false)
    }
  }, [])

  useEffect(() => {
    refreshWorkerHealth()
    refreshQuota()
  }, [refreshWorkerHealth, refreshQuota])

  // Auto re-check if worker is configured but waking up
  useEffect(() => {
    if (!workerState?.configured || workerState.online) return

    const timer = setTimeout(() => {
      refreshWorkerHealth()
    }, 6000)

    return () => clearTimeout(timer)
  }, [workerState, refreshWorkerHealth])

  // When changing category, switch selected operation to the first of that category
  const handleSelectCategory = (cat: ConversionCategory) => {
    setActiveCategory(cat)
    const firstOp = CONVERSION_OPERATIONS.find((o) => o.category === cat)
    if (firstOp) {
      setSelectedOperationId(firstOp.id)
      setFiles([])
      setAllResults([])
      setGlobalError(null)
    }
  }

  // When selecting an operation
  const handleSelectOperation = (id: ConversionOperationId) => {
    setSelectedOperationId(id)
    setFiles([])
    setAllResults([])
    setGlobalError(null)
  }

  // Inspect and add files with plan-aware validation
  const handleFilesSelected = async (newRawFiles: File[]) => {
    setGlobalError(null)
    const addedItems: FileItem[] = []
    const isPro = quotaState?.is_pro || false

    for (const file of newRawFiles) {
      const validation = validateFileForOperation(file, currentOperation, isPro)
      if (!validation.valid) {
        setGlobalError(validation.error || "Archivo no compatible.")
        continue
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const ext = file.name.split(".").pop()?.toLowerCase() || ""

      let pageCount: number | undefined

      // If PDF, detect page count
      if (ext === "pdf") {
        try {
          pageCount = await getPdfPageCount(file)
        } catch {
          // If encrypted or reading fails, handle safely
        }
      }

      addedItems.push({
        id,
        file,
        name: file.name,
        size: file.size,
        extension: ext,
        status: "idle",
        progress: 0,
        pageCount,
        results: [],
      })
    }

    if (currentOperation.allowMultipleFiles) {
      setFiles((prev) => [...prev, ...addedItems])
    } else {
      setFiles(addedItems.slice(0, 1))
    }
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setGlobalError(null)
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    setFiles((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const handleMoveDown = (index: number) => {
    if (index >= files.length - 1) return
    setFiles((prev) => {
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  const detectedPagesForPanel = useMemo(() => {
    if (files.length === 1 && files[0].pageCount) {
      return files[0].pageCount
    }
    return undefined
  }, [files])

  // Convert Process execution with reservation, options and receipt confirmation
  const handleStartConversion = async () => {
    if (files.length === 0) return
    setGlobalError(null)
    setIsProcessing(true)

    // Check worker requirement and quota if worker operation
    if (currentOperation.environment === "worker") {
      if (quotaState && quotaState.remaining <= 0) {
        setIsProcessing(false)
        setGlobalError(
          quotaState.is_pro
            ? "Has alcanzado el límite diario de 100 conversiones Pro para documentos de oficina. Tu cuota se reinicia a las 00:00 (hora argentina)."
            : "Has alcanzado el límite de 5 conversiones gratuitas de oficina de hoy. Tu cupo se reinicia a las 00:00 (hora argentina). Podés actualizar a Pro para obtener 100 conversiones diarias."
        )
        return
      }

      if (!workerState?.online || !workerState?.sofficeAvailable) {
        setIsProcessing(false)
        setGlobalError(
          "El servicio documental de LibreOffice no está disponible actualmente. Podés verificar el worker o probar nuestras conversiones locales en el navegador."
        )
        return
      }
    }

    const generatedResults: ConvertedResultItem[] = []

    try {
      if (currentOperation.id === "images-to-pdf") {
        // Multi-image to single PDF (Local client-side)
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "processing", progress: 30 }))
        )

        const rawFiles = files.map((f) => f.file)
        const pdfBlob = await convertImagesToPdf(rawFiles, config.imagesToPdf)

        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: "completed", progress: 100 }))
        )

        const baseFirst = getFilenameWithoutExtension(files[0].name)
        const downloadName = files.length > 1 ? `${baseFirst}_combinado.pdf` : `${baseFirst}.pdf`

        generatedResults.push({
          id: `res-${Date.now()}`,
          name: downloadName,
          size: pdfBlob.size,
          blob: pdfBlob,
          downloadUrl: "",
          format: "pdf",
        })
      } else {
        // Individual file conversions
        for (let idx = 0; idx < files.length; idx++) {
          const item = files[idx]

          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "processing", progress: 10 }
                : f
            )
          )

          const updateProgress = (pct: number) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id ? { ...f, progress: pct } : f
              )
            )
          }

          try {
            let resultBlob: Blob
            let resultName = ""
            let formatTag = ""
            const base = getFilenameWithoutExtension(item.name)

            if (currentOperation.id === "pdf-to-images") {
              const imagesList = await convertPdfToImages(
                item.file,
                config.pdfToImages,
                updateProgress
              )

              imagesList.forEach((img, i) => {
                generatedResults.push({
                  id: `res-${item.id}-${i}`,
                  name: img.name,
                  size: img.blob.size,
                  blob: img.blob,
                  downloadUrl: "",
                  pageNumber: img.page,
                  format: config.pdfToImages.format,
                })
              })

              setFiles((prev) =>
                prev.map((f) =>
                  f.id === item.id ? { ...f, status: "completed", progress: 100 } : f
                )
              )
              continue
            } else if (currentOperation.id === "pdf-to-word") {
              const res = await convertPdfToWord(item.file, updateProgress)
              resultBlob = res.blob
              resultName = `${base}.docx`
              formatTag = "docx"
            } else if (currentOperation.id === "pdf-to-excel") {
              const res = await convertPdfToExcel(item.file, updateProgress)
              resultBlob = res.blob
              resultName = `${base}.xlsx`
              formatTag = "xlsx"
            } else if (currentOperation.id === "pdf-to-ppt") {
              resultBlob = await convertPdfToPptx(item.file, updateProgress)
              resultName = `${base}.pptx`
              formatTag = "pptx"
            } else if (currentOperation.id === "pdf-to-pdfa") {
              resultBlob = await convertPdfToPdfA(item.file, config.pdfToPdfA)
              resultName = `${base}_pdfa.pdf`
              formatTag = "pdf"
            } else {
              // Office document to PDF via worker with options and atomic reservation
              const workerRes = await convertOfficeDocumentWithWorker(
                item.file,
                updateProgress,
                {
                  operationId: currentOperation.id,
                  excelToPdf: config.excelToPdf,
                }
              )
              resultBlob = workerRes.blob
              resultName = `${base}.pdf`
              formatTag = "pdf"

              if (workerRes.quota) {
                setQuotaState(workerRes.quota)
              } else {
                refreshQuota()
              }
            }

            generatedResults.push({
              id: `res-${item.id}`,
              name: resultName,
              size: resultBlob.size,
              blob: resultBlob,
              downloadUrl: "",
              format: formatTag,
            })

            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id ? { ...f, status: "completed", progress: 100 } : f
              )
            )
          } catch (fileErr: unknown) {
            let errorMsg = "Error durante la conversión."
            if (fileErr instanceof QuotaExceededError) {
              errorMsg = fileErr.message
              if (fileErr.quota) setQuotaState(fileErr.quota)
            } else if (fileErr instanceof FileTooLargeError) {
              errorMsg = fileErr.message
            } else if (fileErr instanceof Error) {
              errorMsg = fileErr.message
            }

            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? { ...f, status: "error", error: errorMsg, progress: 0 }
                  : f
              )
            )
          }
        }
      }

      setAllResults(generatedResults)
    } catch (globalErr: unknown) {
      const msg =
        globalErr instanceof Error
          ? globalErr.message
          : "Error durante el procesamiento."
      setGlobalError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetAll = () => {
    setFiles([])
    setAllResults([])
    setGlobalError(null)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans">
      {/* 1. Selector de Categoría (Scrollable en 320px) */}
      <section className="space-y-3">
        <CategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />
        <p className="text-xs sm:text-sm text-gray-500 px-1">
          {CONVERSION_CATEGORIES.find((c) => c.id === activeCategory)?.description}
        </p>
      </section>

      {/* 2. Cuadrícula de Operaciones Disponibles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Elegí la operación
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            {categoryOperations.length} opciones disponibles
          </span>
        </div>
        <OperationSelector
          operations={categoryOperations}
          selectedOperationId={selectedOperationId}
          onSelectOperation={handleSelectOperation}
        />
      </section>

      {/* 3. Panel de Cuota Gratis/Pro e Información de Límites */}
      <section>
        <QuotaNotice
          quota={quotaState}
          environment={currentOperation.environment}
          onSwitchToLocal={() => handleSelectCategory("to-images")}
        />
      </section>

      {/* 4. Aviso de Worker si aplica */}
      {currentOperation.environment === "worker" && (
        <WorkerStatusNotice
          workerState={workerState}
          isChecking={isCheckingWorker}
          onRecheck={refreshWorkerHealth}
        />
      )}

      {/* 5. Aviso de limitaciones de la operación si existe */}
      {currentOperation.limitationsNotice && (
        <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-100 flex items-start gap-2.5 text-xs text-violet-900">
          <Info className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-violet-950">Nota técnica: </strong>
            {currentOperation.limitationsNotice}
          </p>
        </div>
      )}

      {/* 6. Carga de Archivos */}
      <section className="space-y-4">
        <DropzoneConverter
          operation={currentOperation}
          onFilesSelected={handleFilesSelected}
          disabled={isProcessing}
          isPro={quotaState?.is_pro || false}
        />

        {/* Lista de archivos en cola */}
        <FileList
          files={files}
          onRemoveFile={handleRemoveFile}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          allowReorder={currentOperation.id === "images-to-pdf"}
          disabled={isProcessing}
        />
      </section>

      {/* 7. Panel de Opciones */}
      {files.length > 0 && (
        <OptionsPanel
          operationId={selectedOperationId}
          config={config}
          onChangeConfig={setConfig}
          detectedPageCount={detectedPagesForPanel}
        />
      )}

      {/* Error Global */}
      {globalError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">No se pudo completar la operación</p>
            <p className="leading-relaxed">{globalError}</p>
          </div>
        </div>
      )}

      {/* 8. Botón de Acción Principal */}
      {files.length > 0 && allResults.length === 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleStartConversion}
            disabled={isProcessing || (currentOperation.environment === "worker" && quotaState?.remaining === 0)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm sm:text-base shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span>Procesando archivos...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                <span>Convertir {files.length === 1 ? "archivo" : `${files.length} archivos`}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 9. Panel de Resultados */}
      {allResults.length > 0 && (
        <ResultsPanel
          results={allResults}
          originalName={files[0]?.name || "documento"}
          onReset={handleResetAll}
        />
      )}

      {/* Privacidad y Garantía */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Privacidad garantizada:</strong> Las conversiones de PDF e imágenes se procesan de forma 100% local en tu navegador. Tus documentos de oficina se procesan en memoria efímera y se eliminan inmediatamente tras la descarga.
          </span>
        </div>
        <span className="text-gray-400 font-mono shrink-0">v1.1 · PlayComun</span>
      </div>
    </div>
  )
}
