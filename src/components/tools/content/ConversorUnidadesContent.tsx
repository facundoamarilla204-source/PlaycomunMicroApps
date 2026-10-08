import React from 'react'
import Link from 'next/link'
import { ArrowRight, Calculator } from 'lucide-react'

export function ConversorUnidadesContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Sobre el Conversor de Unidades
        </h2>
        <div className="prose prose-neutral max-w-none text-neutral-600 space-y-4">
          <p>
            El <strong>Conversor de Unidades</strong> de PlayComun es una herramienta diseñada para realizar conversiones rápidas y precisas entre diferentes sistemas de medida. Ya sea que necesites convertir kilómetros a millas, celsius a fahrenheit, o gigabytes a gibibytes, podés hacerlo al instante y sin complicaciones.
          </p>
          <p>
            Nuestra herramienta cubre las categorías más utilizadas: longitud, masa o peso, volumen, área, temperatura, velocidad, tiempo, almacenamiento de datos (decimal y binario), presión, energía, potencia y ángulos. Los cálculos se realizan en tiempo real mientras tipeás, proporcionando resultados inmediatos formateados de forma inteligente para evitar números incomprensibles.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-neutral-900 mb-6">
          Preguntas Frecuentes
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200">
            <h4 className="font-semibold text-neutral-900 mb-2">¿Cómo copio el resultado?</h4>
            <p className="text-sm text-neutral-600">
              Una vez que se muestra la conversión, podés utilizar el botón de "Copiar" que se encuentra debajo de la herramienta. El valor se copiará en un formato limpio (solo números) para que puedas pegarlo directamente en cualquier documento, planilla o calculadora.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200">
            <h4 className="font-semibold text-neutral-900 mb-2">¿Cuál es la diferencia entre GB y GiB?</h4>
            <p className="text-sm text-neutral-600">
              GB (Gigabyte) es una medida decimal (1000 MB = 1 GB), comúnmente utilizada por los fabricantes de discos duros. GiB (Gibibyte) es la medida binaria (1024 MiB = 1 GiB), que es la que muestra el sistema operativo Windows para el almacenamiento.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200">
            <h4 className="font-semibold text-neutral-900 mb-2">¿Por qué hay un botón de "Intercambiar"?</h4>
            <p className="text-sm text-neutral-600">
              El botón central con las dos flechas sirve para invertir la dirección de la conversión. Si estás convirtiendo Metros a Pies y presionás el botón, automáticamente cambiarás a Pies a Metros.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200">
            <h4 className="font-semibold text-neutral-900 mb-2">¿Cómo se calculan los meses y años?</h4>
            <p className="text-sm text-neutral-600">
              Dado que los meses tienen duraciones variables y los años pueden ser bisiestos, utilizamos una aproximación estándar: consideramos que 1 mes equivale a 30 días exactos y que 1 año equivale a 365 días.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-brand/5 rounded-3xl p-8 border border-brand/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-brand-dark">Herramientas Relacionadas</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link 
            href="/herramientas/calculadora-iva"
            className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-brand/10 hover:border-brand/30 hover:shadow-md transition-all"
          >
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1 group-hover:text-brand transition-colors">Calculadora de IVA</h4>
              <p className="text-sm text-neutral-500">Calculá el IVA de tus facturas</p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-brand transform group-hover:translate-x-1 transition-all" />
          </Link>
          <Link 
            href="/herramientas/calculadora-sueldo-neto"
            className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-brand/10 hover:border-brand/30 hover:shadow-md transition-all"
          >
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1 group-hover:text-brand transition-colors">Calculadora de Sueldo Neto</h4>
              <p className="text-sm text-neutral-500">Calculá el sueldo neto en Argentina</p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-brand transform group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </section>
      
      <div className="text-center text-sm text-neutral-400">
        Última actualización: Octubre 2026
      </div>
    </div>
  )
}
