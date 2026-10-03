'use client'

import React from 'react'

interface AdSlotProps {
  isPro: boolean
  className?: string
  format?: 'horizontal' | 'rectangle'
}

export function AdSlot({ isPro, className = '', format = 'horizontal' }: AdSlotProps) {
  // If the user has Pro, we completely remove the ad element from the DOM
  if (isPro) {
    return null
  }

  // Placeholder for real ad implementation (e.g., Google AdSense)
  return (
    <div className={`flex flex-col items-center justify-center bg-gray-100 border border-gray-200 text-gray-400 text-sm overflow-hidden ${
      format === 'horizontal' ? 'w-full h-[90px]' : 'w-full max-w-[300px] h-[250px]'
    } ${className}`}>
      <span className="text-xs uppercase tracking-wider mb-1 font-medium text-gray-500">Publicidad</span>
      <div className="w-full h-full flex items-center justify-center opacity-50 bg-gray-200">
        Espacio publicitario
      </div>
    </div>
  )
}
