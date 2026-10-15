"use client"

import React, { useRef, useState, useEffect } from "react"
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Repeat,
} from "lucide-react"

interface AudioPlayerBarProps {
  previewUrl: string
  duration: number
  startTime: number
  endTime: number
  currentTime: number
  onTimeUpdate: (time: number) => void
  onResetRange: () => void
  disabled?: boolean
}

export function AudioPlayerBar({
  previewUrl,
  duration,
  startTime,
  endTime,
  currentTime,
  onTimeUpdate,
  onResetRange,
  disabled = false,
}: AudioPlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playMode, setPlayMode] = useState<"selection" | "all">("selection")
  const [isLooping, setIsLooping] = useState(false)
  const [volume, setVolume] = useState(1.0)
  const [isMuted, setIsMuted] = useState(false)

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Monitor time update to stop or loop when playing selection
  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return

    const now = audio.currentTime
    onTimeUpdate(now)

    if (playMode === "selection") {
      // Check if reached end boundary
      if (now >= endTime || now < startTime) {
        if (isLooping && isPlaying) {
          audio.currentTime = startTime
          audio.play().catch(() => {})
        } else {
          audio.pause()
          setIsPlaying(false)
          audio.currentTime = startTime
          onTimeUpdate(startTime)
        }
      }
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (playMode === "selection" && audioRef.current) {
      audioRef.current.currentTime = startTime
      onTimeUpdate(startTime)
    }
  }

  // Play selection specifically
  const handlePlaySelection = () => {
    const audio = audioRef.current
    if (!audio || disabled) return

    if (isPlaying && playMode === "selection") {
      audio.pause()
      setIsPlaying(false)
      return
    }

    setPlayMode("selection")
    // Start strictly at selection start if outside or ended
    if (audio.currentTime < startTime || audio.currentTime >= endTime) {
      audio.currentTime = startTime
    }
    audio.play().then(() => setIsPlaying(true)).catch(() => {})
  }

  // Play entire audio
  const handlePlayAll = () => {
    const audio = audioRef.current
    if (!audio || disabled) return

    if (isPlaying && playMode === "all") {
      audio.pause()
      setIsPlaying(false)
      return
    }

    setPlayMode("all")
    audio.play().then(() => setIsPlaying(true)).catch(() => {})
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={previewUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="auto"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Playback Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Play Selection Button */}
          <button
            type="button"
            onClick={handlePlaySelection}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold shadow-xs transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isPlaying && playMode === "selection" ? (
              <>
                <Pause className="h-4 w-4 fill-white" />
                <span>Pausar selección</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Escuchar selección</span>
              </>
            )}
          </button>

          {/* Play All Button */}
          <button
            type="button"
            onClick={handlePlayAll}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="Reproducir pista completa"
          >
            {isPlaying && playMode === "all" ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pausar todo</span>
              </>
            ) : (
              <>
                <FastForward className="h-3.5 w-3.5 text-slate-500" />
                <span>Escuchar todo</span>
              </>
            )}
          </button>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            disabled={disabled}
            className={`inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isLooping
                ? "bg-purple-100 text-brand border-purple-300"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Repetir selección en bucle"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bucle</span>
          </button>
        </div>

        {/* Reset & Volume Controls */}
        <div className="flex items-center gap-3">
          {/* Reset selection range to full audio */}
          <button
            type="button"
            onClick={onResetRange}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Seleccionar todo el audio desde el inicio hasta el final"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Seleccionar todo</span>
          </button>

          {/* Volume Controls */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-500 hover:text-slate-800 p-1 rounded-md"
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-red-500" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value))
                if (isMuted) setIsMuted(false)
              }}
              aria-label="Control de volumen"
              className="w-18 accent-brand h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
