import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Layers,
  BookOpen,
  Plus,
  ArrowRight,
  Wheat,
  Scale,
  Flame,
  ArrowUpRight,
  Clock,
} from 'lucide-react'
import { getKitchenIngredientsCountServer, getKitchenIngredientsServer } from '@/app/actions/kitchen-ingredients'
import { getUserRecipesServer } from '@/app/actions/recipes'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inicio · Cocina Pro',
  description: 'Panel de control de tu espacio gastronómico Cocina Pro.',
}

export default async function CocinaProHomePage() {
  const [ingredientsCount, ingredientsResult, recipesResult] = await Promise.all([
    getKitchenIngredientsCountServer(),
    getKitchenIngredientsServer(),
    getUserRecipesServer(),
  ])

  const recipes = recipesResult.data || []
  const ingredients = ingredientsResult.data || []
  const recentRecipes = recipes.slice(0, 5)
  const recentIngredients = ingredients.slice(0, 5)

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Encabezado operativo del espacio */}
      <header className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                Cocina Pro
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Panel Operativo</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Tu obrador y recetario
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
              Formulá recetas técnicas con rigor matemático, adaptá moldes, balanceá porcentajes panaderos y seguí la elaboración paso a paso.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/cocina-pro/recetas/nueva"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors min-h-[44px] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva receta</span>
            </Link>
            <Link
              href="/cocina-pro/panaderia"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors min-h-[44px]"
            >
              <Wheat className="h-4 w-4 text-amber-600" />
              <span>Calculadora panadera</span>
            </Link>
          </div>
        </div>

        {/* Barra de pulso operativo: 4 métricas conectadas directamente a sus herramientas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <Link
            href="/cocina-pro/recetas"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Recetas</span>
              <BookOpen className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {recipes.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Fichas con costeo y moldes
            </p>
          </Link>

          <Link
            href="/cocina-pro/ingredientes"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Insumos</span>
              <Layers className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {ingredientsCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Precios vigentes auditados
            </p>
          </Link>

          <Link
            href="/cocina-pro/panaderia"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Panadería</span>
              <Wheat className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-base font-bold text-slate-900 mt-1 truncate">
              % Panadero
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Fórmulas e hidratación
            </p>
          </Link>

          <Link
            href="/herramientas/costo-receta"
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Costeo Rápido</span>
              <Scale className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
            </div>
            <div className="text-base font-bold text-slate-900 mt-1 truncate">
              Márgenes y Mermas
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Calculadora financiera
            </p>
          </Link>
        </div>
      </header>

      {/* Columnas operativas: Recetas recientes e Insumos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Recetario */}
        <section
          aria-label="Recetario reciente"
          className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand shrink-0" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-slate-900">
                  Recetario reciente ({recipes.length})
                </h2>
              </div>
              <Link
                href="/cocina-pro/recetas"
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recipes.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                  Aún no tenés recetas guardadas
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Creá tu primera preparación técnica para calcular costos de materias primas y pasos de elaboración.
                </p>
                <Link
                  href="/cocina-pro/recetas/nueva"
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Crear receta</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-1">
                {recentRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/cocina-pro/recetas?id=${recipe.id}`}
                        className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-brand truncate block"
                      >
                        {recipe.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span className="capitalize">{recipe.category || 'General'}</span>
                        <span>•</span>
                        <span className="tabular-nums">
                          Rinde {recipe.yield_quantity} {recipe.yield_unit}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">
                          {recipe.ingredients.length} insumos
                        </span>
                        {recipe.subrecipes && recipe.subrecipes.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-brand font-medium">
                              +{recipe.subrecipes.length} subrecetas
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/cocina-pro/elaboracion/${recipe.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200/60 transition-colors"
                        title="Modo elaboración en cocina"
                      >
                        <Flame className="h-3 w-3 text-amber-600" />
                        <span>Elaborar</span>
                      </Link>
                      <Link
                        href={`/cocina-pro/recetas?id=${recipe.id}`}
                        className="text-[11px] font-semibold text-slate-600 hover:text-brand px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Ficha
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sincronizado con biblioteca de ingredientes</span>
            <Link
              href="/cocina-pro/recetas/nueva"
              className="text-brand hover:underline font-semibold inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Añadir receta</span>
            </Link>
          </div>
        </section>

        {/* Columna Insumos */}
        <section
          aria-label="Insumos recientes"
          className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand shrink-0" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-slate-900">
                  Insumos recientes ({ingredientsCount})
                </h2>
              </div>
              <Link
                href="/cocina-pro/ingredientes"
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {ingredients.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                  Tu biblioteca está vacía
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Registrá tus ingredientes habituales con precio de compra para reutilizarlos en todas tus recetas.
                </p>
                <Link
                  href="/cocina-pro/ingredientes?action=nuevo"
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nuevo insumo</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-1">
                {recentIngredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/cocina-pro/ingredientes?id=${ing.id}`}
                        className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-brand truncate block"
                      >
                        {ing.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="capitalize">{ing.category || 'General'}</span>
                        <span>•</span>
                        <span className="tabular-nums">
                          {ing.package_quantity} {ing.package_unit}
                        </span>
                        {ing.brand && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{ing.brand}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                        ${Number(ing.current_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <Link
                        href={`/cocina-pro/ingredientes?id=${ing.id}`}
                        className="text-[11px] font-medium text-slate-500 hover:text-brand transition-colors block"
                      >
                        Historial
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Precios con trazabilidad cronológica</span>
            <Link
              href="/cocina-pro/ingredientes?action=nuevo"
              className="text-brand hover:underline font-semibold inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Añadir insumo</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

