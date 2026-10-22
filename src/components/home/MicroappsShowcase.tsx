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
          <h2 id="microapps-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Conocé nuestras microapps
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-foreground-muted sm:text-base">
            Aplicaciones diseñadas para resolver tareas específicas con herramientas más completas y especializadas.
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
