"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { formatTime } from "@/lib/audio-cutter/format-utils"
import { GripVertical } from "lucide-react"

interface AudioWaveformProps {
  peaks: number[]
  duration: number
  startTime: number
  endTime: number
  currentTime: number
  onRangeChange: (start: number, end: number) => void
  onSeek: (time: number) => void
  disabled?: boolean
}

type DragTarget = "start" | "end" | "middle" | null

export function AudioWaveform({
  peaks,
  duration,
  startTime,
  endTime,
  currentTime,
  onRangeChange,
  onSeek,
  disabled = false,
}: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [activeDrag, setActiveDrag] = useState<DragTarget>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [initialRange, setInitialRange] = useState({ start: startTime, end: endTime })

  // Clamp helper
  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val))

  // Convert pixel X into time in seconds
  const pixelToTime = useCallback(
    (pixelX: number, width: number) => {
      if (width <= 0 || duration <= 0) return 0
      const ratio = clamp(pixelX / width, 0, 1)
      return ratio * duration
    },
    [duration]
  )

  // Convert time in seconds into pixel percentage (0..100)
  const timeToPercent = useCallback(
    (time: number) => {
      if (duration <= 0) return 0
      return clamp((time / duration) * 100, 0, 100)
    },
    [duration]
  )

  // Draw waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !peaks || peaks.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const barCount = peaks.length
    const totalGap = (barCount - 1) * 2
    const availableWidth = width - totalGap
    const barWidth = Math.max(1.5, availableWidth / barCount)
    const gap = 2

    const startPercent = timeToPercent(startTime) / 100
    const endPercent = timeToPercent(endTime) / 100
    const startX = startPercent * width
    const endX = endPercent * width

    // Draw active background tint for selected cut range
    ctx.fillStyle = "rgba(124, 58, 237, 0.08)"
    ctx.fillRect(startX, 0, endX - startX, height)

    // Center vertical line
    const centerY = height / 2

    // Draw each amplitude bar
    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap)
      const peak = peaks[i]
      const barHeight = Math.max(4, peak * (height * 0.82))
      const y = centerY - barHeight / 2

      const barCenter = x + barWidth / 2
      const isSelected = barCenter >= startX && barCenter <= endX

      if (isSelected) {
        // Brand violet gradient for selected active range
        ctx.fillStyle = "#7C3AED"
      } else {
        // Muted slate-300 for unselected portions
        ctx.fillStyle = "#CBD5E1"
      }

      // Rounded bar
      const radius = Math.min(barWidth / 2, 2)
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, radius)
      ctx.fill()
    }

    ctx.restore()
  }, [peaks, startTime, endTime, timeToPercent])

  useEffect(() => {
    drawWaveform()
  }, [drawWaveform])

  // Resize listener
  useEffect(() => {
    const handleResize = () => drawWaveform()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [drawWaveform])

  // Pointer event handlers for smooth scrubbing on desktop and mobile
  const handlePointerDown = (e: React.PointerEvent, target: DragTarget) => {
    if (disabled || duration <= 0) return
    e.preventDefault()
    e.stopPropagation()

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const clientX = e.clientX

    container.setPointerCapture(e.pointerId)
    setActiveDrag(target)
    setDragStartX(clientX)
    setInitialRange({ start: startTime, end: endTime })

    if (target === null) {
      // Direct click on waveform background: seek to position
      const clickX = clientX - rect.left
      const targetTime = pixelToTime(clickX, rect.width)
      onSeek(targetTime)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || disabled || duration <= 0) return
    e.preventDefault()

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const deltaX = e.clientX - dragStartX
    const deltaTime = (deltaX / rect.width) * duration

    const minGap = 0.1 // Minimum 100ms selection

    if (activeDrag === "start") {
      const newStart = clamp(initialRange.start + deltaTime, 0, initialRange.end - minGap)
      onRangeChange(Number(newStart.toFixed(3)), initialRange.end)
    } else if (activeDrag === "end") {
      const newEnd = clamp(initialRange.end + deltaTime, initialRange.start + minGap, duration)
      onRangeChange(initialRange.start, Number(newEnd.toFixed(3)))
    } else if (activeDrag === "middle") {
      const rangeLen = initialRange.end - initialRange.start
      let newStart = initialRange.start + deltaTime
      let newEnd = initialRange.end + deltaTime

      if (newStart < 0) {
        newStart = 0
        newEnd = rangeLen
      } else if (newEnd > duration) {
        newEnd = duration
        newStart = duration - rangeLen
      }

      onRangeChange(Number(newStart.toFixed(3)), Number(newEnd.toFixed(3)))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag && containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId)
      } catch {}
    }
    setActiveDrag(null)
  }

  // Keyboard navigation for Start handle
  const handleStartKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const step = e.shiftKey ? 1.0 : 0.1
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      onRangeChange(Math.max(0, Number((startTime - step).toFixed(3))), endTime)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      onRangeChange(Math.min(endTime - 0.1, Number((startTime + step).toFixed(3))), endTime)
    }
  }

  // Keyboard navigation for End handle
  const handleEndKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const step = e.shiftKey ? 1.0 : 0.1
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      onRangeChange(startTime, Math.max(startTime + 0.1, Number((endTime - step).toFixed(3))))
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      onRangeChange(startTime, Math.min(duration, Number((endTime + step).toFixed(3))))
    }
  }

  const startPercent = timeToPercent(startTime)
  const endPercent = timeToPercent(endTime)
  const currentPercent = timeToPercent(currentTime)

  return (
    <div className="w-full space-y-2 select-none">
      {/* Waveform Wrapper */}
      <div
        ref={containerRef}
        onPointerDown={(e) => handlePointerDown(e, null)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
        className="relative w-full h-32 sm:h-36 bg-slate-900 rounded-2xl overflow-hidden cursor-crosshair shadow-inner border border-slate-800"
      >
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-full w-px bg-white" />
          ))}
        </div>

        {/* Canvas for Waveform */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Selected Area Highlight & Middle Drag Zone */}
        <div
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(0, endPercent - startPercent)}%`,
          }}
          onPointerDown={(e) => handlePointerDown(e, "middle")}
          className="absolute top-0 bottom-0 cursor-grab active:cursor-grabbing border-y-2 border-brand/50 hover:border-brand transition-colors group"
          title="Arrastrá la selección para desplazarla en la línea de tiempo"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-brand/80 text-white text-[11px] font-bold shadow-xs">
              Mover selección
            </span>
          </div>
        </div>

        {/* Playhead Indicator */}
        {currentPercent >= 0 && currentPercent <= 100 && (
          <div
            style={{ left: `${currentPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 pointer-events-none transition-all duration-75"
          >
            <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-amber-400 rotate-45 rounded-xs shadow-md" />
          </div>
        )}

        {/* Left Handle: Start Time */}
        <div
          style={{ left: `${startPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, "start")}
          tabIndex={0}
          role="slider"
          aria-label="Punto de inicio del corte"
          aria-valuemin={0}
          aria-valuemax={endTime}
          aria-valuenow={startTime}
          onKeyDown={handleStartKeyDown}
          className="absolute top-0 bottom-0 -ml-3.5 w-7 flex flex-col items-center justify-between z-20 cursor-ew-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-white group"
        >
          {/* Top Pill with Time */}
          <div className="mt-1 px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-extrabold shadow-md border border-purple-300 flex items-center gap-0.5 group-hover:scale-105 transition-transform">
            <span>{formatTime(startTime, false)}</span>
          </div>

          {/* Vertical Bar */}
          <div className="w-1 flex-1 bg-brand group-hover:bg-brand-hover shadow-sm rounded-full my-0.5" />

          {/* Bottom Grip Knob */}
          <div className="mb-1 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Right Handle: End Time */}
        <div
          style={{ left: `${endPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, "end")}
          tabIndex={0}
          role="slider"
          aria-label="Punto final del corte"
          aria-valuemin={startTime}
          aria-valuemax={duration}
          aria-valuenow={endTime}
          onKeyDown={handleEndKeyDown}
          className="absolute top-0 bottom-0 -ml-3.5 w-7 flex flex-col items-center justify-between z-20 cursor-ew-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-white group"
        >
          {/* Top Pill with Time */}
          <div className="mt-1 px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-extrabold shadow-md border border-purple-300 flex items-center gap-0.5 group-hover:scale-105 transition-transform">
            <span>{formatTime(endTime, false)}</span>
          </div>

          {/* Vertical Bar */}
          <div className="w-1 flex-1 bg-brand group-hover:bg-brand-hover shadow-sm rounded-full my-0.5" />

          {/* Bottom Grip Knob */}
          <div className="mb-1 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Timeline Time Legend */}
      <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-400">
        <span>00:00.00</span>
        <span className="text-slate-500 font-mono">
          Posición actual: <strong className="text-slate-800">{formatTime(currentTime)}</strong>
        </span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
