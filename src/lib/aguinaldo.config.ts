// Base legal: Ley 23.041, Decreto 1078/1984, Ley de Contrato de Trabajo (arts. 121, 122 y 123) y Ley 27.073.

export const AGUINALDO_CONFIG = {
  YEAR: 2026,

  // Días reales por semestre:
  // 1.er semestre: enero (31) + febrero (28 o 29) + marzo (31) + abril (30) + mayo (31) + junio (30)
  // -> 181 días en año común (como 2026); 182 días en año bisiesto.
  // 2.º semestre: julio (31) + agosto (31) + septiembre (30) + octubre (31) + noviembre (30) + diciembre (31)
  // -> 184 días corridos.
  SEMESTER_1_DAYS_NON_LEAP: 181,
  SEMESTER_1_DAYS_LEAP: 182,
  SEMESTER_2_DAYS: 184,

  // Descuentos de ley sobre el bruto (17% en total bajo régimen general LCT)
  DEDUCTIONS: {
    RETIREMENT: 0.11, // 11% jubilación SIPA (Ley 24.241)
    HEALTH_INSURANCE: 0.03, // 3% obra social (Ley 23.660)
    PAMI: 0.03, // 3% INSSJP/PAMI (Ley 19.032)
    TOTAL: 0.17, // 17% total
  },

  // Vencimientos legales según Art. 122 de la LCT (Ley 27.073)
  PAYMENT_DATES: {
    YEAR: 2026,
    JUNE: {
      LEGAL_DEADLINE: '30 de junio',
    },
    DECEMBER: {
      LEGAL_DEADLINE: '18 de diciembre',
    },
  },
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getSemesterDays(semester: '1' | '2' = '1', year: number = 2026): number {
  if (semester === '2') {
    return AGUINALDO_CONFIG.SEMESTER_2_DAYS;
  }
  return isLeapYear(year)
    ? AGUINALDO_CONFIG.SEMESTER_1_DAYS_LEAP
    : AGUINALDO_CONFIG.SEMESTER_1_DAYS_NON_LEAP;
}
