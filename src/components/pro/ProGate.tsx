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
      <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-purple-900 bg-purple-50 rounded-xl border border-purple-200">
        <Lock className="w-4 h-4 shrink-0 text-purple-700" />
        <span><span className="font-semibold">{featureName}</span> es una función de PlayComun Pro. <Link href="/planes" className="underline font-semibold hover:text-purple-950">Ver planes disponibles</Link>.</span>
      </div>
    )
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/60">
      <div className="opacity-20 pointer-events-none blur-sm filter transition-all duration-300 select-none">
        {children}
      </div>
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-white/70 backdrop-blur-[2px]">
        <div className="w-12 h-12 mb-3 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
          {featureName}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mb-4 leading-relaxed">
          Esta funcionalidad está disponible con la suscripción a PlayComun Pro.
        </p>
        <Link 
          href="/planes"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-purple-700 active:bg-purple-800 transition-colors focus-visible:outline-2 focus-visible:outline-purple-600"
        >
          Ver planes Pro
        </Link>
      </div>
    </div>
  )
}
