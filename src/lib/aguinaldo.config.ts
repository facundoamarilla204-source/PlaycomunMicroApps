// Fecha de revisión de reglas: 3 de octubre de 2026
// Fuentes: iProfesional, Canal 26, La Gaceta, Cronista, Diario de Cuyo, Hacecuentas.

export const AGUINALDO_CONFIG = {
  // Divisor convencional para semestre (180 días)
  SEMESTER_DAYS: 180,

  // Descuentos de ley sobre el bruto (17% en total)
  DEDUCTIONS: {
    RETIREMENT: 0.11, // 11% jubilación
    HEALTH_INSURANCE: 0.03, // 3% obra social
    PAMI: 0.03, // 3% INSSJP/PAMI
    TOTAL: 0.17, // 17% total
  },

  // Fechas límite por ley (Ley 27.073) y margen hábil
  // Para 2026:
  // Junio: martes 30 de junio + 4 días hábiles -> hasta 6 de julio.
  // Diciembre: viernes 18 de diciembre + 4 días hábiles -> hasta 24 de diciembre.
  PAYMENT_DATES: {
    YEAR: 2026,
    JUNE: {
      LEGAL_DEADLINE: '30 de junio',
      MARGIN_TEXT: 'con hasta 4 días hábiles de margen (en 2026, hasta el 6 de julio)',
    },
    DECEMBER: {
      LEGAL_DEADLINE: '18 de diciembre',
      MARGIN_TEXT: 'con hasta 4 días hábiles de margen (en 2026, hasta el 24 de diciembre, aproximadamente, según el cómputo habitual de días hábiles)',
    },
  },
};
