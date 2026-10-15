"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  AudioFileInfo,
  ExportResult,
  OutputAudioFormat,
  ProcessingProgress,
  TrimRange,
} from "@/lib/audio-cutter/types"
import { inspectAudioFile } from "@/lib/audio-cutter/audio-inspector"
import { cutAndExportAudio } from "@/lib/audio-cutter/ffmpeg-service"
import { Dropzone } from "./Dropzone"
import { AudioInfoBar } from "./AudioInfoBar"
import { AudioWaveform } from "./AudioWaveform"
import { TimeControls } from "./TimeControls"
import { AudioPlayerBar } from "./AudioPlayerBar"
import { ExportPanel } from "./ExportPanel"
import { ProcessingStatus } from "./ProcessingStatus"
import { ResultView } from "./ResultView"
import { AlertCircle, Loader2 } from "lucide-react"

export function CortadorAudio() {
  const [audioInfo, setAudioInfo] = useState<AudioFileInfo | null>(null)
  const [range, setRange] = useState<TrimRange>({ startTime: 0, endTime: 0 })
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [outputFormat, setOutputFormat] = useState<OutputAudioFormat>("mp3")

  const [isInspecting, setIsInspecting] = useState(false)
  const [inspectError, setInspectError] = useState<string | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)

  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioInfo?.previewUrl) {
        URL.revokeObjectURL(audioInfo.previewUrl)
      }
      if (exportResult?.url) {
        URL.revokeObjectURL(exportResult.url)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [audioInfo, exportResult])

  // Handle file loading and inspection
  const handleFileSelected = async (file: File) => {
    // Clear previous errors
    setInspectError(null)
    setProcessError(null)
    setIsInspecting(true)

    // Revoke previous URLs
    if (audioInfo?.previewUrl) {
      URL.revokeObjectURL(audioInfo.previewUrl)
    }
    if (exportResult?.url) {
      URL.revokeObjectURL(exportResult.url)
    }
    setExportResult(null)

    try {
      const info = await inspectAudioFile(file)
      setAudioInfo(info)
      setRange({
        startTime: 0,
        endTime: Number(info.duration.toFixed(3)),
      })
      setCurrentTime(0)
    } catch (err: any) {
      setInspectError(
        err?.message || "Ocurrió un error al procesar el archivo de audio. Verificá que no esté dañado."
      )
      setAudioInfo(null)
    } finally {
      setIsInspecting(false)
    }
  }

  // Handle removing the audio file
  const handleRemoveFile = () => {
    if (audioInfo?.previewUrl) {
      URL.revokeObjectURL(audioInfo.previewUrl)
    }
    if (exportResult?.url) {
      URL.revokeObjectURL(exportResult.url)
    }
    setAudioInfo(null)
    setExportResult(null)
    setInspectError(null)
    setProcessError(null)
    setCurrentTime(0)
    setRange({ startTime: 0, endTime: 0 })
  }

  // Synchronized range update
  const handleRangeChange = (start: number, end: number) => {
    setRange({ startTime: start, endTime: end })
    // If current playhead is outside the new bounds, seek to start
    if (currentTime < start || currentTime > end) {
      setCurrentTime(start)
    }
  }

  // Handle seek from waveform
  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  // Execute cut and export with FFmpeg
  const handleExport = async () => {
    if (!audioInfo || isProcessing) return

    setProcessError(null)
    setIsProcessing(true)
    const controller = new AbortController()
    abortControllerRef.current = controller

    setProcessingProgress({
      phase: "loading-engine",
      percent: 10,
      message: "Iniciando motor FFmpeg en el navegador...",
    })

    try {
      const result = await cutAndExportAudio(
        audioInfo,
        range,
        { format: outputFormat },
        (progress) => {
          setProcessingProgress(progress)
        },
        controller.signal
      )

      // Clean previous result URL if existing
      if (exportResult?.url) {
        URL.revokeObjectURL(exportResult.url)
      }

      setExportResult(result)
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setProcessError("La operación fue cancelada por el usuario.")
      } else {
        setProcessError(
          err?.message || "Ocurrió un error inesperado al cortar el archivo de audio."
        )
      }
    } finally {
      setIsProcessing(false)
      setProcessingProgress(null)
      abortControllerRef.current = null
    }
  }

  // Cancel in-flight operation
  const handleCancelOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsProcessing(false)
    setProcessingProgress(null)
  }

  const selectedDuration = Math.max(0, range.endTime - range.startTime)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 font-sans">
      {/* 1. Initial State: Dropzone */}
      {!audioInfo && !isInspecting && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Dropzone
            onFileSelected={handleFileSelected}
            isLoading={isInspecting}
            error={inspectError}
          />
        </motion.div>
      )}

      {/* 2. Loading State: Inspecting Audio */}
      {isInspecting && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <Loader2 className="h-10 w-10 text-brand animate-spin" />
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-900">
              Analizando archivo de audio...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Decodificando señal y calculando forma de onda.
            </p>
          </div>
        </div>
      )}

      {/* 3. Editor State: Audio Loaded */}
      {audioInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* File Info Card with Replace/Remove actions */}
          <AudioInfoBar
            audioInfo={audioInfo}
            onReplaceFile={handleFileSelected}
            onRemoveFile={handleRemoveFile}
            disabled={isProcessing}
          />

          {/* Interactive Waveform with Handles & Playhead */}
          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Línea de tiempo y forma de onda
              </h4>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Arrastrá los controles violetas para delimitar el corte
              </span>
            </div>

            <AudioWaveform
              peaks={audioInfo.peaks}
              duration={audioInfo.duration}
              startTime={range.startTime}
              endTime={range.endTime}
              currentTime={currentTime}
              onRangeChange={handleRangeChange}
              onSeek={handleSeek}
              disabled={isProcessing}
            />
          </div>

          {/* Audio Player Controls */}
          <AudioPlayerBar
            previewUrl={audioInfo.previewUrl}
            duration={audioInfo.duration}
            startTime={range.startTime}
            endTime={range.endTime}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            onResetRange={() => handleRangeChange(0, audioInfo.duration)}
            disabled={isProcessing}
          />

          {/* Manual Numeric Inputs with Ms Precision */}
          <TimeControls
            duration={audioInfo.duration}
            startTime={range.startTime}
            endTime={range.endTime}
            onRangeChange={handleRangeChange}
            disabled={isProcessing}
          />

          {/* Processing Progress Overlay/Banner if active */}
          <AnimatePresence>
            {isProcessing && processingProgress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ProcessingStatus
                  progress={processingProgress}
                  onCancel={handleCancelOperation}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message if processing failed */}
          {processError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm animate-in fade-in">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {processError}
              </div>
            </div>
          )}

          {/* Completed Result View */}
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ResultView
                result={exportResult}
                onModify={() => setExportResult(null)}
                onNewFile={handleRemoveFile}
              />
            </motion.div>
          )}

          {/* Export Options & CTA (hidden while showing successful result to avoid confusion) */}
          {!exportResult && (
            <ExportPanel
              outputFormat={outputFormat}
              onFormatChange={setOutputFormat}
              onExport={handleExport}
              isProcessing={isProcessing}
              duration={audioInfo.duration}
              selectedDuration={selectedDuration}
            />
          )}
        </motion.div>
      )}
    </div>
  )
}
