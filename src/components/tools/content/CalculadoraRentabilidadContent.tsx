import Link from "next/link"

export function CalculadoraRentabilidadContent() {
  // Configurado de forma manual para evitar dependencias
  const dateFormatted = "3 de octubre de 2026";

  return (
    <article className="prose prose-neutral prose-a:text-neutral-900 prose-a:no-underline hover:prose-a:underline max-w-[650px] w-full">
      <h2>¿Cómo calcular la rentabilidad de un producto?</h2>
      <p>
        Calcular la rentabilidad de un producto de forma precisa es fundamental para asegurar la salud de tu negocio. 
        Para hacerlo, necesitás conocer dos datos clave: el costo total de tu producto o servicio y el precio al que lo vendés.
      </p>
      <p>
        La <strong>ganancia en dinero</strong> es la diferencia simple entre ambos valores. Por ejemplo, si tu costo es $600 y vendés a $1.000, tu ganancia es $400.
        Sin embargo, esa ganancia en pesos no te dice qué tan eficiente es tu negocio. Para eso necesitás medir el porcentaje de margen o rentabilidad.
      </p>

      <h3>¿Cuál es la diferencia entre margen y markup?</h3>
      <p>
        Es uno de los errores más comunes al poner precios. <strong>Margen</strong> y <strong>Markup</strong> no son lo mismo y confundirlos puede hacerte creer que ganás más de lo que realmente estás ganando.
      </p>
      <ul>
        <li>
          <strong>Margen de rentabilidad:</strong> Es el porcentaje que la ganancia representa sobre el precio final de venta. Si vendés a $1.000 y ganás $400, tu margen es del 40%.
        </li>
        <li>
          <strong>Markup (recargo):</strong> Es el porcentaje que le agregaste a tu costo inicial. En el mismo ejemplo, para llegar a $1.000 a partir de un costo de $600, tuviste que agregarle un 66,67% (markup).
        </li>
      </ul>
      <p>
        Muchas personas creen que para tener un 40% de rentabilidad solo deben agregar un 40% a sus costos. 
        Pero si a $600 le agregás un 40%, tu precio de venta será $840 y tu ganancia será de $240. Es decir, tu margen real será del 28,5%, no del 40%.
      </p>

      <h3>¿Cómo usar el cálculo inverso de la calculadora?</h3>
      <p>
        Nuestra calculadora incluye un modo <strong>&quot;Calcular precio por margen&quot;</strong> diseñado específicamente para evitar el error anterior.
      </p>
      <p>
        Simplemente ingresás cuánto te cuesta tu producto y qué porcentaje de margen de ganancia deseás tener sobre la venta final. 
        La herramienta calculará matemáticamente el precio exacto al que debés vender para asegurar esa rentabilidad, mostrando además el markup real aplicado.
      </p>

      <hr className="my-8 border-neutral-200" />

      <h2>Herramientas relacionadas</h2>
      <div className="grid sm:grid-cols-2 gap-4 not-prose">
        <Link 
          href="/herramientas/calculadora-precios"
          className="block p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition-all"
        >
          <div className="font-semibold text-neutral-900 mb-1">Calculadora de precio de venta</div>
          <div className="text-sm text-neutral-500">Calculá el precio ideal sumando costos, impuestos, IVA y comisiones de pasarelas.</div>
        </Link>
        <Link 
          href="/herramientas/calculadora-iva"
          className="block p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition-all"
        >
          <div className="font-semibold text-neutral-900 mb-1">Calculadora de IVA</div>
          <div className="text-sm text-neutral-500">Agregá o quitá el IVA de tus productos con las tasas argentinas vigentes.</div>
        </Link>
        <Link 
          href="/herramientas/generador-presupuestos"
          className="block p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition-all sm:col-span-2"
        >
          <div className="font-semibold text-neutral-900 mb-1">Generador de presupuestos</div>
          <div className="text-sm text-neutral-500">Creá presupuestos profesionales en PDF de forma rápida y gratuita.</div>
        </Link>
      </div>

      <div className="mt-12 text-sm text-neutral-500 text-center">
        Última actualización: {dateFormatted}
      </div>
    </article>
  )
}


