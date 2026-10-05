export function AguinaldoContent() {
  return (
    <div className="prose prose-neutral max-w-[720px] prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-foreground/80 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground prose-a:text-brand hover:prose-a:text-brand-dark">
      <h2>¿Cómo se calcula el aguinaldo?</h2>
      <p>
        El aguinaldo, también conocido como Sueldo Anual Complementario (SAC), se paga en dos cuotas al año (junio y diciembre). La regla es muy simple: <strong>te corresponde el 50% de la mayor remuneración mensual</strong> devengada por todo concepto dentro del semestre correspondiente.
      </p>
      <p>
        Ojo: se toma el <em>mejor sueldo</em>, no el último sueldo ni un promedio de todos los meses. Por ejemplo, si tu mejor sueldo bruto entre enero y junio fue de $1.000.000, la primera cuota de tu aguinaldo será de $500.000 brutos.
      </p>

      <h2>Aguinaldo proporcional: si no trabajaste todo el semestre</h2>
      <p>
        Si ingresaste a trabajar o te fuiste de tu empleo en la mitad del semestre, vas a cobrar un aguinaldo proporcional a los días que trabajaste.
      </p>
      <p>
        La fórmula es: <code>(Mitad de tu mejor sueldo) × Días trabajados ÷ 180</code>.
      </p>
      <p>
        Por ejemplo, si tu mejor sueldo fue de $1.200.000 y trabajaste 90 días (3 meses), tu aguinaldo proporcional se calcula así: el 50% de tu sueldo ($600.000) multiplicado por 90 días, y dividido por 180. Eso da un aguinaldo bruto proporcional de $300.000.
      </p>

      <h2>¿Cuándo se paga el aguinaldo en 2026?</h2>
      <p>
        La Ley de Contrato de Trabajo establece fechas límite precisas, con un margen legal de hasta 4 días hábiles de demora:
      </p>
      <ul>
        <li><strong>Primera cuota (junio):</strong> El empleador tiene tiempo hasta el 30 de junio. En 2026, con el margen de días hábiles, se puede depositar hasta el lunes 6 de julio inclusive.</li>
        <li><strong>Segunda cuota (diciembre):</strong> La fecha de pago es el 18 de diciembre. En 2026, considerando los 4 días hábiles de margen, te lo pueden depositar hasta el jueves 24 de diciembre, aproximadamente, según el cómputo habitual de días hábiles.</li>
      </ul>

      <h2>¿Qué conceptos entran en el cálculo?</h2>
      <p>
        Para sacar la cuenta tenés que sumar todos los <strong>conceptos remunerativos</strong> que figuren en tu recibo de sueldo: tu sueldo básico, horas extras, comisiones, premios o bonos que tengan carácter remunerativo, y el presentismo. Todo lo que esté sujeto a aportes, entra en la cuenta.
      </p>
      <p>
        Por el contrario, <strong>no suman</strong> los conceptos no remunerativos, las asignaciones familiares, los reintegros de gastos (como viáticos con comprobante) ni los beneficios sociales.
      </p>

      <h2>¿Quiénes cobran aguinaldo?</h2>
      <p>
        El aguinaldo es un derecho para todos los <strong>trabajadores en relación de dependencia</strong>, tanto en el sector privado como en el ámbito público. También lo cobran los jubilados y pensionados (se los paga ANSES automáticamente junto a sus haberes).
      </p>
      <p>
        No les corresponde cobrar aguinaldo a los monotributistas, a los autónomos, ni a los dueños de negocios o empresas. Tampoco aplica a los planes sociales que no sean de carácter laboral.
      </p>

      <h2>Descuentos del aguinaldo</h2>
      <p>
        El aguinaldo está sujeto a las mismas retenciones de ley que un sueldo común. Del monto bruto que calculaste, se descuenta típicamente un <strong>17%</strong> en aportes de ley (11% para la jubilación, 3% para la obra social y 3% para el PAMI).
      </p>
      <p>
        Si estás afiliado a un sindicato, tené en cuenta que también te van a descontar la cuota sindical según tu convenio. Y si tus ingresos superan el mínimo no imponible, el aguinaldo puede estar alcanzado por el Impuesto a las Ganancias.
      </p>

      <h2>¿Cambió el aguinaldo con la reforma laboral?</h2>
      <p>
        No en su cálculo directo. La Ley de Modernización Laboral (Ley 27.802) mantuvo intacta la fórmula del aguinaldo (sigue siendo el 50% del mejor sueldo) y sus fechas de pago. El único cambio es que ahora el aguinaldo ya no se incluye en la base de cálculo para ciertas indemnizaciones por despido.
      </p>

      <div className="mt-8 pt-4 border-t border-neutral-200 text-sm text-neutral-500">
        <p>Referencias: Ley de Contrato de Trabajo (arts. 121 a 123) y Ley 27.073.</p>
      </div>
    </div>
  );
}


