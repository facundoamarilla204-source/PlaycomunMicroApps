import { Construction } from "lucide-react"

export default function PlaceholderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center h-[60vh]">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand mb-6">
        <Construction className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
        Próximamente
      </h1>
      <p className="text-lg text-foreground-muted max-w-md">
        Esta página está en desarrollo y estará disponible muy pronto.
      </p>
    </div>
  )
}
