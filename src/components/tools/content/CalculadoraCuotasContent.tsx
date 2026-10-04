import React from 'react';

export function CalculadoraCuotasContent() {
  return (
    <article className="prose prose-violet max-w-4xl mx-auto space-y-6 text-gray-700">
      <h2 className="text-2xl font-bold text-gray-900">¿Cómo calcular una cuota?</h2>
      <p>
        Calcular una cuota depende del tipo de financiación. En el caso de <strong>cuotas sin interés</strong>, el cálculo es directo: simplemente se divide el monto total financiado por la cantidad de meses en los que se va a pagar. Por ejemplo, si financiás $120.000 en 12 meses sin interés, tu cuota mensual será exactamente de $10.000.
      </p>
      
      <h3 className="text-xl font-semibold text-gray-800">Diferencia entre cuotas con y sin interés</h3>
      <p>
        La diferencia principal radica en el costo financiero total de la operación. Una financiación <strong>sin interés</strong> mantiene el precio original del producto a lo largo del tiempo, por lo que el "Total pagado" al finalizar los pagos será idéntico al precio de lista o contado.
      </p>
      <p>
        Por el contrario, las <strong>cuotas con interés</strong> incluyen un cargo adicional por el costo de financiar ese dinero en el tiempo. Aquí, el total que terminás pagando es superior al valor original del producto. El sistema más utilizado para estos cálculos es el <strong>sistema de amortización francés</strong>.
      </p>

      <h3 className="text-xl font-semibold text-gray-800">¿Qué significa la tasa de interés?</h3>
      <p>
        La tasa de interés es el porcentaje que te cobran por financiar un producto. Las entidades financieras suelen expresar la tasa en forma <strong>Anual (TNA)</strong> o <strong>Mensual (TEM)</strong>. Nuestra calculadora convierte automáticamente la Tasa Nominal Anual a su equivalente periódico mensual para calcular la cuota exacta sobre saldos, como lo hacen los bancos y las tarjetas de crédito.
      </p>

      <h3 className="text-xl font-semibold text-gray-800">Cómo obtener el total financiado y los intereses</h3>
      <p>
        El <strong>total financiado</strong> es el monto original sobre el que se aplica el préstamo o plan de pagos. El <strong>total pagado</strong> es la suma de todas las cuotas abonadas a lo largo de los meses. Al restarle el monto financiado inicial a este total pagado, obtendrás el valor exacto de los <strong>intereses</strong>.
      </p>
      
      <h3 className="text-xl font-semibold text-gray-800">¿Cómo interpretar el resultado de la calculadora?</h3>
      <p>
        El resultado principal destacado es el <strong>Valor de la cuota</strong>, que es el monto fijo que deberás abonar mes a mes. En el desglose (si está disponible según la configuración) podrás ver cómo, mes a mes, una parte de esa cuota cancela capital prestado y otra parte paga los intereses generados sobre el saldo que aún debés (característica propia del sistema francés).
      </p>
    </article>
  );
}
