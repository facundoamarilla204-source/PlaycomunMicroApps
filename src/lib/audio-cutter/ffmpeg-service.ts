import {
  AudioFileInfo,
  ExportResult,
  ExportSettings,
  ProcessingProgress,
  TrimRange,
} from "./types"
import { getCleanBaseName } from "./format-utils"

let ffmpegInstance: any = null
let isEngineLoading = false
let isEngineReady = false

/**
 * Dynamically loads /ffmpeg/ffmpeg.js if not already present on window
 */
async function loadFFmpegScript(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("FFmpeg solo puede ejecutarse en el navegador.")
  }

  if ((window as any).FFmpegWASM?.FFmpeg) {
    return (window as any).FFmpegWASM.FFmpeg
  }

  return new Promise((resolve, reject) => {
    // Check if script tag is already in DOM
    const existingScript = document.querySelector('script[src*="/ffmpeg/ffmpeg.js"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if ((window as any).FFmpegWASM?.FFmpeg) {
          resolve((window as any).FFmpegWASM.FFmpeg)
        } else {
          reject(new Error("No se encontró window.FFmpegWASM"))
        }
      })
      existingScript.addEventListener("error", () =>
        reject(new Error("Error al cargar /ffmpeg/ffmpeg.js"))
      )
      return
    }

    const script = document.createElement("script")
    script.src = "/ffmpeg/ffmpeg.js"
    script.async = true
    script.onload = () => {
      if ((window as any).FFmpegWASM?.FFmpeg) {
        resolve((window as any).FFmpegWASM.FFmpeg)
      } else {
        reject(new Error("No se encontró window.FFmpegWASM tras cargar el script"))
      }
    }
    script.onerror = () => {
      reject(new Error("No se pudo cargar el archivo /ffmpeg/ffmpeg.js desde los recursos locales."))
    }
    document.head.appendChild(script)
  })
}

/**
 * Returns or initializes the singleton FFmpeg instance using local static assets
 */
export async function getFFmpeg(
  onProgress?: (progress: ProcessingProgress) => void
): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("FFmpeg solo puede ejecutarse en el navegador.")
  }

  if (ffmpegInstance && isEngineReady) {
    return ffmpegInstance
  }

  if (isEngineLoading) {
    while (isEngineLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (ffmpegInstance && isEngineReady) return ffmpegInstance
  }

  isEngineLoading = true

  try {
    onProgress?.({
      phase: "loading-engine",
      percent: 15,
      message: "Cargando motor de procesamiento de audio...",
    })

    const FFmpegClass = await loadFFmpegScript()
    const ffmpeg = new FFmpegClass()

    const baseURL = `${window.location.origin}/ffmpeg`
    const coreURL = `${baseURL}/ffmpeg-core.js`
    const wasmURL = `${baseURL}/ffmpeg-core.wasm`

    onProgress?.({
      phase: "loading-engine",
      percent: 50,
      message: "Iniciando WebAssembly en segundo plano...",
    })

    await ffmpeg.load({
      coreURL,
      wasmURL,
    })

    ffmpegInstance = ffmpeg
    isEngineReady = true

    onProgress?.({
      phase: "loading-engine",
      percent: 100,
      message: "Motor listo para procesar.",
    })

    return ffmpeg
  } catch (err: any) {
    ffmpegInstance = null
    isEngineReady = false
    throw new Error(
      `No se pudo cargar el motor de audio en tu navegador: ${
        err?.message || "comprobá que WebAssembly esté habilitado."
      }`
    )
  } finally {
    isEngineLoading = false
  }
}

/**
 * Performs accurate audio cutting using FFmpeg.wasm
 */
