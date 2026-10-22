'use client'

import React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Crown,
  X,
  History,
  Users,
  Package,
  Building2,
  Cloud,
  CheckCircle2,
  ArrowRight,
  LogIn,
} from 'lucide-react'

export type ProFeatureKey =
  | 'history'
  | 'clients'
  | 'products'
  | 'business_profile'
  | 'cloud_save'
  | 'white_label'

interface Props {
  isOpen: boolean
  onClose: () => void
  featureKey: ProFeatureKey
  isAuthenticated: boolean
}

const FEATURE_INFO: Record<
  ProFeatureKey,
  {
    title: string
    description: string
    icon: React.ElementType
    benefits: string[]
  }
> = {
  history: {
    title: 'Historial de comprobantes',
    description:
      'Guardá tus presupuestos, recibos y órdenes de trabajo para volver a abrirlos, editarlos o descargarlos cuando los necesites.',
    icon: History,
    benefits: [
      'Acceso desde cualquier dispositivo',
      'Buscador por cliente, número o fecha',
      'Duplicación de comprobantes anteriores',
    ],
  },
  clients: {
    title: 'Agenda de clientes',
    description:
      'Guardá los datos de tus clientes frecuentes para cargarlos en tus comprobantes con un solo clic.',
    icon: Users,
    benefits: [
      'Completá CUIT, dirección y contacto al instante',
      'Historial de presupuestos por cliente',
      'Menos tiempo repitiendo datos en cada documento',
    ],
  },
  products: {
    title: 'Catálogo de productos y servicios',
    description:
      'Armá tu lista de ítems habituales con precios de referencia para agregarlos rápido a cualquier comprobante.',
    icon: Package,
    benefits: [
      'Agregá líneas de conceptos en un clic',
      'Precios y descuentos sugeridos',
      'Organización más rápida de tus cotizaciones',
    ],
  },
  business_profile: {
    title: 'Datos de tu negocio y logo',
    description:
      'Cargá los datos de tu empresa, CUIT, logo y membrete una sola vez para que aparezcan automáticamente en cada documento nuevo.',
    icon: Building2,
    benefits: [
      'Datos del emisor siempre listos',
      'Tu logo en la cabecera de los PDF',
      'Diseño consistente para todos tus comprobantes',
    ],
  },
  cloud_save: {
    title: 'Guardar en tu cuenta',
    description:
      'Guardá tus comprobantes en la nube con numeración correlativa automática y acceso seguro desde cualquier lugar.',
    icon: Cloud,
    benefits: [
      'Numeración correlativa automática',
      'Comprobantes guardados en tu cuenta',
      'Disponibles desde celular, tablet o computadora',
    ],
  },
  white_label: {
    title: 'PDF sin marca de agua',
    description:
      'Descargá tus presupuestos y recibos con un diseño limpio, sin el logo ni la mención de PlayComún en el pie de página.',
    icon: Crown,
    benefits: [
      'Diseño limpio para presentar a tus clientes',
      'Tu logo y datos de contacto en primer plano',
      'Descargas ilimitadas en PDF',
    ],
  },
}

export function ProFeatureModal({
  isOpen,
  onClose,
  featureKey,
  isAuthenticated,
}: Props) {
  if (!isOpen) return null

  const info = FEATURE_INFO[featureKey] || FEATURE_INFO.cloud_save
  const IconComponent = info.icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Cabecera limpia */}
          <div className="p-6 border-b border-slate-100 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <Crown className="w-3 h-3 text-purple-600" />
                PlayComún Pro
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{info.title}</h3>
                <p className="text-xs text-slate-500">Función incluida con el plan Pro</p>
              </div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              {info.description}
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Incluido con Pro:
              </span>
              <ul className="space-y-2 text-xs text-slate-600">
                {info.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Podés seguir creando y descargando tus comprobantes gratis durante esta sesión.
            </p>

            {/* Acciones */}
            <div className="space-y-2 pt-2">
              {!isAuthenticated ? (
                <>
                  <Link
                    href={`/ingresar?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/herramientas/generador-facturas")}`}
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/planes"
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Ver planes Pro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/planes"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  Activar PlayComún Pro
                </Link>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Volver a la herramienta
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
