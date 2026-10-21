'use client'

import { useState, useMemo } from 'react'
import {
  X,
  Scale,
  Maximize2,
  FileDown,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react'
import { Recipe } from '@/lib/costo-receta'
import {
  scaleRecipeByFactor,
  scaleRecipeByYield,
  scaleRecipeByTargetWeight,
  ScaledRecipeResult,
  formatCulinaryQuantity,
} from '@/lib/gastronomia/scaling'
import {
  Mold,
  calculateMoldScaleFactor,
  MoldScalingResult,
} from '@/lib/gastronomia/mold-scaling'
import { exportSingleRecipePdf } from '@/lib/recipePdf'
import { saveRecipeServer } from '@/app/actions/recipes'
import { MassUnit } from '@/lib/gastronomia/conversions'

interface RecipeScaleModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe | null
  onRecipeSaved?: (newRecipe: Recipe) => void
}

type MainTab = 'proportional' | 'mold'
type ScaleMode = 'yield' | 'factor' | 'weight'

export function RecipeScaleModal({
  isOpen,
  onClose,
  recipe,
  onRecipeSaved,
}: RecipeScaleModalProps) {
  // Pestaña principal: Escalado proporcional vs Adaptador de moldes
  const [activeTab, setActiveTab] = useState<MainTab>('proportional')

  // Estado escalado proporcional
  const [scaleMode, setScaleMode] = useState<ScaleMode>('yield')
  const [targetYield, setTargetYield] = useState<number>(
    (recipe?.yield_quantity && recipe.yield_quantity > 0) ? recipe.yield_quantity * 2 : 2
  )
  const [directFactor, setDirectFactor] = useState<number>(2)
  const [targetWeight, setTargetWeight] = useState<number>(1000)
  const [targetWeightUnit, setTargetWeightUnit] = useState<MassUnit>('g')

  // Estado adaptador de moldes
  const [sourceShape, setSourceShape] = useState<'round' | 'square' | 'rectangular'>('round')
  const [sourceDiameter, setSourceDiameter] = useState<number>(20)
  const [sourceSide, setSourceSide] = useState<number>(20)
  const [sourceLength, setSourceLength] = useState<number>(25)
  const [sourceWidth, setSourceWidth] = useState<number>(15)
  const [sourceHeight, setSourceHeight] = useState<number>(5)

  const [targetShape, setTargetShape] = useState<'round' | 'square' | 'rectangular'>('round')
  const [targetDiameter, setTargetDiameter] = useState<number>(26)
  const [targetSide, setTargetSide] = useState<number>(24)
  const [targetLength, setTargetLength] = useState<number>(30)
  const [targetWidth, setTargetWidth] = useState<number>(20)
  const [targetHeight, setTargetHeight] = useState<number>(5)

  const [considerHeight, setConsiderHeight] = useState<boolean>(false)

  // Guardado como nueva receta
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null)

  // 1. Cálculo de molde
  const moldResult = useMemo((): { result: MoldScalingResult | null; error: string | null } => {
    if (activeTab !== 'mold') return { result: null, error: null }

    try {
      const sourceMold: Mold =
        sourceShape === 'round'
          ? { shape: 'round', diameter: sourceDiameter, height: sourceHeight > 0 ? sourceHeight : undefined }
          : sourceShape === 'square'
          ? { shape: 'square', side: sourceSide, height: sourceHeight > 0 ? sourceHeight : undefined }
          : { shape: 'rectangular', length: sourceLength, width: sourceWidth, height: sourceHeight > 0 ? sourceHeight : undefined }

      const targetMold: Mold =
        targetShape === 'round'
          ? { shape: 'round', diameter: targetDiameter, height: targetHeight > 0 ? targetHeight : undefined }
          : targetShape === 'square'
          ? { shape: 'square', side: targetSide, height: targetHeight > 0 ? targetHeight : undefined }
          : { shape: 'rectangular', length: targetLength, width: targetWidth, height: targetHeight > 0 ? targetHeight : undefined }

      const res = calculateMoldScaleFactor(sourceMold, targetMold, { considerHeight })
      return { result: res, error: null }
    } catch (err: any) {
      return { result: null, error: err.message || 'Error en las dimensiones del molde.' }
    }
  }, [
    activeTab,
    sourceShape,
    sourceDiameter,
    sourceSide,
    sourceLength,
    sourceWidth,
    sourceHeight,
    targetShape,
    targetDiameter,
    targetSide,
    targetLength,
    targetWidth,
    targetHeight,
    considerHeight,
  ])

  // 2. Cálculo escalado de ingredientes
  const scaledData = useMemo((): {
    scaled: ScaledRecipeResult | null
    error: string | null
    effectiveFactor: number
  } => {
    if (!recipe) return { scaled: null, error: null, effectiveFactor: 1 }

    try {
      if (activeTab === 'mold') {
        if (!moldResult.result) {
          return { scaled: null, error: moldResult.error, effectiveFactor: 1 }
        }
        const factor = moldResult.result.scaleFactor
        const scaled = scaleRecipeByFactor(recipe as any, factor, { calculatePracticalQuantities: true })
        return { scaled, error: null, effectiveFactor: factor }
      }

      // Modo proporcional
      if (scaleMode === 'yield') {
        const scaled = scaleRecipeByYield(recipe as any, targetYield, recipe.yield_unit, {
          calculatePracticalQuantities: true,
        })
        return { scaled, error: null, effectiveFactor: scaled.scaleFactor }
      }

      if (scaleMode === 'factor') {
        const scaled = scaleRecipeByFactor(recipe as any, directFactor, {
          calculatePracticalQuantities: true,
        })
        return { scaled, error: null, effectiveFactor: directFactor }
      }

      if (scaleMode === 'weight') {
        const scaled = scaleRecipeByTargetWeight(recipe as any, targetWeight, targetWeightUnit, {
          calculatePracticalQuantities: true,
        })
        return { scaled, error: null, effectiveFactor: scaled.scaleFactor }
      }

      return { scaled: null, error: 'Modo no reconocido', effectiveFactor: 1 }
    } catch (err: any) {
      return { scaled: null, error: err.message || 'Error calculando escalado.', effectiveFactor: 1 }
    }
  }, [recipe, activeTab, scaleMode, targetYield, directFactor, targetWeight, targetWeightUnit, moldResult])

  // Descargar PDF escalado
  const handleExportPdf = () => {
    if (!scaledData.scaled || !recipe) return

    const factorStr = scaledData.effectiveFactor.toFixed(2)
    const scaledRecipeForPdf: Recipe = {
      ...recipe,
      category: recipe.category || 'General',
      description: recipe.description || '',
      name: `${recipe.name} (Escalada ${factorStr}x)`,
      yield_quantity: Number(scaledData.scaled.targetYield.toFixed(2)),
      ingredients: scaledData.scaled.scaledRecipe.ingredients.map((ing, idx) => ({
        ...ing,
        id: ing.id || `scaled-pdf-${idx}-${Date.now()}`,
        unit: ing.unit as any,
        reference_unit: (ing.reference_unit || ing.unit) as any,
        reference_quantity: ing.reference_quantity || 1,
        reference_price: ing.reference_price || 0,
        quantity: ing.mathematical_quantity,
        calculated_cost: Number((ing.calculated_cost || 0) * scaledData.effectiveFactor),
      })),
      additional_costs: (scaledData.scaled.scaledRecipe.additional_costs || []).map((c, idx) => ({
        ...c,
        id: c.id || `scaled-add-${idx}-${Date.now()}`,
        amount: Number(c.amount || 0),
      })),
    }

    exportSingleRecipePdf(scaledRecipeForPdf, {
      steps: recipe.steps,
      priceSourceNote: `Fórmula escalada por factor ${factorStr}x (${activeTab === 'mold' ? 'Adaptación de molde' : 'Escalado proporcional'}).`,
    })
  }

  // Guardar como nueva receta independiente
  const handleSaveAsNewRecipe = async () => {
    if (!scaledData.scaled || !recipe || isSaving) return
    setIsSaving(true)
    setSaveErrorMsg(null)
    setSaveSuccessMsg(null)

    try {
      const factorStr = scaledData.effectiveFactor.toFixed(2)
      const newRecipePayload: Recipe = {
        name: `${recipe.name} (Escalada ${factorStr}x)`,
        category: recipe.category || 'General',
        description: `Receta derivada de "${recipe.name}" escalada con factor ${factorStr}x mediante ${
          activeTab === 'mold' ? 'adaptador de moldes' : 'escalador proporcional'
        }.`,
        yield_quantity: Number(scaledData.scaled.targetYield.toFixed(2)),
        yield_unit: recipe.yield_unit,
        target_margin: recipe.target_margin,
        target_markup: recipe.target_markup,
        pricing_mode: recipe.pricing_mode,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        rest_time_minutes: recipe.rest_time_minutes,
        baking_temperature_celsius: recipe.baking_temperature_celsius,
        baking_loss_percentage: recipe.baking_loss_percentage,
        ingredients: scaledData.scaled.scaledRecipe.ingredients.map((ing, idx) => ({
          id: `scaled-ing-${idx}-${Date.now()}`,
          name: ing.name,
          quantity: ing.mathematical_quantity,
          unit: ing.unit as any,
          reference_quantity: ing.reference_quantity || 1,
          reference_unit: (ing.reference_unit || ing.unit) as any,
          reference_price: ing.reference_price || 0,
          calculated_cost: ing.calculated_cost ? Number((ing.calculated_cost * scaledData.effectiveFactor).toFixed(4)) : 0,
          ingredient_id: ing.ingredient_id ?? null,
          waste_percentage: ing.waste_percentage ?? 0,
        })),
        additional_costs: (recipe.additional_costs || []).map((c, idx) => ({
          id: `scaled-add-${idx}-${Date.now()}`,
          name: c.name,
          amount: Number(c.amount || 0),
        })),
        steps: recipe.steps,
      }

      const res = await saveRecipeServer(
        newRecipePayload,
        recipe.steps?.map((s) => ({
          step_number: s.step_number,
          instruction: s.instruction,
          duration_minutes: s.duration_minutes,
          temperature_celsius: s.temperature_celsius,
          equipment: s.equipment,
          notes: s.notes,
        }))
      )

      if (res.error || !res.data) {
        setSaveErrorMsg(res.error || 'No se pudo guardar la receta escalada.')
      } else {
        setSaveSuccessMsg(`Receta "${res.data.name}" guardada con éxito en tu biblioteca.`)
        if (onRecipeSaved) onRecipeSaved(res.data)
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Error guardando la receta derivada.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !recipe) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scale-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 ease-out">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-brand flex items-center justify-center font-bold shadow-xs">
              <Scale className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h2 id="scale-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                Escalar receta y adaptar moldes
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Receta original: <span className="font-semibold text-slate-900">{recipe.name}</span> (Rinde {recipe.yield_quantity} {recipe.yield_unit})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Cerrar modal de escalado"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas de modo principal */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('proportional')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'proportional'
                ? 'border-brand text-brand bg-purple-50/50'
                : 'border-transparent text-slate-700 hover:text-slate-900'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Escalado Proporcional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mold')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'mold'
                ? 'border-brand text-brand bg-purple-50/50'
                : 'border-transparent text-slate-700 hover:text-slate-900'
            }`}
          >
            <Maximize2 className="h-4 w-4" />
            <span>Adaptador de Moldes</span>
          </button>
        </div>

        {/* Mensajes de feedback */}
        {saveSuccessMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
          {/* TAB 1: ESCALADO PROPORCIONAL */}
          {activeTab === 'proportional' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScaleMode('yield')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    scaleMode === 'yield'
                      ? 'border-brand bg-purple-50/70 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold block">Por rendimiento</span>
                  <span className="text-[11px] text-slate-700 block mt-0.5">
                    Definir cantidad de porciones o unidades
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScaleMode('factor')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    scaleMode === 'factor'
                      ? 'border-brand bg-purple-50/70 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold block">Por factor directo</span>
                  <span className="text-[11px] text-slate-700 block mt-0.5">
                    Multiplicador directo (ej. 1.5x, 2x, 0.5x)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScaleMode('weight')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    scaleMode === 'weight'
                      ? 'border-brand bg-purple-50/70 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold block">Por peso final</span>
                  <span className="text-[11px] text-slate-700 block mt-0.5">
                    Masa total objetivo en gramos o kilos
                  </span>
                </button>
              </div>

              {/* Controles del modo seleccionado */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                {scaleMode === 'yield' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label htmlFor="target-yield-input" className="text-xs font-semibold text-slate-800 shrink-0">
                      Rendimiento deseado ({recipe.yield_unit}):
                    </label>
                    <input
                      id="target-yield-input"
                      type="number"
                      step="any"
                      min="0.1"
                      value={targetYield || ''}
                      onChange={(e) => setTargetYield(Number(e.target.value) || 0)}
                      className="w-36 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <span>Original: {recipe.yield_quantity} {recipe.yield_unit}</span>
                      <span>•</span>
                      <span className="font-semibold text-brand">
                        Factor calculado: {scaledData.effectiveFactor.toFixed(3)}x
                      </span>
                    </div>
                  </div>
                )}

                {scaleMode === 'factor' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label htmlFor="direct-factor-input" className="text-xs font-semibold text-slate-800 shrink-0">
                      Factor multiplicador:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="direct-factor-input"
                        type="number"
                        step="0.1"
                        min="0.01"
                        value={directFactor || ''}
                        onChange={(e) => setDirectFactor(Number(e.target.value) || 0)}
                        className="w-28 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                      />
                      <div className="flex items-center gap-1">
                        {[0.5, 1.5, 2, 3].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setDirectFactor(f)}
                            className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                              directFactor === f
                                ? 'bg-brand text-white'
                                : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                            }`}
                          >
                            {f}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {scaleMode === 'weight' && (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <label htmlFor="target-weight-input" className="text-xs font-semibold text-slate-800 shrink-0">
                        Peso total deseado:
                      </label>
                      <input
                        id="target-weight-input"
                        type="number"
                        step="any"
                        min="1"
                        value={targetWeight || ''}
                        onChange={(e) => setTargetWeight(Number(e.target.value) || 0)}
                        className="w-32 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                      />
                      <select
                        value={targetWeightUnit}
                        onChange={(e) => setTargetWeightUnit(e.target.value as MassUnit)}
                        className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                        aria-label="Unidad de peso deseado"
                      >
                        <option value="g">Gramos (g)</option>
                        <option value="kg">Kilogramos (kg)</option>
                      </select>
                      <span className="text-xs font-semibold text-brand">
                        Factor: {scaledData.effectiveFactor.toFixed(3)}x
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Nota: Para escalar por peso total, todos los ingredientes deben poder convertirse a masa (unidades con peso unitario conocido o volúmenes con densidad).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADAPTADOR DE MOLDES */}
          {activeTab === 'mold' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Molde Original */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                    Molde original de la receta
                  </span>

                  <div>
                    <label className="text-xs text-slate-700 block mb-1">Forma geométrica:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['round', 'square', 'rectangular'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSourceShape(s)}
                          className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                            sourceShape === s
                              ? 'bg-purple-100 text-brand border-brand'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {s === 'round' ? 'Redondo' : s === 'square' ? 'Cuadrado' : 'Rectangular'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sourceShape === 'round' && (
                    <div>
                      <label className="text-xs text-slate-700 block mb-1">Diámetro (cm):</label>
                      <input
                        type="number"
                        min="1"
                        value={sourceDiameter || ''}
                        onChange={(e) => setSourceDiameter(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                      />
                    </div>
                  )}

                  {sourceShape === 'square' && (
                    <div>
                      <label className="text-xs text-slate-700 block mb-1">Lado (cm):</label>
                      <input
                        type="number"
                        min="1"
                        value={sourceSide || ''}
                        onChange={(e) => setSourceSide(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                      />
                    </div>
                  )}

                  {sourceShape === 'rectangular' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-700 block mb-1">Largo (cm):</label>
                        <input
                          type="number"
                          min="1"
                          value={sourceLength || ''}
                          onChange={(e) => setSourceLength(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-700 block mb-1">Ancho (cm):</label>
                        <input
                          type="number"
                          min="1"
                          value={sourceWidth || ''}
                          onChange={(e) => setSourceWidth(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-700 block mb-1">Altura opcional (cm):</label>
                    <input
                      type="number"
                      min="0"
                      value={sourceHeight || ''}
                      onChange={(e) => setSourceHeight(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Molde Destino */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                  <span className="text-xs font-bold text-brand block uppercase tracking-wider">
                    Molde destino deseado
                  </span>

                  <div>
                    <label className="text-xs text-slate-700 block mb-1">Forma geométrica:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['round', 'square', 'rectangular'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTargetShape(s)}
                          className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                            targetShape === s
                              ? 'bg-brand text-white border-brand'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {s === 'round' ? 'Redondo' : s === 'square' ? 'Cuadrado' : 'Rectangular'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {targetShape === 'round' && (
                    <div>
                      <label className="text-xs text-slate-700 block mb-1">Diámetro (cm):</label>
                      <input
                        type="number"
                        min="1"
                        value={targetDiameter || ''}
                        onChange={(e) => setTargetDiameter(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                      />
                    </div>
                  )}

                  {targetShape === 'square' && (
                    <div>
                      <label className="text-xs text-slate-700 block mb-1">Lado (cm):</label>
                      <input
                        type="number"
                        min="1"
                        value={targetSide || ''}
                        onChange={(e) => setTargetSide(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                      />
                    </div>
                  )}

                  {targetShape === 'rectangular' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-700 block mb-1">Largo (cm):</label>
                        <input
                          type="number"
                          min="1"
                          value={targetLength || ''}
                          onChange={(e) => setTargetLength(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-700 block mb-1">Ancho (cm):</label>
                        <input
                          type="number"
                          min="1"
                          value={targetWidth || ''}
                          onChange={(e) => setTargetWidth(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-700 block mb-1">Altura opcional (cm):</label>
                    <input
                      type="number"
                      min="0"
                      value={targetHeight || ''}
                      onChange={(e) => setTargetHeight(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Opción de volumen vs superficie */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Modo de cálculo</span>
                  <span className="text-[11px] text-slate-700 block mt-0.5">
                    {considerHeight
                      ? 'Relación de volúmenes: adapta la masa según la capacidad volumétrica tridimensional.'
                      : 'Relación de áreas de base: conserva exactamente la altura y grosor original de la preparación.'}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={considerHeight}
                    onChange={(e) => setConsiderHeight(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span className="font-semibold text-slate-800">Considerar alturas</span>
                </label>
              </div>

              {/* Advertencia técnica de pastelería sobre horneado */}
              {moldResult.result && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-semibold">Nota técnica de horneado</p>
                    <p className="mt-0.5 text-amber-900">{moldResult.result.bakingNote}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error de cálculo si ocurrió */}
          {scaledData.error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No se puede calcular el escalado</p>
                <p className="mt-1 leading-relaxed">{scaledData.error}</p>
              </div>
            </div>
          )}

          {/* TABLA COMPARATIVA DE RESULTADOS */}
          {scaledData.scaled && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Desglose de cantidades escaladas ({scaledData.scaled.scaledRecipe.ingredients.length} insumos)
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-purple-100 text-brand font-bold">
                    Factor aplicado: {scaledData.effectiveFactor.toFixed(3)}x
                  </span>
                  <span className="text-slate-700">
                    Rinde resultante: {formatCulinaryQuantity(scaledData.scaled.targetYield)} {recipe.yield_unit}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Ingrediente</th>
                        <th className="py-2.5 px-3 text-right">Cantidad original</th>
                        <th className="py-2.5 px-3 text-right">Matemática exacta</th>
                        <th className="py-2.5 px-3 text-right font-extrabold text-brand">Práctica de producción</th>
                        <th className="py-2.5 px-3 text-center">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scaledData.scaled.scaledRecipe.ingredients.map((ing, idx) => (
                        <tr key={ing.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {ing.name}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                            {formatCulinaryQuantity(ing.original_quantity)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 font-medium tabular-nums">
                            {ing.mathematical_quantity.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-brand bg-purple-50/40 tabular-nums">
                            {formatCulinaryQuantity(ing.practical_quantity)}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700">
                            {ing.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 italic">
                * La cantidad práctica redondea enteros para piezas (ej. huevos) y decimales comerciales para gramos y mililitros.
              </p>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!scaledData.scaled}
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors min-h-[44px] disabled:opacity-50 btn-tactile"
            >
              <FileDown className="h-4 w-4" />
              <span>Exportar PDF escalado</span>
            </button>

            <button
              type="button"
              disabled={!scaledData.scaled || isSaving}
              onClick={handleSaveAsNewRecipe}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-xs min-h-[44px] disabled:opacity-50 btn-tactile"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              <span>Guardar como nueva receta</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-300 transition-colors min-h-[44px] btn-tactile"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