export async function cutAndExportAudio(
  audioInfo: AudioFileInfo,
  range: TrimRange,
  settings: ExportSettings,
  onProgress?: (progress: ProcessingProgress) => void,
  abortSignal?: AbortSignal
): Promise<ExportResult> {
  const { startTime, endTime } = range
  const duration = Math.max(0.01, endTime - startTime)

  // 1. Get or load FFmpeg
  const ffmpeg = await getFFmpeg(onProgress)

  if (abortSignal?.aborted) {
    throw new DOMException("Operación cancelada por el usuario.", "AbortError")
  }

  onProgress?.({
    phase: "preparing-file",
    percent: 10,
    message: "Preparando archivo para el corte...",
  })

  // Unique names in FFmpeg virtual filesystem
  const jobId = Math.random().toString(36).substring(2, 9)
  const inputExt = audioInfo.format || "mp3"
  const outputExt = settings.format
  const inputFileName = `input_${jobId}.${inputExt}`
  const outputFileName = `output_${jobId}.${outputExt}`

  // Log accumulator for error diagnosis
  let lastLogs: string[] = []
  const logCallback = ({ message }: { message: string }) => {
    lastLogs.push(message)
    if (lastLogs.length > 20) lastLogs.shift()
  }

  // Progress callback
  const progressCallback = ({ progress, time }: { progress: number; time: number }) => {
    let calculatedPercent = Math.min(95, Math.max(15, Math.round(progress * 100)))
    if (time > 0 && duration > 0) {
      const timeSec = time > 1000 ? time / 1000000 : time
      calculatedPercent = Math.min(95, Math.max(15, Math.round((timeSec / duration) * 100)))
    }
    onProgress?.({
      phase: "cutting-audio",
      percent: calculatedPercent,
      message: `Cortando y procesando (${calculatedPercent}%)...`,
      timeProcessed: time > 0 ? time / 1000000 : undefined,
    })
  }

  ffmpeg.on("log", logCallback)
  ffmpeg.on("progress", progressCallback)

  try {
    // 2. Write input audio to virtual FS
    const fileBytes = new Uint8Array(await audioInfo.file.arrayBuffer())
    await ffmpeg.writeFile(inputFileName, fileBytes)

    if (abortSignal?.aborted) {
      throw new DOMException("Operación cancelada por el usuario.", "AbortError")
    }

    onProgress?.({
      phase: "cutting-audio",
      percent: 25,
      message: "Ejecutando corte con precisión temporal...",
    })

    // 3. Prepare FFmpeg args
    const startStr = startTime.toFixed(3)
    const durationStr = duration.toFixed(3)

    let args: string[] = []

    if (outputExt === "wav") {
      // Uncompressed 16-bit PCM WAV for lossless studio quality
      args = [
        "-ss",
        startStr,
        "-t",
        durationStr,
        "-i",
        inputFileName,
        "-c:a",
        "pcm_s16le",
        "-avoid_negative_ts",
        "make_zero",
        outputFileName,
      ]
    } else {
      // High-quality MP3 encoding (192k bitrate)
      args = [
        "-ss",
        startStr,
        "-t",
        durationStr,
        "-i",
        inputFileName,
        "-c:a",
        "libmp3lame",
        "-b:a",
        settings.bitrate || "192k",
        "-avoid_negative_ts",
        "make_zero",
        outputFileName,
      ]
    }

    const exitCode = await ffmpeg.exec(args)

    if (exitCode !== 0) {
      // If libmp3lame failed, fallback to native mp3 encoder
      if (
        outputExt === "mp3" &&
        lastLogs.some((l) => l.includes("libmp3lame") || l.includes("Unknown encoder"))
      ) {
        const fallbackArgs = [
          "-ss",
          startStr,
          "-t",
          durationStr,
          "-i",
          inputFileName,
          "-c:a",
          "mp3",
          "-b:a",
          "192k",
          outputFileName,
        ]
        const fallbackCode = await ffmpeg.exec(fallbackArgs)
        if (fallbackCode !== 0) {
          throw new Error(`FFmpeg error al codificar MP3: ${lastLogs.join(" \n")}`)
        }
      } else {
        throw new Error(
          `FFmpeg finalizó con error (código ${exitCode}): ${lastLogs.slice(-3).join(" - ")}`
        )
      }
    }

    if (abortSignal?.aborted) {
      throw new DOMException("Operación cancelada por el usuario.", "AbortError")
    }

    onProgress?.({
      phase: "exporting",
      percent: 96,
      message: "Generando archivo final...",
    })

    // 4. Read output file
    const outputData = (await ffmpeg.readFile(outputFileName)) as Uint8Array
    if (!outputData || outputData.length === 0) {
      throw new Error("El motor no produjo ningún archivo de salida.")
    }

    const mimeType = outputExt === "wav" ? "audio/wav" : "audio/mpeg"
    const blob = new Blob([outputData.buffer as ArrayBuffer], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const baseName = getCleanBaseName(audioInfo.name)
    const outFileName = `${baseName}-recortado.${outputExt}`

    onProgress?.({
      phase: "done",
      percent: 100,
      message: "¡Corte completado con éxito!",
    })

    return {
      blob,
      url,
      fileName: outFileName,
      size: blob.size,
      duration,
      format: outputExt,
    }
  } finally {
    ffmpeg.off("log", logCallback)
    ffmpeg.off("progress", progressCallback)

    try {
      await ffmpeg.deleteFile(inputFileName)
    } catch {}
    try {
      await ffmpeg.deleteFile(outputFileName)
    } catch {}
  }
}

/**
 * Resets or releases the FFmpeg instance if needed
 */
export async function terminateFFmpeg(): Promise<void> {
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate()
    } catch {}
    ffmpegInstance = null
    isEngineReady = false
    isEngineLoading = false
  }
}
