import { AGUINALDO_CONFIG, getSemesterDays } from './aguinaldo.config';

export interface AguinaldoInput {
  bestSalary: number;
  workedAllSemester: boolean;
  daysWorked?: number;
  semester?: '1' | '2';
  year?: number;
}

export interface AguinaldoResult {
  gross: number;
  base: number;
  proportionFactor: number;
  semesterDays: number;
  steps: string[];
}

export interface AguinaldoNetEstimate {
  net: number;
  deductions: {
    retirement: number;
    healthInsurance: number;
    pami: number;
    total: number;
  };
}

export type AguinaldoResponse =
  | { success: true; data: AguinaldoResult }
  | { success: false; error: string };

function round(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateAguinaldo(input: AguinaldoInput): AguinaldoResponse {
  const { bestSalary, workedAllSemester, daysWorked, semester = '1', year = AGUINALDO_CONFIG.YEAR } = input;

  if (bestSalary <= 0) {
    return { success: false, error: 'El mejor sueldo debe ser mayor a cero.' };
  }

  const base = bestSalary / 2;
  const semesterDays = getSemesterDays(semester, year);
  let proportionFactor = 1;
  const steps: string[] = [];

  steps.push(`Calculamos la mitad de tu mejor sueldo: $${bestSalary.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ÷ 2 = $${base.toLocaleString('es-AR', { maximumFractionDigits: 2 })}.`);

  if (!workedAllSemester) {
    if (daysWorked === undefined || daysWorked <= 0 || daysWorked > semesterDays) {
      return { success: false, error: `Ingresá una cantidad válida de días trabajados (entre 1 y ${semesterDays}).` };
    }
    proportionFactor = daysWorked / semesterDays;
    const semesterLabel = semester === '1' ? '1.er semestre' : '2.º semestre';
    steps.push(`Como trabajaste ${daysWorked} días en el ${semesterLabel} (${semesterDays} días corridos totales), sacamos el proporcional: $${base.toLocaleString('es-AR', { maximumFractionDigits: 2 })} × ${daysWorked} ÷ ${semesterDays}.`);
  } else {
    steps.push('Como trabajaste todo el semestre, te corresponde la mitad entera de tu mejor sueldo.');
  }

  const gross = round(base * proportionFactor);

  if (!workedAllSemester) {
    steps.push(`Resultado bruto proporcional: $${gross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}.`);
  } else {
    steps.push(`Resultado bruto: $${gross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}.`);
  }

  return {
    success: true,
    data: {
      gross,
      base: round(base),
      proportionFactor,
      semesterDays,
      steps,
    },
  };
}

export function estimateNet(gross: number): AguinaldoNetEstimate {
  const retirement = round(gross * AGUINALDO_CONFIG.DEDUCTIONS.RETIREMENT);
  const healthInsurance = round(gross * AGUINALDO_CONFIG.DEDUCTIONS.HEALTH_INSURANCE);
  const pami = round(gross * AGUINALDO_CONFIG.DEDUCTIONS.PAMI);
  const total = round(retirement + healthInsurance + pami);
  const net = round(gross - total);

  return {
    net,
    deductions: {
      retirement,
      healthInsurance,
      pami,
      total,
    },
  };
}
