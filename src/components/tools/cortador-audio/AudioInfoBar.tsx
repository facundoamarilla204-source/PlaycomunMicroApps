"use client"

import React, { useRef } from "react"
import { AudioFileInfo } from "@/lib/audio-cutter/types"
import { formatFileSize, formatTime } from "@/lib/audio-cutter/format-utils"
import { Music, RefreshCw, Trash2, Clock, HardDrive } from "lucide-react"

interface AudioInfoBarProps {
  audioInfo: AudioFileInfo
  onReplaceFile: (file: File) => void
  onRemoveFile: () => void
  disabled?: boolean
}

export function AudioInfoBar({
  audioInfo,
  onReplaceFile,
  onRemoveFile,
  disabled = false,
}: AudioInfoBarProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onReplaceFile(files[0])
      e.target.value = ""
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
      <input
        ref={replaceInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* File Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-brand border border-purple-100">
          <Music className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate" title={audioInfo.name}>
              {audioInfo.name}
            </h3>
            <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-brand border border-purple-200 shrink-0">
              {audioInfo.format}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatTime(audioInfo.duration, false)}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatFileSize(audioInfo.size)}</span>
            </span>
            {audioInfo.sampleRate && (
              <>
                <span className="text-slate-300">·</span>
                <span className="hidden sm:inline text-slate-400">
                  {(audioInfo.sampleRate / 1000).toFixed(1)} kHz
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={() => replaceInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          title="Reemplazar por otro archivo"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Cambiar audio</span>
        </button>

        <button
          type="button"
          onClick={onRemoveFile}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer disabled:opacity-50"
          title="Quitar archivo"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  )
}
