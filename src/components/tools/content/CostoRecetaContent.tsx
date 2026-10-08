import React from 'react'
import Link from 'next/link'

export function CostoRecetaContent() {
  return (
    <article className="prose prose-slate max-w-none">
      <h2>Cómo calcular el costo de una receta</h2>
      <p>
        Calcular el costo real de elaboración de una receta es fundamental para cualquier emprendimiento gastronómico.
        Esta herramienta te permite desglosar los ingredientes y conocer exactamente cuánto cuesta cada unidad o porción que producís.
      </p>
      
      <h3>¿Por qué es importante calcular el costo?</h3>
      <p>
        Si no conocés el costo exacto de tus recetas, es imposible determinar un precio de venta adecuado. 
        Podrías estar perdiendo dinero sin saberlo o cobrando menos de lo necesario para que tu negocio sea rentable.
      </p>

      <h3>Preguntas frecuentes</h3>
      <dl className="mt-8 space-y-6">
        <div>
          <dt className="font-semibold text-foreground">¿Cuál es la diferencia entre Margen de ganancia y Recargo sobre el costo?</dt>
          <dd className="mt-2 text-foreground-muted">
            <p className="mb-2">Son dos formas distintas de calcular el precio de venta:</p>
            <ul className="list-disc pl-5 mb-2">
              <li><strong>Margen de ganancia (Margin):</strong> Calcula qué porcentaje del <em>precio de venta final</em> será tu ganancia. Por ejemplo, si querés un margen del 50%, tu ganancia será la mitad de lo que paga el cliente. La fórmula es: <code className="text-xs">Costo / (1 - Margen%)</code>.</li>
              <li><strong>Recargo (Markup):</strong> Es el porcentaje que le sumás directamente a tu <em>costo</em>. Si tu costo es $1.000 y querés un recargo del 50%, le sumás $500 y lo vendés a $1.500. La fórmula es: <code className="text-xs">Costo × (1 + Recargo%)</code>.</li>
            </ul>
            <p><strong>Dato clave:</strong> Un recargo del 50% NO es igual a un margen del 50%. Si aplicás un recargo del 50% ($1.000 costo + 50% = $1.500 precio), tu ganancia real sobre el precio de venta final es del 33%.</p>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">¿Cómo calculo la porción exacta de un ingrediente?</dt>
          <dd className="mt-2 text-foreground-muted">Nuestra calculadora convierte automáticamente las unidades por vos. Solo tenés que ingresar el precio de compra (por ejemplo, por 1 kilo) y cuánto usás (por ejemplo, 300 gramos).</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">¿Tengo que incluir el gas y la electricidad?</dt>
          <dd className="mt-2 text-foreground-muted">Sí. Recomendamos incluirlos en la sección de "Otros costos". Podés hacer un cálculo estimado por hora de horno o equipo utilizado y sumarlo al costo de la receta.</dd>
        </div>
      </dl>

      <div className="mt-8 p-6 bg-brand/5 rounded-xl border border-brand/10">
        <h3 className="text-lg font-semibold text-brand mb-2 mt-0">Herramientas relacionadas</h3>
        <ul className="mb-0">
          <li>
            <Link href="/herramientas/calculadora-precios" className="text-brand hover:text-brand-dark">Calculadora de Precio de Venta</Link>
            <span className="text-foreground-muted block text-sm">Calculá tu precio final sumando comisiones e impuestos.</span>
          </li>
          <li className="mt-2">
            <Link href="/herramientas/calculadora-rentabilidad" className="text-brand hover:text-brand-dark">Calculadora de Rentabilidad</Link>
            <span className="text-foreground-muted block text-sm">Analizá el margen de ganancia de tu negocio.</span>
          </li>
        </ul>
      </div>
    </article>
  )
}
