import { describe, it, expect } from 'vitest';
import { calculateAguinaldo, estimateNet } from './aguinaldo';

describe('Calculadora de Aguinaldo', () => {
  it('1. Semestre completo, sueldo 1.000.000 -> bruto 500.000', () => {
    const result = calculateAguinaldo({
      bestSalary: 1000000,
      workedAllSemester: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gross).toBe(500000);
    }
  });

  it('2. Proporcional, sueldo 1.200.000 y 90 días -> bruto 300.000', () => {
    const result = calculateAguinaldo({
      bestSalary: 1200000,
      workedAllSemester: false,
      daysWorked: 90,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gross).toBe(300000);
    }
  });

  it('3. Proporcional, sueldo 800.000 y 110 días -> bruto 244.444,44', () => {
    const result = calculateAguinaldo({
      bestSalary: 800000,
      workedAllSemester: false,
      daysWorked: 110,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gross).toBe(244444.44);
    }
  });

  it('4. Neto estimado de 500.000 -> descuentos 85.000 y neto 415.000', () => {
    const netResult = estimateNet(500000);
    expect(netResult.deductions.total).toBe(85000);
    expect(netResult.net).toBe(415000);
  });

  it('4.1. Neto estimado de aguinaldo proporcional 1.200.000 y 90 días -> bruto 300.000, neto 249.000', () => {
    const grossResult = calculateAguinaldo({
      bestSalary: 1200000,
      workedAllSemester: false,
      daysWorked: 90,
    });
    expect(grossResult.success).toBe(true);
    if (grossResult.success) {
      expect(grossResult.data.gross).toBe(300000);
      const netResult = estimateNet(grossResult.data.gross);
      expect(netResult.deductions.retirement).toBe(33000);
      expect(netResult.deductions.healthInsurance).toBe(9000);
      expect(netResult.deductions.pami).toBe(9000);
      expect(netResult.deductions.total).toBe(51000);
      expect(netResult.net).toBe(249000);
      expect(netResult.net).toBeLessThan(grossResult.data.gross);
    }
  });

  it('5. Errores: sueldo <= 0 o días inválidos', () => {
    const res1 = calculateAguinaldo({ bestSalary: 0, workedAllSemester: true });
    expect(res1.success).toBe(false);

    const res2 = calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 0 });
    expect(res2.success).toBe(false);

    const res3 = calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 181 });
    expect(res3.success).toBe(false);
  });

  it('6. Redondeo correcto con montos con centavos', () => {
    const result = calculateAguinaldo({
      bestSalary: 833333.33,
      workedAllSemester: false,
      daysWorked: 13,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // (833333.33 / 2) = 416666.665
      // 416666.665 * 13 / 180 = 30092.5924... -> 30092.59
      expect(result.data.gross).toBe(30092.59);
    }
  });
});
