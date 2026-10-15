import { AudioFileInfo, AudioFormat } from "./types"

export const MAX_AUDIO_FILE_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB
export const MAX_AUDIO_FILE_SIZE_LABEL = "100 MB"

/**
 * Detects audio format by examining magic bytes and filename fallback
 */
export async function detectAudioFormat(file: File): Promise<AudioFormat> {
  const slice = file.slice(0, 32)
  const buffer = await slice.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // 1. WAV: 'RIFF' .... 'WAVE'
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return "wav"
  }

  // 2. OGG: 'OggS'
  if (
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return "ogg"
  }

  // 3. MP3: ID3 tag or sync frame 0xFF followed by 0xFB/0xF3/0xF2
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || // ID3
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) // MPEG frame sync
  ) {
    return "mp3"
  }

  // 4. M4A / MP4: 'ftyp' at offset 4
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return "m4a"
  }

  // Fallback to extension or MIME type
  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith(".wav") || file.type.includes("wav")) return "wav"
  if (lowerName.endsWith(".mp3") || file.type.includes("mpeg") || file.type.includes("mp3")) return "mp3"
  if (lowerName.endsWith(".ogg") || file.type.includes("ogg")) return "ogg"
  if (lowerName.endsWith(".m4a") || lowerName.endsWith(".aac") || file.type.includes("mp4") || file.type.includes("aac")) return "m4a"

  throw new Error(
    "Formato de audio no reconocido. La herramienta admite archivos MP3, WAV, M4A y OGG."
  )
}

/**
 * Extracts downsampled peak amplitudes (0 to 1) for visual waveform
 */
function extractPeaks(audioBuffer: AudioBuffer, targetCount = 240): number[] {
  const channelData = audioBuffer.getChannelData(0)
  const totalSamples = channelData.length
  const step = Math.floor(totalSamples / targetCount)
  const peaks: number[] = []

  if (step <= 0) {
    return Array(targetCount).fill(0.2)
  }

  let maxPeak = 0
  for (let i = 0; i < targetCount; i++) {
    const start = i * step
    const end = Math.min(start + step, totalSamples)
    let min = 1.0
    let max = -1.0

    for (let j = start; j < end; j += 4) { // sampling every 4 samples for speed
      const val = channelData[j]
      if (val < min) min = val
      if (val > max) max = val
    }

    const amplitude = Math.max(Math.abs(min), Math.abs(max))
    if (amplitude > maxPeak) maxPeak = amplitude
    peaks.push(amplitude)
  }

  // Normalize peaks between 0.05 and 1.0
  const normalizer = maxPeak > 0 ? 1.0 / maxPeak : 1.0
  return peaks.map((p) => Math.max(0.08, Math.min(1.0, p * normalizer)))
}

/**
 * Inspects, decodes and computes waveform from an audio File using Web Audio API
 */
export async function inspectAudioFile(file: File): Promise<AudioFileInfo> {
  // 1. Check size limit
  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new Error(
      `El archivo supera el límite de ${MAX_AUDIO_FILE_SIZE_LABEL}. Para garantizar un rendimiento óptimo en el navegador, subí archivos de hasta ${MAX_AUDIO_FILE_SIZE_LABEL}.`
    )
  }

  if (file.size < 100) {
    throw new Error("El archivo de audio está vacío o corrupto.")
  }

  // 2. Validate format
  const format = await detectAudioFormat(file)

  // 3. Decode audio using Web Audio API
  let audioContext: AudioContext | null = null
  let audioBuffer: AudioBuffer | null = null

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) {
      throw new Error("Tu navegador no soporta Web Audio API para procesar sonido.")
    }

    audioContext = new AudioContextClass()
    const arrayBuffer = await file.arrayBuffer()
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  } catch (err: any) {
    throw new Error(
      `No se pudo decodificar el audio: ${err?.message || "el archivo puede estar dañado o en un formato no estándar."}`
    )
  } finally {
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close().catch(() => {})
    }
  }

  if (!audioBuffer || audioBuffer.duration <= 0) {
    throw new Error("No se detectó duración válida en el archivo de audio.")
  }

  const peaks = extractPeaks(audioBuffer)
  const previewUrl = URL.createObjectURL(file)

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type || `audio/${format}`,
    format,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    peaks,
    previewUrl,
  }
}
