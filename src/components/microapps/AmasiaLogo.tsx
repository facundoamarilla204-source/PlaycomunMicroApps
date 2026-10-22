import React from 'react'
import Image from 'next/image'

export interface AmasiaLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * - 'symbol': Únicamente el isotipo de Amasia con su fondo violeta redondeado original.
   * - 'horizontal': Isotipo con fondo violeta + texto de marca "Amasia" (con descriptor opcional).
   * - 'monochrome': Variante de isotipo.
   */
  variant?: 'symbol' | 'horizontal' | 'monochrome'
  /** Muestra el descriptor tipográfico "Gestión gastronómica" debajo de Amasia (solo en horizontal) */
  withDescriptor?: boolean
  className?: string
  accentColor?: string
}

/**
 * Logotipo oficial de Amasia: Emblema distintivo de tazón con batidor sobre fondo violeta redondeado.
 * Renderiza de forma consistente el recurso visual oficial provisto.
 */
export function AmasiaLogo({
  variant = 'symbol',
  withDescriptor = false,
  className = 'h-8 w-8',
  accentColor = '#7C3AED',
  ...props
}: AmasiaLogoProps) {
  if (variant === 'horizontal') {
    return (
      <div
        className={`inline-flex items-center gap-3 ${className}`}
        aria-label="Amasia · Gestión gastronómica"
        role="img"
        {...props}
      >
        <div className="relative h-9 w-9 shrink-0 flex items-center justify-center overflow-hidden rounded-xl shadow-xs">
          <Image
            src="/amasia/icon-badge.png"
            alt=""
            width={36}
            height={36}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="flex flex-col leading-tight select-none">
          <span className="font-extrabold text-slate-900 tracking-tight text-lg font-sans">
            Amasia
          </span>
          {withDescriptor && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
              Gestión gastronómica
            </span>
          )}
        </div>
      </div>
    )
  }

  // Variante 'symbol' y 'monochrome': el icono completo con su fondo violeta redondeado
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      aria-hidden="true"
      {...props}
    >
      <Image
        src="/amasia/icon-badge.png"
        alt=""
        width={64}
        height={64}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
