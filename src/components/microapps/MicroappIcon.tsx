import { Calculator, ChefHat, Layers, type LucideIcon } from 'lucide-react'
import type { Microapp } from '@/data/microapps'
import { AmasiaLogo } from './AmasiaLogo'

const ICONS: Record<Exclude<Microapp['icon'], 'AmasiaManga'>, LucideIcon> = {
  ChefHat,
  Calculator,
  Layers,
}

/**
 * Icono de una microapp, resuelto desde el campo `icon` del catálogo.
 * Soporta iconos Lucide y logotipos propietarios vectoriales como Amasia.
 */
export function MicroappIcon({
  name,
  className,
}: {
  name: Microapp['icon']
  className?: string
}) {
  if (name === 'AmasiaManga') {
    return <AmasiaLogo variant="symbol" className={className} />
  }

  const Icon = ICONS[name]
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" focusable="false" />
}

