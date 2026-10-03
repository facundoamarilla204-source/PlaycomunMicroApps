export type CalculationParams = {
  mode: 'target' | 'profit';
  productCost: number;
  otherVariableCosts?: number;
  fixedMonthlyCosts?: number;
  unitsPerMonth?: number;
  vatRate: number; // 0, 0.105, 0.21 o 0.27
  paymentFee?: number; // sobre el precio final, fracción
  grossIncomeTax?: number; // sobre el neto, fracción
  otherSalesTaxes?: number; // sobre el neto, fracción
  target?: { type: 'margin' | 'markup'; value: number }; // fracción
  finalPrice?: number; // solo para modo 'profit'
};

export type CalculationResult =
  | {
      ok: true;
      totalCost: number;
      netPrice: number;
      vat: number;
      finalPrice: number;
      profitPerUnit: number;
      realMargin: number;
      realMarkup: number;
      breakdown: {
        cost: number;
        taxes: number; // IB y otros impuestos
        fee: number; // comisión
        profit: number;
      };
      monthlyProfit?: number;
      steps: string[];
    }
  | { ok: false; error: string };

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

export function calculatePrice(params: CalculationParams): CalculationResult {
  const {
    mode,
    productCost,
    otherVariableCosts = 0,
    fixedMonthlyCosts = 0,
    unitsPerMonth = 0,
    vatRate,
    paymentFee = 0,
    grossIncomeTax = 0,
    otherSalesTaxes = 0,
    target,
    finalPrice,
  } = params;

  if (productCost < 0) return { ok: false, error: 'El costo del producto no puede ser negativo.' };
  if (otherVariableCosts < 0) return { ok: false, error: 'Los costos variables no pueden ser negativos.' };
  if (fixedMonthlyCosts < 0) return { ok: false, error: 'Los costos fijos no pueden ser negativos.' };
  if (unitsPerMonth < 0) return { ok: false, error: 'Las unidades no pueden ser negativas.' };
  if (paymentFee < 0 || paymentFee > 1) return { ok: false, error: 'La comisión debe estar entre 0% y 100%.' };
  if (grossIncomeTax < 0 || grossIncomeTax > 1) return { ok: false, error: 'Ingresos Brutos debe estar entre 0% y 100%.' };
  if (otherSalesTaxes < 0 || otherSalesTaxes > 1) return { ok: false, error: 'Otros impuestos deben estar entre 0% y 100%.' };

  let fixedPerUnit = 0;
  if (fixedMonthlyCosts > 0) {
    if (unitsPerMonth <= 0) return { ok: false, error: 'Debés ingresar las unidades por mes para calcular el costo fijo unitario.' };
    fixedPerUnit = fixedMonthlyCosts / unitsPerMonth;
  }

  const C = productCost + otherVariableCosts + fixedPerUnit;
  if (C <= 0) return { ok: false, error: 'El costo total por unidad debe ser mayor a cero.' };

  const i = vatRate;
  const c = paymentFee;
  const t = grossIncomeTax;
  const p = otherSalesTaxes;

  let N = 0;
  let F = 0;
  const steps: string[] = [];

  if (mode === 'target') {
    if (!target) return { ok: false, error: 'Falta el objetivo de ganancia.' };
    const { type, value } = target;
    if (value < 0) return { ok: false, error: 'El margen o recargo no puede ser negativo.' };
    
    if (type === 'margin') {
      if (value >= 1) return { ok: false, error: 'El margen no puede ser del 100% o superior (el precio sería infinito).' };
      const m = value;
      const den = 1 - t - p - c * (1 + i) - m;
      if (den <= 0) return { ok: false, error: 'Con estos porcentajes no hay precio que alcance. Probá bajar el margen o alguna comisión.' };
      
      N = C / den;
      steps.push(`Costo total (C) = $${round2(C)}`);
      steps.push(`Fórmula con margen: N = C ÷ (1 - Impuestos - Comisión×(1+IVA) - Margen)`);
      steps.push(`N = ${round2(C)} ÷ (1 - ${t} - ${p} - ${c}×(1+${i}) - ${m})`);
      steps.push(`Precio neto sin IVA (N) = $${round2(N)}`);
    } else {
      const k = value;
      const den = 1 - t - p - c * (1 + i);
      if (den <= 0) return { ok: false, error: 'Con estos porcentajes no hay precio que alcance. Los impuestos y comisiones se comen el 100% o más.' };
      
      N = (C * (1 + k)) / den;
      steps.push(`Costo total (C) = $${round2(C)}`);
      steps.push(`Fórmula con recargo: N = C × (1 + Recargo) ÷ (1 - Impuestos - Comisión×(1+IVA))`);
      steps.push(`N = ${round2(C)} × (1 + ${k}) ÷ (1 - ${t} - ${p} - ${c}×(1+${i}))`);
      steps.push(`Precio neto sin IVA (N) = $${round2(N)}`);
    }
  } else if (mode === 'profit') {
    if (!finalPrice || finalPrice <= 0) return { ok: false, error: 'El precio final debe ser mayor a cero.' };
    F = finalPrice;
    N = F / (1 + i);
    steps.push(`Costo total (C) = $${round2(C)}`);
    steps.push(`Fórmula ganancia: N = Precio final ÷ (1 + IVA)`);
    steps.push(`N = ${F} ÷ (1 + ${i})`);
    steps.push(`Precio neto sin IVA (N) = $${round2(N)}`);
  }

  const IVA = N * i;
  if (mode !== 'profit') {
    F = N * (1 + i);
  }
  
  steps.push(`IVA = N × ${i} = $${round2(IVA)}`);
  if (mode !== 'profit') steps.push(`Precio final con IVA (F) = N + IVA = $${round2(F)}`);

  const IB_other = (t + p) * N;
  const paymentFeeAmount = c * F;
  const profit = N - C - IB_other - paymentFeeAmount;

  steps.push(`Ingresos Brutos y otros = N × (${t} + ${p}) = $${round2(IB_other)}`);
  steps.push(`Comisión de cobro = F × ${c} = $${round2(paymentFeeAmount)}`);
  steps.push(`Ganancia neta = N - C - Impuestos - Comisión = $${round2(profit)}`);

  const realMargin = profit / N;
  const realMarkup = profit / C;

  let monthlyProfit: number | undefined;
  if (unitsPerMonth > 0) {
    monthlyProfit = round2(profit) * unitsPerMonth;
    steps.push(`Ganancia mensual = Ganancia por unidad × ${unitsPerMonth} = $${round2(monthlyProfit)}`);
  }

  return {
    ok: true,
    totalCost: round2(C),
    netPrice: round2(N),
    vat: round2(IVA),
    finalPrice: round2(F),
    profitPerUnit: round2(profit),
    realMargin,
    realMarkup,
    breakdown: {
      cost: round2(C),
      taxes: round2(IB_other),
      fee: round2(paymentFeeAmount),
      profit: round2(profit),
    },
    monthlyProfit: monthlyProfit ? round2(monthlyProfit) : undefined,
    steps,
  };
}
