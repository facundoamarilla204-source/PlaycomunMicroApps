export type AudioFormat = "mp3" | "wav" | "m4a" | "ogg"
export type OutputAudioFormat = "mp3" | "wav"

export interface AudioFileInfo {
  id: string
  file: File
  name: string
  size: number
  type: string
  format: AudioFormat
  duration: number // in seconds
  sampleRate: number
  numberOfChannels: number
  peaks: number[] // normalized waveform amplitudes 0..1
  previewUrl: string
}

export interface TrimRange {
  startTime: number // in seconds
  endTime: number // in seconds
}

export interface ExportSettings {
  format: OutputAudioFormat
  bitrate?: string // e.g. '192k' for mp3
}

export type ProcessingPhase =
  | "idle"
  | "loading-engine"
  | "preparing-file"
  | "cutting-audio"
  | "exporting"
  | "done"
  | "error"

export interface ProcessingProgress {
  phase: ProcessingPhase
  percent: number // 0 to 100
  message: string
  timeProcessed?: number
}

export interface ExportResult {
  blob: Blob
  url: string
  fileName: string
  size: number
  duration: number
  format: OutputAudioFormat
}
