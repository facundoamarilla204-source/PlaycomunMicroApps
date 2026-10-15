import { describe, it, expect } from "vitest"
import {
  formatTime,
  parseTimeToSeconds,
  splitSeconds,
  formatFileSize,
  getCleanBaseName,
} from "./format-utils"
import { detectAudioFormat } from "./audio-inspector"

describe("Audio Cutter - format-utils", () => {
  it("formats seconds to mm:ss.ms correctly", () => {
    expect(formatTime(0)).toBe("00:00.000")
    expect(formatTime(65.432)).toBe("01:05.432")
    expect(formatTime(125.05, false)).toBe("02:05")
    expect(formatTime(3600)).toBe("60:00.000")
  })

  it("splits and parses seconds accurately", () => {
    const parts = splitSeconds(75.5)
    expect(parts.mins).toBe(1)
    expect(parts.secs).toBe(15)
    expect(parts.ms).toBe(500)

    const parsed = parseTimeToSeconds(1, 15, 500)
    expect(parsed).toBe(75.5)
  })

  it("formats file sizes cleanly", () => {
    expect(formatFileSize(500)).toBe("500 B")
    expect(formatFileSize(1024 * 50)).toBe("50 KB")
    expect(formatFileSize(1024 * 1024 * 3.5)).toBe("3.5 MB")
  })

  it("extracts clean base name without extension", () => {
    expect(getCleanBaseName("mi_cancion.mp3")).toBe("mi_cancion")
    expect(getCleanBaseName("audio.final.wav")).toBe("audio.final")
    expect(getCleanBaseName("grabacion")).toBe("grabacion")
  })
})

describe("Audio Cutter - detectAudioFormat", () => {
  it("detects WAV from RIFF WAVE header bytes", async () => {
    const riff = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x41, 0x56, 0x45, // WAVE
    ])
    const file = new File([riff], "prueba.bin", { type: "" })
    const format = await detectAudioFormat(file)
    expect(format).toBe("wav")
  })

  it("detects MP3 from ID3 header bytes", async () => {
    const id3 = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00]) // ID3
    const file = new File([id3], "track.unknown", { type: "" })
    const format = await detectAudioFormat(file)
    expect(format).toBe("mp3")
  })

  it("detects OGG from OggS header bytes", async () => {
    const ogg = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00]) // OggS
    const file = new File([ogg], "audio.raw", { type: "" })
    const format = await detectAudioFormat(file)
    expect(format).toBe("ogg")
  })

  it("detects M4A from ftyp header bytes", async () => {
    const m4a = new Uint8Array([
      0x00, 0x00, 0x00, 0x20,
      0x66, 0x74, 0x79, 0x70, // ftyp
      0x4d, 0x34, 0x41, 0x20, // M4A 
    ])
    const file = new File([m4a], "sound.bin", { type: "" })
    const format = await detectAudioFormat(file)
    expect(format).toBe("m4a")
  })
})
