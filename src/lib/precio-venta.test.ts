import { describe, it, expect } from 'vitest';
import { calculatePrice } from './precio-venta';

describe('Calculadora de Precio de Venta', () => {
  it('1. Costo 1.000, margen 30%, sin IVA, comisiones ni impuestos -> precio neto 1.428,57; ganancia 428,57; margen real 30,00%; recargo real 42,86%', () => {
    const res = calculatePrice({
      mode: 'target',
      productCost: 1000,
      vatRate: 0,
      target: { type: 'margin', value: 0.3 }
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.netPrice).toBe(1428.57);
    expect(res.profitPerUnit).toBe(428.57);
    expect(res.realMargin).toBeCloseTo(0.3, 2);
    expect(res.realMarkup).toBeCloseTo(0.4286, 3);
  });

  it('2. Costo 1.000, recargo 30% -> precio neto 1.300,00; ganancia 300,00; margen real 23,08%', () => {
    const res = calculatePrice({
      mode: 'target',
      productCost: 1000,
      vatRate: 0,
      target: { type: 'markup', value: 0.3 }
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.netPrice).toBe(1300.00);
    expect(res.profitPerUnit).toBe(300.00);
    expect(res.realMargin).toBeCloseTo(0.2308, 3);
  });

  it('3. Costo 1.000, IVA 21%, comisión 4%, ingresos brutos 3%, margen 25% -> precio neto 1.488,98; IVA 312,69; precio final 1.801,67; ganancia 372,25', () => {
    const res = calculatePrice({
      mode: 'target',
      productCost: 1000,
      vatRate: 0.21,
      paymentFee: 0.04,
      grossIncomeTax: 0.03,
      target: { type: 'margin', value: 0.25 }
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // N = 1000 / (1 - 0.03 - 0.04*(1.21) - 0.25) = 1000 / (0.72 - 0.0484) = 1000 / 0.6716 = 1488.98153...
    expect(res.netPrice).toBe(1488.98);
    expect(res.vat).toBe(312.69); // 1488.9815 * 0.21 = 312.686
    expect(res.finalPrice).toBe(1801.67); // 1488.9815 + 312.686 = 1801.667
    expect(res.profitPerUnit).toBe(372.25); // 25% of 1488.98
  });

  it('4. Costo del producto 600, costos fijos 200.000 y 500 unidades por mes (fijo por unidad 400), margen 30% -> mismo resultado que el caso 1', () => {
    const res = calculatePrice({
      mode: 'target',
      productCost: 600,
      fixedMonthlyCosts: 200000,
      unitsPerMonth: 500,
      vatRate: 0,
      target: { type: 'margin', value: 0.3 }
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.netPrice).toBe(1428.57);
    expect(res.profitPerUnit).toBe(428.57);
  });

  it('5. Modo ganancia: precio final 1.210 con IVA 21%, costo 600, comisión 4%, ingresos brutos 3% -> neto 1.000; ganancia 321,60; margen real 32,16%; recargo real 53,60%', () => {
    const res = calculatePrice({
      mode: 'profit',
      productCost: 600,
      finalPrice: 1210,
      vatRate: 0.21,
      paymentFee: 0.04,
      grossIncomeTax: 0.03
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.netPrice).toBe(1000.00);
    expect(res.profitPerUnit).toBe(321.60); // 1000 - 600 - 30(IB) - 48.4(Fee) = 321.6
    expect(res.realMargin).toBeCloseTo(0.3216, 4);
    expect(res.realMarkup).toBeCloseTo(0.5360, 4);
  });

  it('6. Margen 80% con ingresos brutos 15% y comisión 10% (sin IVA) -> error por porcentajes que suman más de 100%', () => {
    const res = calculatePrice({
      mode: 'target',
      productCost: 1000,
      vatRate: 0,
      grossIncomeTax: 0.15,
      paymentFee: 0.10,
      target: { type: 'margin', value: 0.8 } // den = 1 - 0.15 - 0.1 - 0.8 = -0.05
    });
    expect(res.ok).toBe(false);
  });

  it('7. Costo 0 o negativo, porcentajes negativos, unidades 0 con costos fijos -> error', () => {
    const res1 = calculatePrice({ mode: 'target', productCost: -10, vatRate: 0, target: { type: 'margin', value: 0.3 } });
    expect(res1.ok).toBe(false);
    
    const res2 = calculatePrice({ mode: 'target', productCost: 1000, fixedMonthlyCosts: 1000, unitsPerMonth: 0, vatRate: 0, target: { type: 'margin', value: 0.3 } });
    expect(res2.ok).toBe(false);
  });

  it('8. Con el caso 3 y 100 unidades por mes -> ganancia mensual 37.225,00', () => {
    const res = calculatePrice({
      mode: 'target',
      productCost: 1000,
      vatRate: 0.21,
      paymentFee: 0.04,
      grossIncomeTax: 0.03,
      unitsPerMonth: 100,
      target: { type: 'margin', value: 0.25 }
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Ganancia por unidad es 372.25
    expect(res.monthlyProfit).toBe(37225.00);
  });
});
