export function CalculadoraIVAContent() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 w-full max-w-6xl items-start">
      {/* Columna Izquierda */}
      <div className="prose prose-neutral prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-0 prose-h2:mb-4 prose-p:text-foreground/80 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground prose-a:text-brand hover:prose-a:text-brand-dark">
        <h2>¿Cómo funciona el IVA en Argentina?</h2>
        <p>
          El <strong>Impuesto al Valor Agregado (IVA)</strong> es un impuesto indirecto que grava el consumo de la mayoría de los bienes y servicios en Argentina. En cada etapa de la cadena comercial se va "agregando" valor, y el impuesto se calcula sobre ese valor agregado.
        </p>
        <p>
          Quien soporta el impuesto en su totalidad es el consumidor final, ya que no puede deducirlo de ningún lado. Las empresas o profesionales (Responsables Inscriptos) funcionan como agentes de recaudación: le cobran el IVA a sus clientes, descuentan el IVA que ellos pagaron en sus compras, y le ingresan la diferencia a la AFIP.
        </p>

        <h2 className="mt-10">Las 3 alícuotas principales</h2>
        <ul>
          <li><strong>21% (Tasa General):</strong> Es la más común y aplica a la gran mayoría de los productos (ropa, muebles, vehículos) y servicios generales. Si no hay una norma que diga lo contrario, la tasa es del 21%.</li>
          <li><strong>10,5% (Tasa Reducida):</strong> Beneficia a ciertos sectores para fomentar su consumo o abaratar costos de primera necesidad. Aplica a productos informáticos (computadoras, tablets), electrónica, alimentos de la canasta básica, maquinaria agrícola, fertilizantes, intereses de préstamos de ciertos bancos y transporte público de pasajeros, entre otros.</li>
          <li><strong>27% (Tasa Incrementada):</strong> Se aplica a servicios públicos y algunas prestaciones reguladas como la energía eléctrica, gas y agua (cuando no se prestan a viviendas), y telecomunicaciones.</li>
        </ul>
      </div>

      {/* Columna Derecha */}
      <div className="prose prose-neutral prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-0 prose-h2:mb-4 prose-p:text-foreground/80 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground prose-a:text-brand hover:prose-a:text-brand-dark">
        <h2>El error más común: cómo quitarle el IVA a un precio final</h2>
        <p>
          Uno de los errores matemáticos más habituales es querer <strong>sacar el IVA restando el porcentaje</strong>.
        </p>
        <div className="not-prose my-6 rounded-xl border border-red-200 overflow-hidden bg-red-50/50">
          <div className="p-4">
            <p className="font-semibold text-red-900 mb-2">❌ Cómo NO hacerlo (Restando el 21%)</p>
            <p className="text-sm text-red-800">
              Si un producto sale $1.210 con IVA y le restás el 21% (1.210 - 21%), obtenés $955,90. ¡Esto es incorrecto! El 21% se aplicó originalmente sobre $1.000, no sobre los $1.210.
            </p>
          </div>
        </div>
        <div className="not-prose my-6 rounded-xl border border-emerald-200 overflow-hidden bg-emerald-50/50">
          <div className="p-4">
            <p className="font-semibold text-emerald-900 mb-2">✅ Cómo SÍ hacerlo (Dividiendo por 1.21)</p>
            <p className="text-sm text-emerald-800">
              Para desglosar el IVA correctamente, tenés que dividir el precio final por 1 + la alícuota. Para el 21%, dividís 1.210 / 1,21 = $1.000.
            </p>
          </div>
        </div>

        <h2 className="mt-10">Monotributistas y el IVA</h2>
        <p>
          Si sos Monotributista en Argentina, el IVA ya está "dentro" del monto fijo mensual que pagás con la cuota del Monotributo. Por lo tanto, <strong>vos no discriminás IVA</strong> en tus facturas (que suelen ser tipo "C").
        </p>
        <p>
          Para un monotributista, el concepto de "agregar" o "quitar" IVA no aplica a sus propias ventas de cara al cliente final. Tu precio neto (lo que te queda en el bolsillo antes de Ingresos Brutos) es igual a tu precio final. Sin embargo, sí te sirve esta calculadora cuando le comprás mercadería a un Responsable Inscripto y necesitás saber cuánto estás pagando realmente de impuesto.
        </p>
      </div>
    </div>
  );
}


