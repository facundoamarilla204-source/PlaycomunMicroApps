import Link from 'next/link'
import type { Microapp } from '@/data/microapps'
import { MicroappIcon } from './MicroappIcon'

const MAX_MODULES = 4

/**
 * Tarjeta de microapp para el inicio.
 *
 * - Toda la tarjeta navega: el enlace del CTA se extiende con `after:inset-0`,
 *   así no hay enlaces anidados ni dos destinos posibles.
 * - Container queries: la composición depende del ancho de la tarjeta, no de la
 *   pantalla. Una sola app ocupa el ancho completo (texto + índice lado a lado);
 *   varias apps se apilan en columnas más angostas sin romper la jerarquía.
 * - El índice de la derecha se arma con los módulos reales ya disponibles.
 */
export function MicroappCard({ app }: { app: Microapp }) {
  const titleId = `microapp-${app.id}-title`
  const availableModules = app.modules
    .filter((module) => module.status === 'disponible')
    .slice(0, MAX_MODULES)

  return (
    <article
      aria-labelledby={titleId}
      className="@container group relative h-full overflow-hidden rounded-2xl border border-border bg-white transition-colors duration-150 motion-reduce:transition-none hover:border-brand-border focus-within:border-brand"
    >
      <div className="flex h-full flex-col @2xl:flex-row">
        <div className="flex flex-1 flex-col p-6 @xl:p-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center">
              <MicroappIcon name={app.icon} className="h-12 w-12" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                  Gastronomía
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-medium text-slate-500">Suite Pro</span>
              </div>
              <h3 id={titleId} className="text-xl font-bold tracking-tight text-foreground @xl:text-2xl">
                {app.name}
              </h3>
            </div>
          </div>

          <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground-muted @xl:text-base">
            {app.summary ?? app.tagline}
          </p>

          <div className="mt-auto pt-6">
            <Link
              href={app.url}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 motion-reduce:transition-none hover:bg-brand-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 after:absolute after:inset-0 after:content-['']"
            >
              <span>Abrir {app.name}</span>
            </Link>
          </div>
        </div>

        {availableModules.length > 0 && (
          <div className="border-t border-border bg-slate-50/70 p-6 @xl:p-8 @2xl:w-[44%] @2xl:shrink-0 @2xl:border-l @2xl:border-t-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Módulos incluidos</h4>
            <ul className="mt-3 divide-y divide-border">
              {availableModules.map((module) => (
                <li key={module.title} className="py-2.5 text-sm text-foreground-muted first:pt-0 last:pb-0">
                  {module.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}
