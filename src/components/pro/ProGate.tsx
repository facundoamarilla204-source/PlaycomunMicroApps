'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import Link from 'next/link'

interface ProGateProps {
  hasAccess: boolean
  featureName: string
  children: React.ReactNode
  fallback?: React.ReactNode
  compact?: boolean
}

export function ProGate({ hasAccess, featureName, children, fallback, compact = false }: ProGateProps) {
  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 text-sm text-amber-700 bg-amber-50 rounded-md border border-amber-200">
        <Lock className="w-4 h-4" />
        <span><span className="font-semibold">{featureName}</span> es una función Pro. <Link href="/pro" className="underline font-medium hover:text-amber-800">Mejora tu plan</Link>.</span>
      </div>
    )
  }

  return (
    <div className="relative group overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50/50">
      <div className="opacity-20 pointer-events-none blur-sm filter transition-all duration-300 select-none">
        {children}
      </div>
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-white/60 backdrop-blur-[2px]">
        <div className="w-12 h-12 mb-3 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {featureName}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mb-4">
          Esta funcionalidad es exclusiva para usuarios de PlayComun Pro.
        </p>
        <Link 
          href="/pro"
          className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-amber-500 text-white font-medium shadow-sm hover:bg-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Mejorar a Pro
        </Link>
      </div>
    </div>
  )
}
