"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  UploadCloud,
  Camera,
  Scissors,
  Layers,
  RotateCw,
  RotateCcw,
  Trash2,
  Download,
  RotateCcw as ResetIcon,
  Plus,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Lock,
} from "lucide-react"
import {
  DocumentPage,
  LoadedPdfFile,
} from "@/lib/pdf-editor/types"
import {
  loadPdfFile,
  renderPdfThumbnail,
  exportCombinedPdf,
  formatBytes,
} from "@/lib/pdf-editor/pdf-engine"
import { InitialChoiceView } from "./InitialChoiceView"
import { PageGrid } from "./PageGrid"
import { SourceFilesModal } from "./SourceFilesModal"
import { SplitModal } from "./SplitModal"
import { ConfirmationModal } from "./ConfirmationModal"
import { PagePreviewModal } from "./PagePreviewModal"
import { CameraScannerModal } from "./CameraScannerModal"

export function OrdenarPdf() {
  // State for files and pages
  const [sourceFiles, setSourceFiles] = useState<LoadedPdfFile[]>([])
  const [pages, setPages] = useState<DocumentPage[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Loading & notification states
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modals state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false)
  const [isSourceFilesModalOpen, setIsSourceFilesModalOpen] = useState<boolean>(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false)
  const [previewPage, setPreviewPage] = useState<DocumentPage | null>(null)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    confirmText?: string
    danger?: boolean
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    description: "",
    danger: true,
    onConfirm: () => {},
  })

  // Password prompt state for protected PDFs
  const [passwordPrompt, setPasswordPrompt] = useState<{
    file: File | null
    fileId: string
    colorIndex: number
  } | null>(null)
  const [passwordInput, setPasswordInput] = useState<string>("")

  // Hidden file input for appending more PDFs
  const appendFileInputRef = useRef<HTMLInputElement>(null)
  const photoUploadInputRef = useRef<HTMLInputElement>(null)

  // Scanner modal startup config
  const [scannerInitialStep, setScannerInitialStep] = useState<"capture" | "qr_connect" | "file_upload">("capture")
  const [scannerInitialFiles, setScannerInitialFiles] = useState<File[]>([])

  // Clear notifications after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Progressive thumbnail rendering queue
  useEffect(() => {
    let isCancelled = false

    const renderMissingThumbnails = async () => {
      // Find pages without thumbnail
      const missingIndex = pages.findIndex((p) => !p.thumbnailUrl && !p.isScanned)
      if (missingIndex === -1) return

      const pageToRender = pages[missingIndex]
      const sourceFile = sourceFiles.find((f) => f.id === pageToRender.sourceFileId)
      if (!sourceFile) return

      try {
        const thumbUrl = await renderPdfThumbnail(
          sourceFile.arrayBuffer,
          pageToRender.originalPageIndex,
          240
        )

        if (!isCancelled) {
          setPages((prevPages) =>
            prevPages.map((p) =>
              p.id === pageToRender.id ? { ...p, thumbnailUrl: thumbUrl } : p
            )
          )
        }
      } catch {
        // Thumbnail generation error fallback
      }
    }

    renderMissingThumbnails()

    return () => {
      isCancelled = true
    }
  }, [pages, sourceFiles])

  // Load new PDF files
  const handleLoadFiles = useCallback(
    async (fileList: FileList | File[], password?: string) => {
      setIsLoadingFiles(true)
      setErrorMessage(null)

      const filesArray = Array.from(fileList)
      const imageFiles = filesArray.filter(
        (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(f.name)
      )
      const validPdfFiles = filesArray.filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      )

      if (validPdfFiles.length === 0 && imageFiles.length > 0) {
        setScannerInitialFiles(imageFiles)
        setScannerInitialStep("file_upload")
        setIsCameraModalOpen(true)
        setIsLoadingFiles(false)
        return
      }

      if (validPdfFiles.length === 0) {
        setErrorMessage("Por favor seleccioná archivos en formato PDF o imágenes de documentos.")
        setIsLoadingFiles(false)
        return
      }

      try {
        const newLoadedFiles: LoadedPdfFile[] = []
        const newPages: DocumentPage[] = []

        let colorOffset = sourceFiles.length

        for (const file of validPdfFiles) {
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
          try {
            const { file: loaded, pages: loadedPages } = await loadPdfFile(
              file,
              fileId,
              colorOffset++,
              password
            )
            newLoadedFiles.push(loaded)
            newPages.push(...loadedPages)
          } catch (err: any) {
            if (err?.message?.includes("contraseña")) {
              setPasswordPrompt({ file, fileId, colorIndex: colorOffset })
              setIsLoadingFiles(false)
              return
            }
            throw err
          }
        }

        setSourceFiles((prev) => [...prev, ...newLoadedFiles])
        setPages((prev) => [...prev, ...newPages])
        setSuccessMessage(
          `Se ${newPages.length === 1 ? "cargó 1 página" : `cargaron ${newPages.length} páginas`} con éxito.`
        )
      } catch (err: any) {
        setErrorMessage(err?.message || "No se pudo procesar uno o más archivos PDF.")
      } finally {
        setIsLoadingFiles(false)
      }
    },
    [sourceFiles]
  )

  // Handle password submission for protected PDF
  const handleUnlockPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordPrompt || !passwordPrompt.file) return

    const { file } = passwordPrompt
    setPasswordPrompt(null)
    const pwd = passwordInput
    setPasswordInput("")

    await handleLoadFiles([file], pwd)
  }

  // Import scanned pages from camera
  const handleImportScannedPages = (scannedPages: DocumentPage[]) => {
    setPages((prev) => [...prev, ...scannedPages])
    setSuccessMessage(
      `Se agregaron ${scannedPages.length} ${scannedPages.length === 1 ? "página escaneada" : "páginas escaneadas"} a la mesa de trabajo.`
    )
  }

  // Page reordering (Drag & Drop or buttons)
  const handleReorder = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex >= pages.length) return
    const updated = [...pages]
    const [moved] = updated.splice(sourceIndex, 1)
    updated.splice(targetIndex, 0, moved)
    setPages(updated)
  }

  const handleMoveLeft = (pageId: string) => {
    const idx = pages.findIndex((p) => p.id === pageId)
    if (idx > 0) handleReorder(idx, idx - 1)
  }

  const handleMoveRight = (pageId: string) => {
    const idx = pages.findIndex((p) => p.id === pageId)
    if (idx < pages.length - 1) handleReorder(idx, idx + 1)
  }

  // Rotation controls
  const handleRotateCw = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, customRotation: (p.customRotation + 90) % 360 } : p
      )
    )
  }

  const handleRotateCcw = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, customRotation: (p.customRotation - 90 + 360) % 360 } : p
      )
    )
  }

  // Selection toggle
  const handleToggleSelect = (pageId: string) => {
    const next = new Set(selectedIds)
    if (next.has(pageId)) next.delete(pageId)
    else next.add(pageId)
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === pages.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pages.map((p) => p.id)))
    }
  }

  // Batch rotate selected
  const handleRotateSelectedCw = () => {
    if (selectedIds.size === 0) return
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, customRotation: (p.customRotation + 90) % 360 } : p
      )
    )
  }

  const handleRotateSelectedCcw = () => {
    if (selectedIds.size === 0) return
    setPages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, customRotation: (p.customRotation - 90 + 360) % 360 } : p
      )
    )
  }

  // Delete page with safety validation (allows deleting down to 0)
  const handleDeletePage = (pageId: string) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId)
    setConfirmDialog({
      isOpen: true,
      title: "¿Eliminar esta página?",
      description: `Se quitará la página ${pageIndex + 1} de la composición actual.\nEl documento original no será alterado.`,
      confirmText: "Quitar página",
      onConfirm: () => {
        const remaining = pages.filter((p) => p.id !== pageId)
        setPages(remaining)
        const nextSelected = new Set(selectedIds)
        nextSelected.delete(pageId)
        setSelectedIds(nextSelected)
        if (remaining.length === 0) {
          setSourceFiles([])
          setPreviewPage(null)
        }
        setSuccessMessage("Página eliminada de la composición.")
      },
    })
  }

  // Delete batch selected pages (allows deleting all)
  const handleDeleteSelected = () => {
    const countToDelete = selectedIds.size
    if (countToDelete === 0) return

    setConfirmDialog({
      isOpen: true,
      title: `¿Eliminar ${countToDelete} ${countToDelete === 1 ? "página seleccionada" : "páginas seleccionadas"}?`,
      description: "Se quitarán de la composición actual.\nTus archivos originales en disco permanecerán intactos.",
      confirmText: `Eliminar ${countToDelete} páginas`,
      onConfirm: () => {
        const remaining = pages.filter((p) => !selectedIds.has(p.id))
        setPages(remaining)
        setSelectedIds(new Set())
        if (remaining.length === 0) {
          setSourceFiles([])
          setPreviewPage(null)
        }
        setSuccessMessage(`Se eliminaron ${countToDelete} páginas.`)
      },
    })
  }

  // Extract selected pages as a new PDF
  const handleExtractSelected = async () => {
    if (selectedIds.size === 0) return

    const selectedPagesList = pages.filter((p) => selectedIds.has(p.id))
    try {
      setIsExporting(true)
      const blob = await exportCombinedPdf(selectedPagesList, sourceFiles)

      const baseName = sourceFiles.length > 0 ? sourceFiles[0].name.replace(/\.pdf$/i, "") : "documento"
      const fileName = `${baseName}_paginas_extraidas.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage(
        `¡Páginas extraídas con éxito! Se descargó "${fileName}" (${selectedPagesList.length} páginas, ${formatBytes(blob.size)}).`
      )
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al extraer las páginas seleccionadas.")
    } finally {
      setIsExporting(false)
    }
  }

  // Main Export CTA (Download ordered combined PDF)
  const handleExportFullPdf = async () => {
    if (pages.length === 0) return
    try {
      setIsExporting(true)
      setErrorMessage(null)

      const blob = await exportCombinedPdf(pages, sourceFiles)

      const baseName = sourceFiles.length > 0 ? sourceFiles[0].name.replace(/\.pdf$/i, "") : "documento"
      const fileName = `${baseName}_ordenado.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage(
        `¡Documento generado con éxito! ${pages.length} páginas • ${formatBytes(blob.size)}.`
      )
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al compilar el documento PDF.")
    } finally {
      setIsExporting(false)
    }
  }

  // Source files reordering
  const handleReorderFiles = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx >= sourceFiles.length) return
    const updated = [...sourceFiles]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    setSourceFiles(updated)

    // Reorganize pages to match the new file order
    const pagesByFile = new Map<string, DocumentPage[]>()
    for (const f of updated) {
      pagesByFile.set(f.id, [])
    }
    // Also support scanned pages
    const scannedPages: DocumentPage[] = []

    for (const p of pages) {
      if (p.isScanned) {
        scannedPages.push(p)
      } else if (pagesByFile.has(p.sourceFileId)) {
        pagesByFile.get(p.sourceFileId)!.push(p)
      }
    }

    const reorderedPages: DocumentPage[] = []
    for (const f of updated) {
      const filePages = pagesByFile.get(f.id) || []
      reorderedPages.push(...filePages)
    }
    reorderedPages.push(...scannedPages)

    setPages(reorderedPages)
  }

  // Remove a source file
  const handleRemoveSourceFile = (fileId: string) => {
    const fileToRemove = sourceFiles.find((f) => f.id === fileId)
    if (!fileToRemove) return

    setConfirmDialog({
      isOpen: true,
      title: `¿Quitar archivo "${fileToRemove.name}"?`,
      description: `Se eliminarán todas las páginas asociadas a este documento de la mesa de trabajo.`,
      confirmText: "Quitar archivo",
      onConfirm: () => {
        setSourceFiles((prev) => prev.filter((f) => f.id !== fileId))
        setPages((prev) => prev.filter((p) => p.sourceFileId !== fileId))
        setSuccessMessage(`Se quitó "${fileToRemove.name}" del lote.`)
      },
    })
  }

  // Reset entire workbench
  const handleResetWorkbench = () => {
    setConfirmDialog({
      isOpen: true,
      title: "¿Empezar de nuevo?",
      description: "Se limpiará la mesa de trabajo actual para que puedas cargar documentos nuevos.",
      confirmText: "Limpiar mesa",
      danger: false,
      onConfirm: () => {
        setSourceFiles([])
        setPages([])
        setSelectedIds(new Set())
        setErrorMessage(null)
        setSuccessMessage(null)
      },
    })
  }

  return (
    <div className="w-full">
      {/* Mensaje de Error */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Atención</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600 p-1"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje de Éxito */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="font-medium">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-600 p-1"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Contraseña para PDFs protegidos */}
      {passwordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">PDF con contraseña</h3>
                <p className="text-xs text-gray-500 truncate max-w-xs">{passwordPrompt.file?.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Este documento está cifrado. Para poder leer sus páginas y organizarlo, ingresá su contraseña.
            </p>

            <form onSubmit={handleUnlockPassword} className="space-y-4">
              <input
                type="password"
                placeholder="Contraseña del PDF"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordPrompt(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 shadow-sm"
                >
                  Desbloquear y cargar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Input oculto para subir fotos directas */}
      <input
        ref={photoUploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const arr = Array.from(e.target.files)
            setScannerInitialFiles(arr)
            setScannerInitialStep("file_upload")
            setIsCameraModalOpen(true)
            e.target.value = ""
          }
        }}
      />

      {/* VISTA 1: INICIAL SIN DOCUMENTOS */}
      {pages.length === 0 ? (
        <InitialChoiceView
          onFilesSelected={handleLoadFiles}
          onStartCamera={() => {
            setScannerInitialStep("capture")
            setScannerInitialFiles([])
            setIsCameraModalOpen(true)
          }}
          onStartUploadPhotos={() => photoUploadInputRef.current?.click()}
          onStartQrScan={() => {
            setScannerInitialStep("qr_connect")
            setScannerInitialFiles([])
            setIsCameraModalOpen(true)
          }}
          isLoading={isLoadingFiles}
        />
      ) : (
        /* VISTA 2: MESA DE TRABAJO COMPLETA (WORKBENCH) */
        <div className="space-y-6">
          {/* BARRA SUPERIOR DE ACCIONES Y ESTADÍSTICAS */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
            {/* Resumen de documento */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-600" />
                {pages.length} {pages.length === 1 ? "página" : "páginas"}
              </span>

              <span className="text-gray-300">•</span>

              <span className="text-gray-600">
                {sourceFiles.length} {sourceFiles.length === 1 ? "archivo PDF" : "archivos PDF"}
              </span>

              {sourceFiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsSourceFilesModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Layers className="h-3.5 w-3.5" /> Orden de archivos ({sourceFiles.length})
                </button>
              )}
            </div>

            {/* Botones de acción principales */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Añadir más PDFs */}
              <input
                ref={appendFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleLoadFiles(e.target.files)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => appendFileInputRef.current?.click()}
                disabled={isLoadingFiles}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:border-violet-500 hover:text-violet-700 text-gray-700 text-xs font-semibold transition-colors shadow-2xs"
                title="Añadir más archivos PDF para combinar"
              >
                <Plus className="h-3.5 w-3.5" /> Añadir PDFs
              </button>

              {/* Botón Escanear con cámara o celular */}
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:border-violet-500 hover:text-violet-700 text-gray-700 text-xs font-semibold transition-colors shadow-2xs"
                title="Escanear hojas con la cámara, conectar celular vía QR o reconocer texto con OCR"
              >
                <Camera className="h-3.5 w-3.5 text-violet-600" /> Escanear / OCR
              </button>

              {/* Dividir PDF */}
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:border-violet-500 hover:text-violet-700 text-gray-700 text-xs font-semibold transition-colors shadow-2xs"
                title="Dividir en partes iguales o por rangos"
              >
                <Scissors className="h-3.5 w-3.5 text-violet-600" /> Dividir PDF
              </button>

              {/* Empezar de nuevo */}
              <button
                type="button"
                onClick={handleResetWorkbench}
                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Limpiar y empezar de nuevo"
                aria-label="Limpiar mesa de trabajo"
              >
                <ResetIcon className="h-4 w-4" />
              </button>

              {/* Descargar PDF Principal */}
              <button
                type="button"
                disabled={isExporting || pages.length === 0}
                onClick={handleExportFullPdf}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Compilando PDF..." : "Descargar PDF Ordenado"}
              </button>
            </div>
          </div>

          {/* BARRA FLOTANTE / CONTEXTUAL PARA SELECCIÓN MÚLTIPLE */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gray-900 text-white rounded-2xl shadow-md text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium transition-colors"
              >
                {selectedIds.size === pages.length ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-violet-400" /> Deseleccionar todas
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" /> Seleccionar todas
                  </>
                )}
              </button>

              <span className="text-gray-400">
                {selectedIds.size} de {pages.length} seleccionadas
              </span>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateSelectedCcw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
                  title="Rotar antihorario (-90°)"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> -90°
                </button>

                <button
                  type="button"
                  onClick={handleRotateSelectedCw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
                  title="Rotar horario (+90°)"
                >
                  <RotateCw className="h-3.5 w-3.5" /> +90°
                </button>

                <button
                  type="button"
                  onClick={handleExtractSelected}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors shadow-2xs"
                  title="Crear un PDF nuevo únicamente con las páginas elegidas"
                >
                  <FileDown className="h-3.5 w-3.5" /> Extraer seleccionadas
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
                  title="Quitar páginas seleccionadas"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar ({selectedIds.size})
                </button>
              </div>
            )}
          </div>

          {/* ÁREA PRINCIPAL: CUADRÍCULA DE PÁGINAS (DRAG & DROP + TÁCTIL) */}
          <div className="bg-gray-50/70 p-4 sm:p-6 rounded-2xl border border-gray-200/80">
            <PageGrid
              pages={pages}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onRotateCw={handleRotateCw}
              onRotateCcw={handleRotateCcw}
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
              onDelete={handleDeletePage}
              onZoom={(page) => setPreviewPage(page)}
              onReorder={handleReorder}
            />
          </div>

          {/* BARRA FLOTANTE MÓVIL INFERIOR PARA DESCARGA RÁPIDA */}
          <div className="lg:hidden sticky bottom-4 z-30 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-xl flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-gray-900">{pages.length} páginas</span>
              <p className="text-[10px] text-gray-500">Orden listas para exportar</p>
            </div>
            <button
              type="button"
              disabled={isExporting || pages.length === 0}
              onClick={handleExportFullPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Generando..." : "Descargar PDF"}
            </button>
          </div>
        </div>
      )}

      {/* MODALES DEL SISTEMA */}
      <SourceFilesModal
        isOpen={isSourceFilesModalOpen}
        onClose={() => setIsSourceFilesModalOpen(false)}
        files={sourceFiles}
        onReorderFiles={handleReorderFiles}
        onRemoveFile={handleRemoveSourceFile}
        onAddFiles={handleLoadFiles}
      />

      <SplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        pages={pages}
        sourceFiles={sourceFiles}
      />

      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false)
          setScannerInitialFiles([])
        }}
        onImportToWorkbench={handleImportScannedPages}
        initialStep={scannerInitialStep}
        initialFiles={scannerInitialFiles}
      />

      <PagePreviewModal
        page={previewPage}
        currentIndex={pages.findIndex((p) => p.id === previewPage?.id)}
        totalCount={pages.length}
        onClose={() => setPreviewPage(null)}
        onRotateCw={handleRotateCw}
        onRotateCcw={handleRotateCcw}
        onDelete={handleDeletePage}
      />

      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        danger={confirmDialog.danger ?? true}
      />
    </div>
  )
}
