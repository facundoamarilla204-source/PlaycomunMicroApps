'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Wheat,
  Droplets,
  Plus,
  Trash2,
  Copy,
  Check,
  Save,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  calculateBakersPercentages,
  calculateWeightsFromFlour,
  calculateWeightsFromTotalDough,
  BakerIngredientInput,
  BakerPercentageSpec,
  BakerFormulaResult,
  PrefermentSpec,
  isFlourByName,
  isWaterByName,
} from '@/lib/gastronomia/bakers-percentage'
import { Recipe } from '@/lib/costo-receta'
import { saveRecipeServer } from '@/app/actions/recipes'
import { convertUnits } from '@/lib/gastronomia/conversions'

export type BakerMode = 'analyze' | 'from_flour' | 'from_total_dough'

interface IngredientRow {
  id: string
  name: string
  weightGrams: number
  bakersPercentage: number
  isFlour: boolean
  isWater: boolean
  isLiquid: boolean
  waterRatio?: number
}

interface BakersCalculatorProps {
  initialRecipes?: Recipe[]
}

const PRESET_FORMULAS: Array<{
  name: string
  description: string
  ingredients: Array<{ name: string; weightGrams: number; isFlour: boolean; isWater: boolean; isLiquid?: boolean }>
  preferment?: { name: string; totalWeightGrams: number; hydrationPercentage: number; alreadyIncluded: boolean }
}> = [
  {
    name: 'Pan de campo con masa madre (70% hidratación)',
    description: 'Fórmula clásica de hogaza artesanal con harina 000, harina integral y prefermento 1:1.',
    ingredients: [
      { name: 'Harina de trigo 000', weightGrams: 800, isFlour: true, isWater: false },
      { name: 'Harina integral de centeno', weightGrams: 200, isFlour: true, isWater: false },
      { name: 'Agua', weightGrams: 700, isFlour: false, isWater: true },
      { name: 'Sal fina', weightGrams: 20, isFlour: false, isWater: false },
      { name: 'Levadura fresca', weightGrams: 5, isFlour: false, isWater: false },
    ],
    preferment: {
      name: 'Masa madre activa (100% hidratación)',
      totalWeightGrams: 200,
      hydrationPercentage: 100,
      alreadyIncluded: false,
    },
  },
  {
    name: 'Pizza napolitana directa (65% hidratación)',
    description: 'Fermentación en frío de 24 a 48 hs para bollos ligeros y alveolados.',
    ingredients: [
      { name: 'Harina de fuerza W300', weightGrams: 1000, isFlour: true, isWater: false },
      { name: 'Agua fría', weightGrams: 650, isFlour: false, isWater: true },
      { name: 'Sal fina', weightGrams: 28, isFlour: false, isWater: false },
      { name: 'Levadura seca instantánea', weightGrams: 2, isFlour: false, isWater: false },
      { name: 'Aceite de oliva extra virgen', weightGrams: 25, isFlour: false, isWater: false },
    ],
  },
  {
    name: 'Brioche enriquecido (leche, huevos y manteca)',
    description: 'Masa enriquecida con aporte de agua proveniente de lácteos y huevos.',
    ingredients: [
      { name: 'Harina 000', weightGrams: 1000, isFlour: true, isWater: false },
      { name: 'Huevos enteros', weightGrams: 300, isFlour: false, isWater: false, isLiquid: true },
      { name: 'Leche entera', weightGrams: 200, isFlour: false, isWater: false, isLiquid: true },
      { name: 'Azúcar común', weightGrams: 120, isFlour: false, isWater: false },
      { name: 'Manteca pomada', weightGrams: 350, isFlour: false, isWater: false },
      { name: 'Sal fina', weightGrams: 20, isFlour: false, isWater: false },
      { name: 'Levadura fresca', weightGrams: 35, isFlour: false, isWater: false },
    ],
  },
]

