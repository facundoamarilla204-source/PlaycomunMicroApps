"use client"

import React from "react"
import { ConversionOperation, ConversionOperationId } from "@/lib/converter/types"
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  Cpu,
  Laptop,
} from "lucide-react"

interface OperationSelectorProps {
  operations: ConversionOperation[]
  selectedOperationId: ConversionOperationId
  onSelectOperation: (id: ConversionOperationId) => void
}

export function OperationSelector({
  operations,
  selectedOperationId,
  onSelectOperation,
}: OperationSelectorProps) {
  const getOpIcon = (id: ConversionOperationId) => {
    switch (id) {
      case "word-to-pdf":
      case "pdf-to-word":
        return <FileText className="h-5 w-5" />
      case "excel-to-pdf":
      case "pdf-to-excel":
        return <FileSpreadsheet className="h-5 w-5" />
      case "ppt-to-pdf":
      case "pdf-to-ppt":
        return <Presentation className="h-5 w-5" />
      case "opendocument-to-pdf":
      case "pdf-to-pdfa":
        return <FileCode className="h-5 w-5" />
      case "images-to-pdf":
      case "pdf-to-images":
        return <ImageIcon className="h-5 w-5" />
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {operations.map((op) => {
        const isSelected = selectedOperationId === op.id
        const isLocal = op.environment === "client"

        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onSelectOperation(op.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between relative ${
              isSelected
                ? "bg-violet-50/50 border-violet-600 shadow-xs ring-1 ring-violet-600"
                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {getOpIcon(op.id)}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                      isLocal
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-violet-50 text-violet-700 border border-violet-200"
                    }`}
                  >
                    {isLocal ? (
                      <Laptop className="h-3 w-3" />
                    ) : (
                      <Cpu className="h-3 w-3" />
                    )}
                    {op.badgeText}
                  </span>

                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {op.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                {op.description}
              </p>
            </div>

            <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Entrada:</span>
              <span className="text-gray-700 font-mono font-semibold">
                {op.acceptedExtensions.join(", ").replace(/\./g, "")}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
