import { Calculator, Shield, Percent } from "lucide-react"

export default function TrustStrip() {
  return (
    <section className="bg-brand-light py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          <div className="flex flex-col items-start text-left">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">Reglas argentinas actualizadas</h3>
            <p className="text-foreground-muted leading-relaxed">
              Calculá con IVA al 21%, 10,5% o 27%. Proyectá aguinaldos considerando la fecha límite del 18 de diciembre.
            </p>
          </div>

          <div className="flex flex-col items-start text-left">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
              <Percent className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">Costos y comisiones reales</h3>
            <p className="text-foreground-muted leading-relaxed">
              Definí precios considerando las retenciones de Mercado Pago y los costos logísticos locales. Nada de estimaciones al aire.
            </p>
          </div>

          <div className="flex flex-col items-start text-left">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">Privacidad por defecto</h3>
            <p className="text-foreground-muted leading-relaxed">
              Las herramientas básicas corren en tu navegador y no guardan lo que ingresás. Si creás una cuenta, vos controlás tus favoritos.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