export function BakersCalculator({ initialRecipes = [] }: BakersCalculatorProps) {
  const [mode, setMode] = useState<BakerMode>('analyze')

  // Filas de ingredientes
  const [rows, setRows] = useState<IngredientRow[]>([
    { id: '1', name: 'Harina 000', weightGrams: 1000, bakersPercentage: 100, isFlour: true, isWater: false, isLiquid: false },
    { id: '2', name: 'Agua', weightGrams: 680, bakersPercentage: 68, isFlour: false, isWater: true, isLiquid: false },
    { id: '3', name: 'Sal fina', weightGrams: 20, bakersPercentage: 2, isFlour: false, isWater: false, isLiquid: false },
    { id: '4', name: 'Levadura seca', weightGrams: 4, bakersPercentage: 0.4, isFlour: false, isWater: false, isLiquid: false },
  ])

  // Parámetros de formulación
  const [targetFlourGrams, setTargetFlourGrams] = useState<number>(1000)
  const [targetDoughGrams, setTargetDoughGrams] = useState<number>(1800)

  // Prefermento opcional
  const [hasPreferment, setHasPreferment] = useState<boolean>(false)
  const [prefermentName, setPrefermentName] = useState<string>('Masa Madre (100% hidratación)')
  const [prefermentWeightGrams, setPrefermentWeightGrams] = useState<number>(200)
  const [prefermentHydration, setPrefermentHydration] = useState<number>(100)
  const [prefermentAlreadyIncluded, setPrefermentAlreadyIncluded] = useState<boolean>(false)

  // Selector de recetas para importar
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')

  // Guardado como receta
  const [isSaving, setIsSaving] = useState(false)
  const [recipeNameInput, setRecipeNameInput] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedClipboard, setCopiedClipboard] = useState(false)

  // Cálculo del prefermento
  const prefermentSpec: PrefermentSpec | undefined = useMemo(() => {
    if (!hasPreferment || prefermentWeightGrams <= 0) return undefined
    return {
      name: prefermentName,
      totalWeightGrams: prefermentWeightGrams,
      hydrationPercentage: prefermentHydration,
      alreadyIncludedInBaseIngredients: prefermentAlreadyIncluded,
    }
  }, [hasPreferment, prefermentName, prefermentWeightGrams, prefermentHydration, prefermentAlreadyIncluded])

  // Motor de cálculo reactivo
  const calculation = useMemo((): { result: BakerFormulaResult | null; error: string | null } => {
    try {
      if (mode === 'analyze') {
        const inputs: BakerIngredientInput[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          weightGrams: Number(r.weightGrams) || 0,
          isFlour: r.isFlour,
          isWater: r.isWater,
          isLiquid: r.isLiquid,
          waterRatio: r.waterRatio,
        }))
        const res = calculateBakersPercentages(inputs, { preferment: prefermentSpec })
        return { result: res, error: null }
      }

      if (mode === 'from_flour') {
        if (!targetFlourGrams || targetFlourGrams <= 0) {
          return { result: null, error: 'Ingresá una cantidad de harina base mayor a 0 g.' }
        }

        const specs: BakerPercentageSpec[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          bakersPercentage: Number(r.bakersPercentage) || 0,
          isFlour: r.isFlour,
          isLiquid: r.isLiquid,
          waterRatio: r.waterRatio,
        }))
        const res = calculateWeightsFromFlour(targetFlourGrams, specs, { preferment: prefermentSpec })
        return { result: res, error: null }
      }

      if (mode === 'from_total_dough') {
        if (!targetDoughGrams || targetDoughGrams <= 0) {
          return { result: null, error: 'Ingresá un peso total de masa deseado mayor a 0 g.' }
        }

        const specs: BakerPercentageSpec[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          bakersPercentage: Number(r.bakersPercentage) || 0,
          isFlour: r.isFlour,
          isLiquid: r.isLiquid,
          waterRatio: r.waterRatio,
        }))
        const res = calculateWeightsFromTotalDough(targetDoughGrams, specs, { preferment: prefermentSpec })
        return { result: res, error: null }
      }

      return { result: null, error: null }
    } catch (err: any) {
      return { result: null, error: err.message || 'Error calculando la fórmula panadera.' }
    }
  }, [mode, rows, targetFlourGrams, targetDoughGrams, prefermentSpec])

  // Modificar fila
  const updateRow = (id: string, patch: Partial<IngredientRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, ...patch }
        // Si cambia el nombre, auto-inferir si no se forzó
        if (patch.name !== undefined && patch.isFlour === undefined) {
          updated.isFlour = isFlourByName(updated.name)
        }
        if (patch.name !== undefined && patch.isWater === undefined) {
          updated.isWater = isWaterByName(updated.name)
        }
        return updated
      })
    )
  }

  // Agregar fila
  const addRow = () => {
    const newId = Date.now().toString()
    setRows((prev) => [
      ...prev,
      {
        id: newId,
        name: '',
        weightGrams: 0,
        bakersPercentage: 0,
        isFlour: false,
        isWater: false,
        isLiquid: false,
      },
    ])
  }

  // Eliminar fila
  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  // Cargar plantilla
  const loadPreset = (preset: typeof PRESET_FORMULAS[0]) => {
    const newRows: IngredientRow[] = preset.ingredients.map((ing, i) => ({
      id: `${Date.now()}-${i}`,
      name: ing.name,
      weightGrams: ing.weightGrams,
      bakersPercentage: 0,
      isFlour: ing.isFlour,
      isWater: ing.isWater,
      isLiquid: ing.isLiquid || false,
    }))
    setRows(newRows)

    if (preset.preferment) {
      setHasPreferment(true)
      setPrefermentName(preset.preferment.name)
      setPrefermentWeightGrams(preset.preferment.totalWeightGrams)
      setPrefermentHydration(preset.preferment.hydrationPercentage)
      setPrefermentAlreadyIncluded(preset.preferment.alreadyIncluded)
    } else {
      setHasPreferment(false)
    }

    setFeedback({
      type: 'success',
      text: `Fórmula "${preset.name}" cargada correctamente.`,
    })
    setTimeout(() => setFeedback(null), 3000)
  }

  // Importar desde receta existente
  const handleImportRecipe = (recipe: Recipe) => {
    const newRows: IngredientRow[] = []

    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ing = recipe.ingredients[i]
      let weightGrams = 0

      // Intentar convertir a gramos
      const conv = convertUnits(ing.quantity, ing.unit, 'g')
      weightGrams = conv.success ? conv.value : (Number(ing.quantity) || 0)

      const isFlour = isFlourByName(ing.name)
      const isWater = isWaterByName(ing.name)

      newRows.push({
        id: `import-${i}-${Date.now()}`,
        name: ing.name,
        weightGrams: Number(weightGrams.toFixed(1)),
        bakersPercentage: 0,
        isFlour,
        isWater,
        isLiquid: !isWater && (ing.name.toLowerCase().includes('leche') || ing.name.toLowerCase().includes('huevo')),
      })
    }

    if (newRows.length > 0) {
      setRows(newRows)
      setRecipeNameInput(`${recipe.name} (Fórmula panadera)`)
      setFeedback({
        type: 'success',
        text: `Se importaron ${newRows.length} insumos de "${recipe.name}".`,
      })
      setTimeout(() => setFeedback(null), 3000)
    }
    setIsImportModalOpen(false)
  }

  // Sincronizar porcentajes cuando se calculan en modo análisis
  const syncCalculatedPercentages = () => {
    if (!calculation.result) return
    const calculatedMap = new Map<string, number>()
    calculation.result.ingredients.forEach((ing) => {
      if (ing.id) calculatedMap.set(ing.id, ing.bakersPercentage)
    })

    setRows((prev) =>
      prev.map((r) => {
        const p = calculatedMap.get(r.id)
        if (p !== undefined) {
          return { ...r, bakersPercentage: Number(p.toFixed(2)) }
        }
        return r
      })
    )
  }

  // Copiar fórmula limpia al portapapeles
  const handleCopyClipboard = async () => {
    if (!calculation.result) return
    const res = calculation.result

    const lines: string[] = [
      `FÓRMULA PANADERA: ${recipeNameInput.trim() || 'Panadería artesanal'}`,
      `Harina total (100%): ${res.totalFlourWeightGrams.toFixed(1)} g`,
      `Hidratación panadera tradicional: ${res.traditionalHydrationPercentage.toFixed(1)}%`,
      res.estimatedTotalWaterPercentage !== res.traditionalHydrationPercentage
        ? `Aporte estimado total de agua: ${res.estimatedTotalWaterPercentage.toFixed(1)}%`
        : '',
      `Peso total de masa: ${res.totalDoughWeightGrams.toFixed(1)} g`,
      '',
      'DESGLOSE DE INGREDIENTES:',
      ...res.ingredients.map((ing) => {
        const share = ing.shareOfTotalFlour ? ` (${ing.shareOfTotalFlour.toFixed(1)}% del mix de harina)` : ''
        return `- ${ing.name}: ${ing.weightGrams.toFixed(1)} g | ${ing.bakersPercentage.toFixed(1)}%${share}`
      }),
    ].filter(Boolean)

    if (res.prefermentContribution) {
      lines.push(
        '',
        `PREFERMENTO: ${res.prefermentContribution.prefermentName}`,
        `- Peso: ${res.prefermentContribution.totalWeightGrams} g (Hidratación: ${res.prefermentContribution.hydrationPercentage}%)`,
        `- Aporta: ${res.prefermentContribution.flourGrams.toFixed(1)} g harina + ${res.prefermentContribution.waterGrams.toFixed(1)} g agua`
      )
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopiedClipboard(true)
      setTimeout(() => setCopiedClipboard(false), 2500)
    } catch {
      // Fallback
    }
  }

  // Guardar como nueva receta en Cocina Pro
  const handleSaveAsRecipe = async () => {
    if (!calculation.result || isSaving) return
    setIsSaving(true)
    setFeedback(null)

    try {
      const res = calculation.result
      const recipeName = recipeNameInput.trim() || 'Fórmula panadera artesanal'

      const newRecipe: Recipe = {
        name: recipeName,
        category: 'Panadería',
        description: `Fórmula panadera calculada con ${res.traditionalHydrationPercentage.toFixed(
          1
        )}% de hidratación tradicional y peso total de masa de ${res.totalDoughWeightGrams.toFixed(1)} g.`,
        yield_quantity: Number((res.totalDoughWeightGrams / 1000).toFixed(2)),
        yield_unit: 'kg',
        target_margin: 60,
        target_markup: 150,
        pricing_mode: 'margin',
        ingredients: res.ingredients.map((ing, idx) => ({
          id: `baker-ing-${idx}-${Date.now()}`,
          name: ing.name,
          quantity: Number(ing.weightGrams.toFixed(1)),
          unit: 'g',
          reference_quantity: 1,
          reference_unit: 'kg',
          reference_price: 0,
          calculated_cost: 0,
          waste_percentage: 0,
        })),
        additional_costs: [],
      }

      const defaultSteps = [
        {
          step_number: 1,
          instruction:
            'Autólisis: mezclar las harinas con el agua y dejar reposar 30 a 45 minutos para favorecer el desarrollo del gluten.',
          duration_minutes: 40,
        },
        {
          step_number: 2,
          instruction:
            'Amasado y sal: incorporar el prefermento, la sal y la levadura. Amasar hasta obtener una red de gluten elástica y suave.',
          duration_minutes: 15,
        },
        {
          step_number: 3,
          instruction:
            'Fermentación en bloque con pliegues (stretch and fold) cada 30 minutos durante las primeras 2 horas.',
          duration_minutes: 120,
        },
        {
          step_number: 4,
          instruction: 'División, preformado y formado final en banetones enharinados.',
          duration_minutes: 20,
        },
        {
          step_number: 5,
          instruction: 'Horneado con vapor a alta temperatura para lograr corteza crocante y miga aireada.',
          duration_minutes: 35,
          temperature_celsius: 230,
        },
      ]

      const saveRes = await saveRecipeServer(newRecipe, defaultSteps)
      if (saveRes.error || !saveRes.data) {
        setFeedback({
          type: 'error',
          text: saveRes.error || 'No se pudo guardar la receta.',
        })
      } else {
        setFeedback({
          type: 'success',
          text: `Receta "${saveRes.data.name}" guardada con éxito en tu recetario de Amasia.`,
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error guardando la receta.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const result = calculation.result

  return (
    <div className="space-y-6">
      {/* Encabezado contextual */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                Panadería técnica
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Base harina = 100%</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Calculadora de Porcentaje Panadero
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
              Diseñá, analizá y balanceá fórmulas para pan, pizzas y masas enriquecidas. La harina total
              define el 100 % de referencia sobre el cual se calculan los demás ingredientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {initialRecipes.length > 0 && (
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="btn-tactile inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors min-h-[44px] cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-brand" />
                <span>Importar receta</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyClipboard}
              disabled={!result}
              className="btn-tactile inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-50 transition-colors min-h-[44px] cursor-pointer"
              title="Copiar fórmula al portapapeles"
            >
              {copiedClipboard ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-600" />
                  <span>Copiar fórmula</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline hover:no-underline"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Selector de modo de trabajo */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
          Modo de formulación
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('analyze')
              syncCalculatedPercentages()
            }}
            className={`btn-tactile p-3 rounded-xl border text-left transition-all min-h-[44px] cursor-pointer ${
              mode === 'analyze'
                ? 'border-brand bg-purple-50/50 shadow-xs ring-1 ring-brand'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">1. Analizar fórmula</span>
            <span className="text-[11px] text-slate-700 mt-0.5 block leading-tight">
              Ingresá los gramos de cada ingrediente para calcular sus porcentajes e hidratación.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('from_flour')
              syncCalculatedPercentages()
            }}
            className={`btn-tactile p-3 rounded-xl border text-left transition-all min-h-[44px] cursor-pointer ${
              mode === 'from_flour'
                ? 'border-brand bg-purple-50/50 shadow-xs ring-1 ring-brand'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">2. Por cantidad de harina</span>
            <span className="text-[11px] text-slate-700 mt-0.5 block leading-tight">
              Fijá la harina base (100 %) y calculá las cantidades a partir de los porcentajes.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('from_total_dough')
              syncCalculatedPercentages()
            }}
            className={`btn-tactile p-3 rounded-xl border text-left transition-all min-h-[44px] cursor-pointer ${
              mode === 'from_total_dough'
                ? 'border-brand bg-purple-50/50 shadow-xs ring-1 ring-brand'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">3. Por peso total de masa</span>
            <span className="text-[11px] text-slate-700 mt-0.5 block leading-tight">
              Definí el peso final deseado (ej. 1800 g para 6 pizzas) y obtené la harina y agua exactas.
            </span>
          </button>
        </div>

        {/* Parámetros específicos según modo */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {mode === 'from_flour' && (
            <div className="flex items-center gap-3">
              <label htmlFor="target-flour-input" className="text-xs font-semibold text-slate-800">
                Harina base (100 %):
              </label>
              <div className="relative w-36">
                <input
                  id="target-flour-input"
                  type="number"
                  min="1"
                  step="10"
                  value={targetFlourGrams || ''}
                  onChange={(e) => setTargetFlourGrams(Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-700">
                  g
                </span>
              </div>
            </div>
          )}

          {mode === 'from_total_dough' && (
            <div className="flex items-center gap-3">
              <label htmlFor="target-dough-input" className="text-xs font-semibold text-slate-800">
                Peso total deseado:
              </label>
              <div className="relative w-36">
                <input
                  id="target-dough-input"
                  type="number"
                  min="10"
                  step="50"
                  value={targetDoughGrams || ''}
                  onChange={(e) => setTargetDoughGrams(Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-700">
                  g
                </span>
              </div>
            </div>
          )}

          {/* Plantillas rápidas */}
          <div className="flex items-center gap-1.5 ml-auto overflow-x-auto py-1">
            <span className="text-[11px] font-medium text-slate-700 hidden sm:inline">Plantillas:</span>
            {PRESET_FORMULAS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(preset)}
                className="btn-tactile px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap min-h-[36px] cursor-pointer"
              >
                {preset.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Balance y métricas destacadas de hidratación */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-700 mb-1">
              <span className="text-xs font-semibold">Harina total (100 %)</span>
              <Wheat className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
              {result.totalFlourWeightGrams.toFixed(1)} <span className="text-xs font-semibold text-slate-700">g</span>
            </div>
            <span className="text-[10px] text-slate-700 mt-0.5 block">Base de cálculo de la fórmula</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 shadow-xs">
            <div className="flex items-center justify-between text-brand mb-1">
              <span className="text-xs font-bold">Hidratación tradicional</span>
              <Droplets className="h-4 w-4 text-brand" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-brand tabular-nums">
              {result.traditionalHydrationPercentage.toFixed(1)} <span className="text-xs font-semibold">%</span>
            </div>
            <span className="text-[10px] text-slate-700 mt-0.5 block tabular-nums">
              {result.pureWaterGrams.toFixed(1)} g de agua pura
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-700 mb-1">
              <span className="text-xs font-semibold">Aporte total de agua</span>
              <Info className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
              {result.estimatedTotalWaterPercentage.toFixed(1)} <span className="text-xs font-semibold">%</span>
            </div>
            <span className="text-[10px] text-slate-700 mt-0.5 block tabular-nums">
              {result.estimatedWaterFromLiquidsGrams > 0
                ? `Incluye ${result.estimatedWaterFromLiquidsGrams.toFixed(1)} g de leche/huevos`
                : 'Coincide con el agua pura'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-700 mb-1">
              <span className="text-xs font-semibold">Peso total de masa</span>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
              {result.totalDoughWeightGrams.toFixed(1)} <span className="text-xs font-semibold">g</span>
            </div>
            <span className="text-[10px] text-slate-700 mt-0.5 block tabular-nums">
              {(result.totalDoughWeightGrams / 1000).toFixed(2)} kg rendimiento
            </span>
          </div>
        </div>
      )}

      {/* Error matemático si la fórmula no es válida */}
      {calculation.error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-bold">Ajustá los parámetros de la fórmula</h4>
            <p className="mt-0.5 leading-relaxed">{calculation.error}</p>
          </div>
        </div>
      )}

      {/* Tabla de ingredientes y porcentajes panaderos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ingredientes de la fórmula</h3>
            <p className="text-xs text-slate-700 mt-0.5">
              Marcá qué ingredientes son harinas de referencia. Podés tener varias harinas en un mix.
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-brand hover:bg-purple-100 text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar ingrediente</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Ingrediente</th>
                <th className="py-3 px-2 w-24 text-center">¿Es harina?</th>
                <th className="py-3 px-3 w-36 text-right">
                  {mode === 'analyze' ? 'Peso (g)' : 'Peso calculado'}
                </th>
                <th className="py-3 px-3 w-36 text-right">
                  {mode === 'analyze' ? '% Panadero' : '% Fijado'}
                </th>
                <th className="py-3 px-3 w-28 text-right hidden sm:table-cell">Aporte agua</th>
                <th className="py-3 px-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const calcIng = result?.ingredients.find((i) => i.id === row.id)
                const isWater = row.isWater || isWaterByName(row.name)

                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nombre del ingrediente */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.name}
                        placeholder="Ej. Harina 000, Agua, Sal..."
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand min-h-[40px]"
                      />
                      {calcIng?.shareOfTotalFlour !== undefined && (
                        <span className="text-[10px] text-amber-700 font-medium block mt-1 ml-1 tabular-nums">
                          Representa el {calcIng.shareOfTotalFlour.toFixed(1)} % del total de harinas
                        </span>
                      )}
                    </td>

                    {/* Checkbox de harina */}
                    <td className="py-2.5 px-2 text-center">
                      <label className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px]">
                        <input
                          type="checkbox"
                          checked={row.isFlour}
                          onChange={(e) => updateRow(row.id, { isFlour: e.target.checked })}
                          className="h-4 w-4 rounded text-brand focus:ring-brand border-slate-300"
                        />
                      </label>
                    </td>

                    {/* Peso en gramos */}
                    <td className="py-2.5 px-3 text-right">
                      {mode === 'analyze' ? (
                        <div className="relative inline-block w-full max-w-[130px]">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={row.weightGrams || ''}
                            onChange={(e) => updateRow(row.id, { weightGrams: Number(e.target.value) })}
                            className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand min-h-[40px]"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-700">
                            g
                          </span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                          {calcIng ? calcIng.weightGrams.toFixed(1) : '-'} <span className="text-xs text-slate-700">g</span>
                        </span>
                      )}
                    </td>

                    {/* Porcentaje panadero */}
                    <td className="py-2.5 px-3 text-right">
                      {mode === 'analyze' ? (
                        <span
                          className={`font-extrabold text-sm tabular-nums ${
                            row.isFlour ? 'text-amber-700' : isWater ? 'text-brand' : 'text-slate-800'
                          }`}
                        >
                          {calcIng ? calcIng.bakersPercentage.toFixed(1) : '-'} %
                        </span>
                      ) : (
                        <div className="relative inline-block w-full max-w-[130px]">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={row.bakersPercentage || ''}
                            onChange={(e) => updateRow(row.id, { bakersPercentage: Number(e.target.value) })}
                            className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand min-h-[40px]"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-700">
                            %
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Aporte de agua efectivo */}
                    <td className="py-2.5 px-3 text-right hidden sm:table-cell text-slate-700 font-medium">
                      {calcIng && calcIng.effectiveWaterGrams > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold tabular-nums">
                          <Droplets className="h-3 w-3 text-sky-500" />
                          <span>{calcIng.effectiveWaterGrams.toFixed(1)} g</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Eliminar fila */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        disabled={rows.length <= 1}
                        onClick={() => removeRow(row.id)}
                        className="btn-tactile p-2 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
                        title="Eliminar ingrediente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Módulo de Prefermento / Masa Madre con prevención de doble cómputo */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <input
              id="preferment-toggle"
              type="checkbox"
              checked={hasPreferment}
              onChange={(e) => setHasPreferment(e.target.checked)}
              className="h-4 w-4 rounded text-brand focus:ring-brand border-slate-300"
            />
            <label htmlFor="preferment-toggle" className="text-sm font-bold text-slate-900 cursor-pointer">
              Incorporar Prefermento / Masa Madre (Poolish, Biga o Levain)
            </label>
          </div>
          <span className="text-[11px] text-slate-700">Descompone harina y agua sin duplicar</span>
        </div>

        {hasPreferment && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre prefermento</label>
                <input
                  type="text"
                  value={prefermentName}
                  onChange={(e) => setPrefermentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Peso total (g)</label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={prefermentWeightGrams || ''}
                  onChange={(e) => setPrefermentWeightGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Hidratación (%)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={prefermentHydration || ''}
                  onChange={(e) => setPrefermentHydration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
                />
                <span className="text-[10px] text-slate-700 mt-1 block">100 % = proporciones 1:1</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="pref-already-included"
                type="checkbox"
                checked={prefermentAlreadyIncluded}
                onChange={(e) => setPrefermentAlreadyIncluded(e.target.checked)}
                className="h-4 w-4 rounded text-brand focus:ring-brand border-slate-300"
              />
              <label htmlFor="pref-already-included" className="text-xs text-slate-700 cursor-pointer">
                Ya incluí la harina y el agua del prefermento en la lista de arriba (solo calcular desglose informativo)
              </label>
            </div>

            {/* Resultado de la descomposición */}
            {result?.prefermentContribution && (
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs space-y-1">
                <div className="font-bold text-brand">
                  Desglose técnico de {result.prefermentContribution.prefermentName}:
                </div>
                <div className="text-slate-800">
                  Aporta{' '}
                  <strong className="text-slate-900">
                    {result.prefermentContribution.flourGrams.toFixed(1)} g de harina
                  </strong>{' '}
                  y{' '}
                  <strong className="text-slate-900">
                    {result.prefermentContribution.waterGrams.toFixed(1)} g de agua
                  </strong>
                  .
                </div>
                <div className="text-[11px] text-slate-700">{result.prefermentContribution.note}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones: Guardar como receta en Cocina Pro */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1 max-w-md">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
            Guardar fórmula en el recetario
          </label>
          <input
            type="text"
            value={recipeNameInput}
            placeholder="Ej. Pan de masa madre 70% hidratación"
            onChange={(e) => setRecipeNameInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
          />
        </div>

        <button
          type="button"
          disabled={!result || isSaving}
          onClick={handleSaveAsRecipe}
          className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors min-h-[44px] cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando en Amasia...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar en Amasia</span>
            </>
          )}
        </button>
      </div>

      {/* Modal para importar desde receta existente */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Importar insumos de una receta</h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-700">
              Seleccioná una receta de tu recetario para volcar sus ingredientes en la calculadora panadera.
              La receta original no será modificada.
            </p>

            <input
              type="text"
              placeholder="Buscar receta por nombre o categoría..."
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand min-h-[40px]"
            />

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 border border-slate-100 rounded-xl">
              {initialRecipes
                .filter(
                  (r) =>
                    !recipeSearch ||
                    r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
                    (r.category || '').toLowerCase().includes(recipeSearch.toLowerCase())
                )
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleImportRecipe(r)}
                    className="w-full p-3 text-left hover:bg-purple-50/50 flex items-center justify-between transition-colors min-h-[44px]"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{r.name}</span>
                      <span className="text-[11px] text-slate-700 capitalize">
                        {r.category || 'General'} • {r.ingredients.length} insumos
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-brand" />
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
