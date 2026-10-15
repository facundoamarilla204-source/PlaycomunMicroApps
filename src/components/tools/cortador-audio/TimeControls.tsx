"use client"

import React, { useState, useEffect } from "react"
import { formatTime, splitSeconds, parseTimeToSeconds } from "@/lib/audio-cutter/format-utils"
import { Clock, Plus, Minus, Scissors } from "lucide-react"

interface TimeControlsProps {
  duration: number
  startTime: number
  endTime: number
  onRangeChange: (start: number, end: number) => void
  disabled?: boolean
}

interface TimeInputBlockProps {
  label: string
  timeSeconds: number
  maxLimit: number
  minLimit: number
  onChange: (newSeconds: number) => void
  disabled?: boolean
}

function TimeInputBlock({
  label,
  timeSeconds,
  maxLimit,
  minLimit,
  onChange,
  disabled = false,
}: TimeInputBlockProps) {
  const parts = splitSeconds(timeSeconds)

  const [mins, setMins] = useState(parts.mins.toString().padStart(2, "0"))
  const [secs, setSecs] = useState(parts.secs.toString().padStart(2, "0"))
  const [ms, setMs] = useState(parts.ms.toString().padStart(3, "0"))

  useEffect(() => {
    const p = splitSeconds(timeSeconds)
    setMins(p.mins.toString().padStart(2, "0"))
    setSecs(p.secs.toString().padStart(2, "0"))
    setMs(p.ms.toString().padStart(3, "0"))
  }, [timeSeconds])

  const commitTime = (m: string, s: string, millis: string) => {
    const parsedM = parseInt(m, 10) || 0
    const parsedS = parseInt(s, 10) || 0
    const parsedMs = parseInt(millis, 10) || 0

    let total = parseTimeToSeconds(parsedM, parsedS, parsedMs)
    total = Math.max(minLimit, Math.min(maxLimit, total))
    onChange(Number(total.toFixed(3)))
  }

  const handleNudge = (deltaSeconds: number) => {
    let next = timeSeconds + deltaSeconds
    next = Math.max(minLimit, Math.min(maxLimit, next))
    onChange(Number(next.toFixed(3)))
  }

  return (
    <div className="flex-1 min-w-[260px] p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
        <span className="font-mono text-xs font-bold text-brand bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
          {formatTime(timeSeconds)}
        </span>
      </div>

      {/* Numerical inputs row */}
      <div className="flex items-center justify-center gap-1.5 font-mono">
        {/* Min */}
        <div className="flex flex-col items-center">
          <input
            type="number"
            min={0}
            max={99}
            value={mins}
            disabled={disabled}
            onChange={(e) => {
              setMins(e.target.value)
              commitTime(e.target.value, secs, ms)
            }}
            onBlur={() => {
              setMins(parts.mins.toString().padStart(2, "0"))
            }}
            aria-label={`${label} minutos`}
            className="w-13 h-10 text-center text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
          />
          <span className="text-[10px] text-slate-400 font-sans mt-0.5 font-semibold">min</span>
        </div>

        <span className="text-base font-bold text-slate-300 pb-3">:</span>

        {/* Sec */}
        <div className="flex flex-col items-center">
          <input
            type="number"
            min={0}
            max={59}
            value={secs}
            disabled={disabled}
            onChange={(e) => {
              setSecs(e.target.value)
              commitTime(mins, e.target.value, ms)
            }}
            onBlur={() => {
              setSecs(parts.secs.toString().padStart(2, "0"))
            }}
            aria-label={`${label} segundos`}
            className="w-13 h-10 text-center text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
          />
          <span className="text-[10px] text-slate-400 font-sans mt-0.5 font-semibold">seg</span>
        </div>

        <span className="text-base font-bold text-slate-300 pb-3">.</span>

        {/* Ms */}
        <div className="flex flex-col items-center">
          <input
            type="number"
            min={0}
            max={999}
            value={ms}
            disabled={disabled}
            onChange={(e) => {
              setMs(e.target.value)
              commitTime(mins, secs, e.target.value)
            }}
            onBlur={() => {
              setMs(parts.ms.toString().padStart(3, "0"))
            }}
            aria-label={`${label} milisegundos`}
            className="w-16 h-10 text-center text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
          />
          <span className="text-[10px] text-slate-400 font-sans mt-0.5 font-semibold">ms</span>
        </div>
      </div>

      {/* Quick nudge adjustment pills */}
      <div className="flex items-center justify-center gap-1 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => handleNudge(-1.0)}
          disabled={disabled || timeSeconds <= minLimit}
          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          title="Restar 1 segundo"
        >
          -1s
        </button>
        <button
          type="button"
          onClick={() => handleNudge(-0.1)}
          disabled={disabled || timeSeconds <= minLimit}
          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          title="Restar 0.1 segundo (100 ms)"
        >
          -0.1s
        </button>
        <button
          type="button"
          onClick={() => handleNudge(0.1)}
          disabled={disabled || timeSeconds >= maxLimit}
          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          title="Sumar 0.1 segundo (100 ms)"
        >
          +0.1s
        </button>
        <button
          type="button"
          onClick={() => handleNudge(1.0)}
          disabled={disabled || timeSeconds >= maxLimit}
          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          title="Sumar 1 segundo"
        >
          +1s
        </button>
      </div>
    </div>
  )
}

export function TimeControls({
  duration,
  startTime,
  endTime,
  onRangeChange,
  disabled = false,
}: TimeControlsProps) {
  const selectedDuration = Math.max(0, endTime - startTime)

  return (
    <div className="space-y-4">
      {/* Inputs container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Point */}
        <TimeInputBlock
          label="Punto de inicio"
          timeSeconds={startTime}
          minLimit={0}
          maxLimit={Math.max(0, endTime - 0.1)}
          onChange={(newStart) => onRangeChange(newStart, endTime)}
          disabled={disabled}
        />

        {/* End Point */}
        <TimeInputBlock
          label="Punto final"
          timeSeconds={endTime}
          minLimit={Math.min(duration, startTime + 0.1)}
          maxLimit={duration}
          onChange={(newEnd) => onRangeChange(startTime, newEnd)}
          disabled={disabled}
        />
      </div>

      {/* Summary Banner of Resulting Duration */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3.5 bg-purple-50/70 border border-purple-200/70 rounded-xl text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Scissors className="h-4 w-4 text-brand shrink-0" />
          <span>
            Duración resultante:{" "}
            <strong className="text-brand font-mono text-sm sm:text-base font-extrabold">
              {formatTime(selectedDuration)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span>Total original: {formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
