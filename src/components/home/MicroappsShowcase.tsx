import { getActiveMicroapps } from '@/data/microapps'
import { MicroappCard } from '@/components/microapps/MicroappCard'

/**
 * Sección de microapps del inicio. Consume el mismo catálogo que /microapps
 * (`src/data/microapps.ts`): registrar una app allí la suma acá sin tocar JSX.
 *
 * Las tarjetas fluyen con flex-wrap: una app ocupa todo el ancho, y a medida que
 * el catálogo crece se reparten en 2 o 3 columnas; la última fila se estira para
 * no dejar huecos.
 */
export default function MicroappsShowcase() {
  const apps = getActiveMicroapps()
  if (apps.length === 0) return null

  return (
    <section aria-labelledby="microapps-heading" className="bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Entornos de trabajo
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">PlayComun Online</span>
          </div>
          <h2 id="microapps-heading" className="font-display text-2xl font-normal tracking-normal text-foreground sm:text-3xl">
            Microapps especializadas
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-foreground-muted sm:text-base leading-relaxed">
            Espacios de trabajo completos con base de datos, historial y herramientas técnicas para rubros que necesitan más que una calculadora rápida.
          </p>
        </div>

        <ul role="list" className="flex flex-wrap gap-6">
          {apps.map((app) => (
            <li key={app.id} className="min-w-0 grow basis-[22rem]">
              <MicroappCard app={app} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
