import { describe, it, expect } from 'vitest';
import { calculateAguinaldo, estimateNet } from './aguinaldo';
import { getSemesterDays, isLeapYear } from './aguinaldo.config';

describe('Calculadora de Aguinaldo (Normativa Ley 23.041 y Dec. 1078/1984)', () => {
  it('1. Semestre completo: corresponde el 50% de la mayor remuneración', () => {
    const result1 = calculateAguinaldo({
      bestSalary: 1000000,
      workedAllSemester: true,
      semester: '1',
      year: 2026,
    });
    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.gross).toBe(500000);
      expect(result1.data.base).toBe(500000);
      expect(result1.data.proportionFactor).toBe(1);
    }

    const result2 = calculateAguinaldo({
      bestSalary: 800000,
      workedAllSemester: true,
      semester: '2',
      year: 2026,
    });
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.gross).toBe(400000);
      expect(result2.data.base).toBe(400000);
      expect(result2.data.proportionFactor).toBe(1);
    }
  });

  it('2. Caso auditado: ingreso 16 de marzo hasta 30 de junio (107 días corridos, base $800.000, 1.er sem 2026 de 181 días)', () => {
    // Conteo exacto: marzo (16 a 31 = 16 días) + abril (30) + mayo (31) + junio (30) = 107 días.
    // Denominador año común 2026 (1.er semestre): 31+28+31+30+31+30 = 181 días.
    // 50% base = $400.000. Factor = 107 / 181.
    // Bruto = 400.000 * 107 / 181 = 236.464,09
    const result = calculateAguinaldo({
      bestSalary: 800000,
      workedAllSemester: false,
      daysWorked: 107,
      semester: '1',
      year: 2026,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.semesterDays).toBe(181);
      expect(result.data.gross).toBe(236464.09);

      // Verificación de deducciones de ley (17%) y neto estimado
      const net = estimateNet(result.data.gross);
      expect(net.deductions.retirement).toBe(26011.05); // 11%
      expect(net.deductions.healthInsurance).toBe(7093.92); // 3%
      expect(net.deductions.pami).toBe(7093.92); // 3%
      expect(net.deductions.total).toBe(40198.89);
      expect(net.net).toBe(196265.2);
    }
  });

  it('3. Proporcional 2.º semestre (184 días totales): ingreso 1 de septiembre a 31 de diciembre (122 días)', () => {
    // Septiembre (30) + Octubre (31) + Noviembre (30) + Diciembre (31) = 122 días corridos.
    // Denominador: 184 días (31+31+30+31+30+31).
    // Sueldo $900.000 -> Base $450.000.
    // Bruto = 450.000 * 122 / 184 = 298.369,57.
    const result = calculateAguinaldo({
      bestSalary: 900000,
      workedAllSemester: false,
      daysWorked: 122,
      semester: '2',
      year: 2026,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.semesterDays).toBe(184);
      expect(result.data.gross).toBe(298369.57);
    }
  });

  it('4. Año bisiesto (ej. 2024): 1.er semestre computa 182 días corridos', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(getSemesterDays('1', 2024)).toBe(182);
    expect(getSemesterDays('1', 2026)).toBe(181);
    expect(getSemesterDays('2', 2024)).toBe(184);

    const result = calculateAguinaldo({
      bestSalary: 1000000,
      workedAllSemester: false,
      daysWorked: 91,
      semester: '1',
      year: 2024,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.semesterDays).toBe(182);
      expect(result.data.gross).toBe(250000); // 500.000 * 91 / 182 = 250.000
    }
  });

  it('5. Validación de errores y límites estrictos según el semestre', () => {
    // Sueldo <= 0
    expect(calculateAguinaldo({ bestSalary: 0, workedAllSemester: true }).success).toBe(false);
    expect(calculateAguinaldo({ bestSalary: -500, workedAllSemester: true }).success).toBe(false);

    // Días trabajados <= 0
    expect(calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 0, semester: '1', year: 2026 }).success).toBe(false);

    // Días exceden los días reales del 1.er semestre (181 días en año común)
    expect(calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 181, semester: '1', year: 2026 }).success).toBe(true);
    expect(calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 182, semester: '1', year: 2026 }).success).toBe(false);

    // Días en 1.er semestre año bisiesto (182 días)
    expect(calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 182, semester: '1', year: 2024 }).success).toBe(true);
    expect(calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 183, semester: '1', year: 2024 }).success).toBe(false);

    // Días en 2.º semestre (184 días)
    expect(calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 184, semester: '2', year: 2026 }).success).toBe(true);
    expect(calculateAguinaldo({ bestSalary: 100000, workedAllSemester: false, daysWorked: 185, semester: '2', year: 2026 }).success).toBe(false);
  });

  it('6. Redondeo correcto con montos con centavos', () => {
    const result = calculateAguinaldo({
      bestSalary: 833333.33,
      workedAllSemester: false,
      daysWorked: 13,
      semester: '1',
      year: 2026,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // (833333.33 / 2) = 416666.665
      // 416666.665 * 13 / 181 = 29926.335... -> 29926.34
      expect(result.data.gross).toBe(29926.34);
    }
  });

  it('7. Neto estimado del aguinaldo completo de $500.000', () => {
    const netResult = estimateNet(500000);
    expect(netResult.deductions.retirement).toBe(55000);
    expect(netResult.deductions.healthInsurance).toBe(15000);
    expect(netResult.deductions.pami).toBe(15000);
    expect(netResult.deductions.total).toBe(85000);
    expect(netResult.net).toBe(415000);
  });
});
