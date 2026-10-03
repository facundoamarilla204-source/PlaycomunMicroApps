import { Shield, Lock, MapPin } from "lucide-react"

export default function TrustStrip() {
  return (
    <section className="bg-brand-light py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Gratis y sin registro</h3>
            <p className="text-foreground-muted">
              Usá las herramientas que necesitás, cuando las necesitás.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No guardamos tus datos</h3>
            <p className="text-foreground-muted">
              Tu información siempre es tuya.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-sm">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Pensadas para Argentina</h3>
            <p className="text-foreground-muted">
              Con valores, impuestos y formatos locales.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
