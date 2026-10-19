import Link from "next/link"

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
        Si ingresaste a trabajar o finalizó la relación laboral durante el semestre, vas a cobrar un aguinaldo proporcional al tiempo trabajado (artículo 1 del Decreto 1078/1984 y artículo 123 de la LCT).
      </p>
      <p>
        La fórmula por días es: <code>(Mitad de tu mejor sueldo) × Días corridos trabajados ÷ Días reales del semestre</code>.
      </p>
      <p>
        Los semestres no tienen 180 días de calendario: el primer semestre tiene <strong>181 días corridos</strong> (182 en años bisiestos) y el segundo semestre cuenta con <strong>184 días</strong>. Por ejemplo, si en el primer semestre de 2026 tu mejor sueldo fue de $800.000 y trabajaste 107 días corridos (ingresando el 16 de marzo hasta el 30 de junio), el cálculo es: el 50% de tu sueldo ($400.000) multiplicado por 107 días y dividido por 181 días. Eso arroja un aguinaldo bruto proporcional de <strong>$236.464,09</strong>.
      </p>

      <h2>¿Cuándo se paga el aguinaldo en 2026?</h2>
      <p>
        El artículo 122 de la Ley de Contrato de Trabajo (sustituido por la Ley 27.073) establece fechas de vencimiento legal precisas para cada cuota del SAC:
      </p>
      <ul>
        <li><strong>Primera cuota (junio):</strong> Vencimiento legal el <strong>30 de junio</strong>.</li>
        <li><strong>Segunda cuota (diciembre):</strong> Vencimiento legal el <strong>18 de diciembre</strong>.</li>
      </ul>
      <p>
        Es importante notar que el plazo de cuatro días hábiles previsto en el artículo 128 de la LCT corresponde a las remuneraciones mensuales o quincenales habituales vencidas, mientras que para el aguinaldo la ley fijó fechas de vencimiento expresas y no contempla una prórroga legal general.
      </p>

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

      <div className="not-prose my-8 p-6 rounded-2xl bg-purple-50/60 border border-purple-200/80">
        <h3 className="text-base font-bold text-purple-950 mb-2">Herramientas financieras recomendadas</h3>
        <p className="text-xs text-purple-900/80 leading-relaxed mb-3">
          Organizá tu economía y aprovechá mejor el aguinaldo:
        </p>
        <ul className="text-xs text-purple-900 space-y-1.5 list-disc list-inside">
          <li>Si vas a financiar compras o adelantar pagos con el SAC, simulá las cuotas con la <Link href="/herramientas/calculadora-cuotas" className="font-semibold underline hover:text-brand">calculadora de cuotas fijas</Link>.</li>
          <li>Llevá el seguimiento de tus ingresos y gastos del mes con el <Link href="/herramientas/control-gastos" className="font-semibold underline hover:text-brand">control de gastos personales</Link>.</li>
          <li>Si tenés un emprendimiento o negocio, costeá el impacto salarial en tus precios con la <Link href="/herramientas/calculadora-precios" className="font-semibold underline hover:text-brand">calculadora de precio de venta</Link>.</li>
        </ul>
      </div>

      <div className="mt-8 pt-4 border-t border-neutral-200 text-sm text-neutral-500">
        <p>Referencias: Ley de Contrato de Trabajo (arts. 121 a 123), Ley 27.073 y Ley 27.802.</p>
      </div>
    </div>
  );
}


