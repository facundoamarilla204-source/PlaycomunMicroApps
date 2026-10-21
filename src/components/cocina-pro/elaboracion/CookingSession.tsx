'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  ChefHat,
  ArrowLeft,
  ArrowRight,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Flame,
  Thermometer,
  Wrench,
  FileText,
  Volume2,
  Smartphone,
  Check,
  Scale,
  Sparkles,
} from 'lucide-react'
import { Recipe } from '@/lib/costo-receta'
import { scaleRecipeByYield, formatCulinaryQuantity } from '@/lib/gastronomia/scaling'

interface CookingSessionProps {
  recipe: Recipe
}

interface StepTimerState {
  totalSeconds: number
  remainingSeconds: number
  isRunning: boolean
  targetEndTime: number | null
  isFinished: boolean
}

// Generador de sonido sintético Web Audio API (agradable chime de campana de cocina)
function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    const now = ctx.currentTime
    // Acorde mayor suave: C5 (523Hz), E5 (659Hz), G5 (784Hz)
    playTone(523.25, now, 0.6)
    playTone(659.25, now + 0.15, 0.6)
    playTone(783.99, now + 0.3, 0.8)
  } catch (err) {
    console.warn('No se pudo reproducir el sonido:', err)
  }
}

export function CookingSession({ recipe }: CookingSessionProps) {
  const steps = recipe.steps || []
  const userScope = recipe.user_id || 'guest'
  const storageKey = `cocina_pro_session_${userScope}_${recipe.id}`

  // Rendimiento de la sesión (permite preparar más o menos sin alterar la receta)
  const [sessionYield, setSessionYield] = useState<number>(recipe.yield_quantity || 1)

  // Paso activo (0 = Mise en place de ingredientes; 1..N = pasos secuenciales; N+1 = finalizado)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)

  // Ingredientes preparados en mise en place
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})

  // Pasos completados
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({})

  // Temporizadores independientes por paso
  const [timers, setTimers] = useState<Record<number, StepTimerState>>(() => {
    const initial: Record<number, StepTimerState> = {}
    steps.forEach((step, idx) => {
      const durationSec = (step.duration_minutes || 0) * 60
      initial[idx] = {
        totalSeconds: durationSec,
        remainingSeconds: durationSec,
        isRunning: false,
        targetEndTime: null,
        isFinished: false,
      }
    })
    return initial
  })

  // Mensajes de estado
  const [isRestored, setIsRestored] = useState(false)
  const [isWakeLockActive, setIsWakeLockActive] = useState(false)
  const wakeLockRef = useRef<any>(null)

  // Escalar ingredientes de acuerdo al rendimiento elegido
  const scaledIngredients = useMemo(() => {
    if (!recipe.yield_quantity || recipe.yield_quantity <= 0 || sessionYield === recipe.yield_quantity) {
      return recipe.ingredients.map((ing) => ({
        ...ing,
        displayQuantity: ing.quantity,
      }))
    }

    try {
      const scaled = scaleRecipeByYield(recipe as any, sessionYield, recipe.yield_unit, {
        calculatePracticalQuantities: true,
      })
      return scaled.scaledRecipe.ingredients.map((ing) => ({
        ...ing,
        displayQuantity: ing.mathematical_quantity,
        displayFormatted: ing.formatted_practical,
      }))
    } catch {
      return recipe.ingredients.map((ing) => ({
        ...ing,
        displayQuantity: ing.quantity,
      }))
    }
  }, [recipe, sessionYield])

  // 1. Restaurar progreso desde localStorage al cargar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.currentStepIndex === 'number') {
          setCurrentStepIndex(parsed.currentStepIndex)
        }
        if (parsed.checkedIngredients) {
          setCheckedIngredients(parsed.checkedIngredients)
        }
        if (parsed.completedSteps) {
          setCompletedSteps(parsed.completedSteps)
        }
        if (typeof parsed.sessionYield === 'number' && parsed.sessionYield > 0) {
          setSessionYield(parsed.sessionYield)
        }
        if (parsed.timers) {
          // Reconstruir temporizadores calculando el tiempo transcurrido si estaban corriendo
          const now = Date.now()
          const restoredTimers: Record<number, StepTimerState> = {}

          Object.keys(parsed.timers).forEach((key) => {
            const idx = Number(key)
            const t = parsed.timers[idx]
            if (t.isRunning && t.targetEndTime) {
              const diffSec = Math.max(0, Math.round((t.targetEndTime - now) / 1000))
              restoredTimers[idx] = {
                ...t,
                remainingSeconds: diffSec,
                isRunning: diffSec > 0,
                isFinished: diffSec === 0,
              }
            } else {
              restoredTimers[idx] = t
            }
          })
          setTimers(restoredTimers)
        }
        setIsRestored(true)
      }
    } catch (err) {
      console.warn('Error restaurando sesión de elaboración:', err)
    }
  }, [storageKey])

  // 2. Persistir sesión en localStorage en cada cambio
  useEffect(() => {
    try {
      const payload = {
        currentStepIndex,
        checkedIngredients,
        completedSteps,
        sessionYield,
        timers,
        lastUpdated: Date.now(),
      }
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch (err) {
      console.warn('Error guardando sesión de elaboración:', err)
    }
  }, [storageKey, currentStepIndex, checkedIngredients, completedSteps, sessionYield, timers])

  // 3. Manejo de temporizadores (drift-proof con Date.now())
  useEffect(() => {
    const hasRunningTimer = Object.values(timers).some((t) => t.isRunning)
    if (!hasRunningTimer) return

    const interval = setInterval(() => {
      const now = Date.now()
      setTimers((prev) => {
        let changed = false
        const next = { ...prev }

        Object.keys(next).forEach((key) => {
          const idx = Number(key)
          const timer = next[idx]
          if (timer.isRunning && timer.targetEndTime) {
            const diff = Math.max(0, Math.round((timer.targetEndTime - now) / 1000))
            if (diff !== timer.remainingSeconds) {
              changed = true
              if (diff === 0) {
                playKitchenChime()
                next[idx] = {
                  ...timer,
                  remainingSeconds: 0,
                  isRunning: false,
                  targetEndTime: null,
                  isFinished: true,
                }
              } else {
                next[idx] = {
                  ...timer,
                  remainingSeconds: diff,
                }
              }
            }
          }
        })

        return changed ? next : prev
      })
    }, 250)

    return () => clearInterval(interval)
  }, [timers])

  // 4. Wake Lock para mantener encendida la pantalla del celular
  const toggleWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
      alert('Tu navegador no soporta mantener la pantalla encendida automáticamente.')
      return
    }

    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        setIsWakeLockActive(false)
      } else {
        const lock = await (navigator as any).wakeLock.request('screen')
        wakeLockRef.current = lock
        setIsWakeLockActive(true)

        lock.addEventListener('release', () => {
          wakeLockRef.current = null
          setIsWakeLockActive(false)
        })
      }
    } catch (err) {
      console.warn('Wake Lock error:', err)
    }
  }

  // Liberar Wake Lock al desmontar
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
      }
    }
  }, [])

  // Controladores de temporizador para el paso actual
  const startTimer = (stepIdx: number) => {
    const current = timers[stepIdx]
    if (!current || current.remainingSeconds <= 0) return

    setTimers((prev) => ({
      ...prev,
      [stepIdx]: {
        ...current,
        isRunning: true,
        isFinished: false,
        targetEndTime: Date.now() + current.remainingSeconds * 1000,
      },
    }))
  }

  const pauseTimer = (stepIdx: number) => {
    const current = timers[stepIdx]
    if (!current) return

    setTimers((prev) => ({
      ...prev,
      [stepIdx]: {
        ...current,
        isRunning: false,
        targetEndTime: null,
      },
    }))
  }

  const resetTimer = (stepIdx: number) => {
    const defaultSec = ((steps[stepIdx]?.duration_minutes || 0) * 60) || 300
    setTimers((prev) => ({
      ...prev,
      [stepIdx]: {
        totalSeconds: defaultSec,
        remainingSeconds: defaultSec,
        isRunning: false,
        targetEndTime: null,
        isFinished: false,
      },
    }))
  }

  const addTimerMinutes = (stepIdx: number, minutes: number) => {
    const current = timers[stepIdx]
    if (!current) return
    const addSec = minutes * 60
    const newRemaining = current.remainingSeconds + addSec
    const newTotal = Math.max(current.totalSeconds, newRemaining)

    setTimers((prev) => ({
      ...prev,
      [stepIdx]: {
        ...current,
        totalSeconds: newTotal,
        remainingSeconds: newRemaining,
        isFinished: false,
        targetEndTime: current.isRunning ? Date.now() + newRemaining * 1000 : null,
      },
    }))
  }

  // Formatear segundos a MM:SS o HH:MM:SS
  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Reiniciar sesión completa
  const handleResetSession = () => {
    if (window.confirm('¿Deseás reiniciar la sesión de elaboración? Se limpiará el progreso temporal.')) {
      localStorage.removeItem(storageKey)
      setCurrentStepIndex(0)
      setCheckedIngredients({})
      setCompletedSteps({})

      const initial: Record<number, StepTimerState> = {}
      steps.forEach((step, idx) => {
        const durationSec = (step.duration_minutes || 0) * 60
        initial[idx] = {
          totalSeconds: durationSec,
          remainingSeconds: durationSec,
          isRunning: false,
          targetEndTime: null,
          isFinished: false,
        }
      })
      setTimers(initial)
      setIsRestored(false)
    }
  }

  // Cálculos de progreso
  const totalStages = steps.length + 1 // 1 para Mise en place + steps.length
  const currentStageNumber = currentStepIndex + 1
  const progressPercentage = Math.min(100, Math.round(((currentStepIndex) / totalStages) * 100))

  const activeStep = currentStepIndex > 0 && currentStepIndex <= steps.length ? steps[currentStepIndex - 1] : null
  const activeTimer = currentStepIndex > 0 ? timers[currentStepIndex - 1] : null

  // Verificar si todos los ingredientes están pesados
  const allIngredientsChecked = scaledIngredients.length > 0 && scaledIngredients.every((ing: any, idx: number) => checkedIngredients[ing.id || `${idx}`])

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Barra superior de navegación y controles de cocina */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/cocina-pro/recetas?id=${recipe.id}`}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors min-h-[48px] min-w-[48px] inline-flex items-center justify-center cursor-pointer"
            title="Volver a la receta"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                <Flame className="h-3 w-3" />
                <span>Modo elaboración</span>
              </span>
              {isRestored && (
                <span className="text-[10px] text-slate-700 font-medium hidden sm:inline">
                  • Progreso restaurado
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight line-clamp-1">
              {recipe.name}
            </h1>
          </div>
        </div>

        {/* Acciones de cabecera: Pantalla encendida, audio, reiniciar */}
        <div className="flex items-center gap-2">
          {'wakeLock' in (typeof navigator !== 'undefined' ? navigator : {}) && (
            <button
              type="button"
              onClick={toggleWakeLock}
              className={`btn-tactile px-3 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[48px] inline-flex items-center gap-1.5 cursor-pointer ${
                isWakeLockActive
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Evitar que la pantalla se apague mientras cocinás"
            >
              <Smartphone className={`h-4 w-4 ${isWakeLockActive ? 'text-amber-600' : 'text-slate-600'}`} />
              <span className="hidden sm:inline">
                {isWakeLockActive ? 'Pantalla activa' : 'Mantener encendida'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={playKitchenChime}
            className="btn-tactile p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors min-h-[48px] min-w-[48px] inline-flex items-center justify-center cursor-pointer"
            title="Probar sonido de alarma"
          >
            <Volume2 className="h-5 w-5 text-slate-600" />
          </button>

          <button
            type="button"
            onClick={handleResetSession}
            className="btn-tactile p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors min-h-[48px] min-w-[48px] inline-flex items-center justify-center cursor-pointer"
            title="Reiniciar progreso de elaboración"
          >
            <RotateCcw className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Selector de rendimiento y barra de progreso */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Rendimiento para esta elaboración:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={sessionYield}
                onChange={(e) => setSessionYield(Number(e.target.value) || 1)}
                className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-brand min-h-[40px]"
              />
              <span className="font-semibold text-slate-700">{recipe.yield_unit}</span>
            </div>
          </div>

          <div className="text-slate-700 font-semibold tabular-nums">
            {currentStepIndex === 0 ? (
              <span>Etapa: Mise en place ({scaledIngredients.length} insumos)</span>
            ) : currentStepIndex <= steps.length ? (
              <span>
                Paso {currentStepIndex} de {steps.length}
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">¡Elaboración completada!</span>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Pestañas de navegación entre etapas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
          <button
            type="button"
            onClick={() => setCurrentStepIndex(0)}
            className={`btn-tactile px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] cursor-pointer transition-all ${
              currentStepIndex === 0
                ? 'bg-brand text-white shadow-xs'
                : allIngredientsChecked
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Mise en place
          </button>

          {steps.map((s, idx) => {
            const stepNum = idx + 1
            const isCompleted = completedSteps[idx]
            const isCurrent = currentStepIndex === stepNum

            return (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setCurrentStepIndex(stepNum)}
                className={`btn-tactile px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-brand text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Paso {stepNum}
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN LA ETAPA */}

      {/* ETAPA 0: MISE EN PLACE (Checklist de ingredientes pesados) */}
      {currentStepIndex === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-brand flex items-center justify-center font-bold">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Mise en place: Pesaje y preparación de insumos
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                  Pesá y tené listos los ingredientes en tu mesada antes de comenzar la cocción.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 divide-y divide-slate-100">
            {scaledIngredients.map((ing: any, idx: number) => {
              const key = ing.id || `${idx}`
              const isChecked = Boolean(checkedIngredients[key])

              return (
                <label
                  key={key}
                  className={`p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors min-h-[56px] select-none ${
                    isChecked ? 'bg-slate-50/80 text-slate-600 line-through' : 'hover:bg-slate-50/50 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setCheckedIngredients((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded text-brand focus:ring-brand border-slate-300 cursor-pointer"
                    />
                    <span className="font-semibold text-sm sm:text-base leading-snug">
                      {ing.name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                      {formatCulinaryQuantity(ing.displayQuantity)} {ing.unit}
                    </span>
                    {ing.displayFormatted && ing.displayFormatted !== formatCulinaryQuantity(ing.displayQuantity) && (
                      <span className="text-xs text-slate-700 block tabular-nums">
                        ≈ {ing.displayFormatted} {ing.unit}
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>

          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const all: Record<string, boolean> = {}
                scaledIngredients.forEach((ing: any, idx: number) => {
                  all[ing.id || `${idx}`] = true
                })
                setCheckedIngredients(all)
              }}
              className="btn-tactile px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Marcar todos como listos
            </button>

            <button
              type="button"
              onClick={() => setCurrentStepIndex(1)}
              className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-xs transition-colors min-h-[48px] cursor-pointer"
            >
              <span>Comenzar con el Paso 1</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPAS 1..N: PASOS SECUENCIALES */}
      {currentStepIndex > 0 && currentStepIndex <= steps.length && activeStep && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-6 p-5 sm:p-8">
          {/* Encabezado del paso */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-purple-100 text-brand flex items-center justify-center font-extrabold text-lg sm:text-xl">
                {currentStepIndex}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Paso {currentStepIndex} de {steps.length}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Instrucción de elaboración
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const stepIdx = currentStepIndex - 1
                setCompletedSteps((prev) => ({
                  ...prev,
                  [stepIdx]: !prev[stepIdx],
                }))
              }}
              className={`btn-tactile px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-h-[48px] inline-flex items-center gap-2 cursor-pointer ${
                completedSteps[currentStepIndex - 1]
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>
                {completedSteps[currentStepIndex - 1] ? 'Paso completado' : 'Marcar como completado'}
              </span>
            </button>
          </div>

          {/* Gran instrucción legible a distancia */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-100">
            <p className="text-lg sm:text-2xl font-semibold text-slate-900 leading-relaxed sm:leading-loose">
              {activeStep.instruction}
            </p>
          </div>

          {/* Parámetros técnicos: Temperatura, equipamiento, notas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeStep.temperature_celsius && (
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/60 flex items-center gap-3">
                <Thermometer className="h-6 w-6 text-orange-600 shrink-0" />
                <div>
                  <span className="text-[11px] text-orange-800 font-semibold block">Temperatura</span>
                  <span className="text-base font-extrabold text-orange-950 tabular-nums">
                    {activeStep.temperature_celsius} °C
                  </span>
                </div>
              </div>
            )}

            {activeStep.equipment && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <Wrench className="h-6 w-6 text-slate-600 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-700 font-semibold block">Equipamiento</span>
                  <span className="text-sm font-bold text-slate-900 line-clamp-1">
                    {activeStep.equipment}
                  </span>
                </div>
              </div>
            )}

            {activeStep.notes && (
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/60 flex items-center gap-3 sm:col-span-1">
                <FileText className="h-6 w-6 text-brand shrink-0" />
                <div>
                  <span className="text-[11px] text-brand font-semibold block">Nota técnica</span>
                  <span className="text-xs text-slate-800 leading-snug line-clamp-2">
                    {activeStep.notes}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* TEMPORIZADOR DEL PASO */}
          {activeTimer && (
            <div className={`p-6 rounded-2xl border transition-all ${
              activeTimer.isFinished
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                : activeTimer.isRunning
                ? 'bg-purple-50/60 border-purple-200 ring-1 ring-brand'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Clock className={`h-5 w-5 ${activeTimer.isFinished ? 'text-rose-600 animate-bounce' : 'text-brand'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Temporizador del paso {currentStepIndex}
                    </span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight tabular-nums mt-1">
                    {formatSeconds(activeTimer.remainingSeconds)}
                  </div>
                  {activeTimer.isFinished && (
                    <span className="text-xs font-bold text-rose-700 mt-1 block animate-pulse">
                      ¡Tiempo de cocción finalizado!
                    </span>
                  )}
                </div>

                {/* Controles del temporizador */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {activeTimer.isRunning ? (
                    <button
                      type="button"
                      onClick={() => pauseTimer(currentStepIndex - 1)}
                      className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-xs transition-colors min-h-[48px] cursor-pointer"
                    >
                      <Pause className="h-5 w-5" />
                      <span>Pausar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startTimer(currentStepIndex - 1)}
                      className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-xs transition-colors min-h-[48px] cursor-pointer"
                    >
                      <Play className="h-5 w-5" />
                      <span>Iniciar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => resetTimer(currentStepIndex - 1)}
                    className="btn-tactile p-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors min-h-[48px] min-w-[48px] inline-flex items-center justify-center cursor-pointer"
                    title="Reiniciar temporizador"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => addTimerMinutes(currentStepIndex - 1, 1)}
                      className="btn-tactile px-2.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors min-h-[44px] cursor-pointer"
                    >
                      +1 min
                    </button>
                    <button
                      type="button"
                      onClick={() => addTimerMinutes(currentStepIndex - 1, 5)}
                      className="btn-tactile px-2.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors min-h-[44px] cursor-pointer"
                    >
                      +5 min
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navegación secuencial de pasos */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors min-h-[48px] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Paso anterior</span>
            </button>

            {currentStepIndex < steps.length ? (
              <button
                type="button"
                onClick={() => {
                  // Marcar paso actual como completado automáticamente al avanzar
                  setCompletedSteps((prev) => ({
                    ...prev,
                    [currentStepIndex - 1]: true,
                  }))
                  setCurrentStepIndex((prev) => prev + 1)
                }}
                className="btn-tactile inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-xs transition-colors min-h-[48px] cursor-pointer"
              >
                <span>Siguiente paso</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCompletedSteps((prev) => ({
                    ...prev,
                    [currentStepIndex - 1]: true,
                  }))
                  setCurrentStepIndex(steps.length + 1)
                }}
                className="btn-tactile inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition-colors min-h-[48px] cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Finalizar elaboración</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ETAPA FINAL: ELABORACIÓN COMPLETADA */}
      {currentStepIndex > steps.length && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
          </div>

          <div className="max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ¡Elaboración completada!
            </h2>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
              Seguiste exitosamente los {steps.length} pasos de elaboración para &quot;{recipe.name}&quot;.
              La sesión de cocina finalizó y tus notas técnicas se mantienen preservadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleResetSession}
              className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors min-h-[48px] cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Elaborar nuevamente</span>
            </button>

            <Link
              href={`/cocina-pro/recetas?id=${recipe.id}`}
              className="btn-tactile inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-bold shadow-xs transition-colors min-h-[48px]"
            >
              <ChefHat className="h-4 w-4" />
              <span>Volver a la receta</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
