export function PrecioVentaContent() {
  return (
    <div className="prose prose-neutral max-w-[720px] prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-foreground/80 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground prose-a:text-brand hover:prose-a:text-brand-dark">
      <h2>¿Cómo se calcula el precio de venta?</h2>
      <p>
        Calcular el precio de venta es mucho más que sumarle un porcentaje a lo que te costó el producto. La lógica correcta es: sumar tus costos, agregar el margen que querés ganar y contemplar todos los impuestos y comisiones que se van a descontar de ese precio final.
      </p>
      <p>
        Por ejemplo, si tenés un costo de $1.000, querés ganar un 30% limpio de margen, pagás 21% de IVA y un 5% de comisión, tu precio no es $1.300. Si lo vendés a $1.300, después de pagar impuestos y comisiones vas a ganar mucho menos. El precio correcto para ganar el 30% en ese caso sería de casi $1.800. Por eso es clave usar una fórmula que incluya los impuestos por dentro.
      </p>

      <h2 id="margen-vs-recargo">Margen vs. recargo (markup): la diferencia que más confunde</h2>
      <p>
        Esta es la confusión más común y la que más plata hace perder a los emprendedores. <strong>El margen</strong> es qué porcentaje del precio final es tu ganancia. <strong>El recargo o markup</strong> es qué porcentaje de tu costo le sumaste.
      </p>
      <div className="not-prose my-6 rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Si tu costo es $1.000 y elegís...</th>
              <th className="px-4 py-3 font-semibold">El precio será</th>
              <th className="px-4 py-3 font-semibold">Tu ganancia será</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            <tr>
              <td className="px-4 py-3"><strong>30% de Recargo</strong> (Markup)</td>
              <td className="px-4 py-3">$1.300</td>
              <td className="px-4 py-3">$300 (es decir, el <strong>23,08%</strong> de margen)</td>
            </tr>
            <tr>
              <td className="px-4 py-3"><strong>30% de Margen</strong></td>
              <td className="px-4 py-3">$1.428,57</td>
              <td className="px-4 py-3">$428,57 (es decir, el <strong>42,86%</strong> de recargo)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Si querés que a fin de mes el 30% de tu facturación sea ganancia limpia, tenés que usar la opción de "Margen". Si solo querés remarcar un 30% sobre el costo, usá "Recargo".
      </p>

      <h2>¿Qué costos tengo que contar?</h2>
      <p>
        Para que el cálculo funcione, tenés que incluir todo:
      </p>
      <ul>
        <li><strong>Costos variables:</strong> Lo que te cuesta producir o comprar el producto, el envase (packaging), etiquetas, y si pagás el envío, también.</li>
        <li><strong>Costos fijos:</strong> El alquiler, la luz, internet, suscripciones a software y sueldos. Tenés que prorratearlos, es decir, dividirlos por la cantidad de unidades que estimás vender en el mes.</li>
        <li><strong>Tu propio tiempo:</strong> Si vos fabricás el producto, tu tiempo de trabajo tiene que ser parte del costo, no de la ganancia.</li>
      </ul>

      <h2>¿Cómo incluyo el IVA?</h2>
      <p>
        Si sos <strong>Responsable Inscripto</strong>, el IVA se calcula sobre el precio neto (sin IVA). Las alícuotas más comunes son el 21% general, el 10,5% para ciertos bienes (como electrónicos o alimentos) y el 27% para servicios como energía y telecomunicaciones. El IVA lo paga tu cliente, vos solo lo recaudás y se lo pasás a la AFIP.
      </p>
      <p>
        Si sos <strong>Monotributista</strong>, no discriminás IVA. Tu precio neto es igual a tu precio final, por lo que tenés que elegir la opción "Monotributista o exento".
      </p>
      <p>
        <strong>Ojo al descontarlo:</strong> para sacarle el IVA a un precio final no tenés que restarle el 21%, tenés que dividirlo por 1,21.
      </p>

      <h2>Comisiones e impuestos: cómo se comen tu ganancia</h2>
      <p>
        La comisión del medio de cobro (Mercado Pago, Ualá, tarjetas) se calcula sobre el <strong>precio final con IVA</strong>. Si tu cliente te paga $10.000 y la comisión es del 5%, te descuentan $500. A veces, las plataformas le suman IVA a su propia comisión, así que asegurate de cargar el porcentaje "efectivo" que te terminan descontando.
      </p>
      <p>
        <strong>Ingresos Brutos</strong> se calcula sobre el precio neto (sin IVA) facturado. El porcentaje depende de en qué provincia estés inscripto y a qué rubro te dediques.
      </p>

      <h2>Errores comunes al ponerle precio a un producto</h2>
      <ul>
        <li><strong>No contar los costos fijos:</strong> Si solo sumás el costo del producto, vas a terminar pagando el alquiler de tu bolsillo.</li>
        <li><strong>Confundir margen con recargo:</strong> Creer que remarcando un 30% estás ganando un 30%.</li>
        <li><strong>Olvidar las comisiones:</strong> Poner el precio y descubrir recién cuando te pagan que el medio de pago se llevó tu ganancia.</li>
        <li><strong>No actualizar:</strong> Los costos cambian. Tenés que revisar tus números de forma periódica para no perder rentabilidad.</li>
      </ul>

    </div>
  );
}


