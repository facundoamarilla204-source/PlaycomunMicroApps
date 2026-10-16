import { describe, it, expect } from "vitest"
import {
  formatLocalDate,
  getPeriodDateRange,
  calculateMovementsSummary,
  filterAndSortMovements,
  sanitizeForExcel,
  generateExpensesExcelWorkbook,
} from "./control-gastos"
import { Expense } from "@/components/tools/control-gastos/types"

describe("Control de Gastos: Date Range Logic (Argentina Standards)", () => {
  it("formats date to local YYYY-MM-DD correctly", () => {
    const d = new Date(2026, 9, 15) // Month 9 is October (0-indexed)
    expect(formatLocalDate(d)).toBe("2026-10-15")
  })

  it("calculates 'esta-semana' starting strictly on Monday and ending on Sunday", () => {
    // 2026-10-14 is Wednesday
    const wednesday = new Date(2026, 9, 14)
    const range = getPeriodDateRange("esta-semana", wednesday)
    expect(range.startDate).toBe("2026-10-12") // Monday
    expect(range.endDate).toBe("2026-10-18") // Sunday
  })

  it("calculates 'esta-semana' correctly when reference day is Sunday", () => {
    // 2026-10-18 is Sunday
    const sunday = new Date(2026, 9, 18)
    const range = getPeriodDateRange("esta-semana", sunday)
    expect(range.startDate).toBe("2026-10-12") // Monday of the same week
    expect(range.endDate).toBe("2026-10-18") // Sunday itself
  })

  it("calculates 'esta-semana' correctly when reference day is Monday", () => {
    // 2026-10-12 is Monday
    const monday = new Date(2026, 9, 12)
    const range = getPeriodDateRange("esta-semana", monday)
    expect(range.startDate).toBe("2026-10-12") // Monday
    expect(range.endDate).toBe("2026-10-18") // Sunday
  })

  it("calculates 'este-mes' correctly for October 2026", () => {
    const ref = new Date(2026, 9, 15)
    const range = getPeriodDateRange("este-mes", ref)
    expect(range.startDate).toBe("2026-10-01")
    expect(range.endDate).toBe("2026-10-31")
  })

  it("calculates 'mes-anterior' without date overflow on day 31", () => {
    // March 31: Moving 1 month back must yield 1st to 28th/29th of February, NEVER March!
    const march31 = new Date(2026, 2, 31)
    const range = getPeriodDateRange("mes-anterior", march31)
    expect(range.startDate).toBe("2026-02-01")
    expect(range.endDate).toBe("2026-02-28")
  })

  it("calculates 'mes-anterior' correctly on January (rolls back to December of previous year)", () => {
    const jan15 = new Date(2026, 0, 15)
    const range = getPeriodDateRange("mes-anterior", jan15)
    expect(range.startDate).toBe("2025-12-01")
    expect(range.endDate).toBe("2025-12-31")
  })

  it("returns null dates for 'todos'", () => {
    const range = getPeriodDateRange("todos")
    expect(range.startDate).toBeNull()
    expect(range.endDate).toBeNull()
  })
})

describe("Control de Gastos: Summary Calculations", () => {
  const sampleMovements: Expense[] = [
    {
      id: "1",
      user_id: "user-1",
      type: "income",
      amount: 150000,
      description: "Sueldo",
      category: "Sueldo / Salario",
      expense_date: "2026-10-05",
      payment_method: "Transferencia",
      notes: null,
      created_at: "2026-10-05T10:00:00Z",
      updated_at: "2026-10-05T10:00:00Z",
    },
    {
      id: "2",
      user_id: "user-1",
      type: "income",
      amount: 25000,
      description: "Venta extra",
      category: "Ventas",
      expense_date: "2026-10-10",
      payment_method: "Mercado Pago",
      notes: null,
      created_at: "2026-10-10T12:00:00Z",
      updated_at: "2026-10-10T12:00:00Z",
    },
    {
      id: "3",
      user_id: "user-1",
      type: "expense",
      amount: 40000,
      description: "Supermercado",
      category: "Alimentación",
      expense_date: "2026-10-06",
      payment_method: "Débito",
      notes: "Compras del mes",
      created_at: "2026-10-06T15:00:00Z",
      updated_at: "2026-10-06T15:00:00Z",
    },
    {
      id: "4",
      user_id: "user-1",
      type: "expense",
      amount: 15000,
      description: "Combustible",
      category: "Transporte",
      expense_date: "2026-10-08",
      payment_method: "Efectivo",
      notes: null,
      created_at: "2026-10-08T18:00:00Z",
      updated_at: "2026-10-08T18:00:00Z",
    },
  ]

  it("calculates totalIncome, totalExpense and netBalance accurately", () => {
    const summary = calculateMovementsSummary(sampleMovements)
    expect(summary.totalIncome).toBe(175000)
    expect(summary.totalExpense).toBe(55000)
    expect(summary.netBalance).toBe(120000) // 175000 - 55000
    expect(summary.incomeCount).toBe(2)
    expect(summary.expenseCount).toBe(2)
    expect(summary.maxExpense).toBe(40000)
    expect(summary.maxIncome).toBe(150000)
    expect(summary.topExpenseCategory).toBe("Alimentación")
    expect(summary.topExpenseCategoryAmount).toBe(40000)
  })

  it("handles empty movement list gracefully", () => {
    const summary = calculateMovementsSummary([])
    expect(summary.totalIncome).toBe(0)
    expect(summary.totalExpense).toBe(0)
    expect(summary.netBalance).toBe(0)
    expect(summary.incomeCount).toBe(0)
    expect(summary.expenseCount).toBe(0)
    expect(summary.topExpenseCategory).toBe("Ninguna")
  })
})

describe("Control de Gastos: Filtering and Sorting", () => {
  const sampleMovements: Expense[] = [
    {
      id: "1",
      user_id: "user-1",
      type: "income",
      amount: 100000,
      description: "Honorarios Desarrollo Web",
      category: "Honorarios",
      expense_date: "2026-10-14",
      payment_method: "Transferencia",
      notes: "Cliente X",
      created_at: "2026-10-14T10:00:00Z",
      updated_at: "2026-10-14T10:00:00Z",
    },
    {
      id: "2",
      user_id: "user-1",
      type: "expense",
      amount: 20000,
      description: "Supermercado Coto",
      category: "Alimentación",
      expense_date: "2026-10-14",
      payment_method: "Débito",
      notes: null,
      created_at: "2026-10-14T12:00:00Z",
      updated_at: "2026-10-14T12:00:00Z",
    },
    {
      id: "3",
      user_id: "user-1",
      type: "expense",
      amount: 15000,
      description: "Farmacia",
      category: "Salud",
      expense_date: "2026-09-20",
      payment_method: "Efectivo",
      notes: null,
      created_at: "2026-09-20T10:00:00Z",
      updated_at: "2026-09-20T10:00:00Z",
    },
  ]

  it("filters by type 'income'", () => {
    const res = filterAndSortMovements(sampleMovements, {
      typeFilter: "income",
      period: "todos",
    })
    expect(res).toHaveLength(1)
    expect(res[0].id).toBe("1")
  })

  it("filters by period 'mes-anterior'", () => {
    // If reference is 2026-10-15, last month is September 2026
    const res = filterAndSortMovements(sampleMovements, {
      period: "mes-anterior",
      referenceDate: new Date(2026, 9, 15),
    })
    expect(res).toHaveLength(1)
    expect(res[0].id).toBe("3")
  })

  it("filters by search query matching description or notes", () => {
    const res = filterAndSortMovements(sampleMovements, {
      searchQuery: "Cliente X",
      period: "todos",
    })
    expect(res).toHaveLength(1)
    expect(res[0].id).toBe("1")
  })

  it("sorts by mayor-monto", () => {
    const res = filterAndSortMovements(sampleMovements, {
      sortBy: "mayor-monto",
      period: "todos",
    })
    expect(res[0].amount).toBe(100000)
    expect(res[1].amount).toBe(20000)
    expect(res[2].amount).toBe(15000)
  })
})

describe("Control de Gastos: Excel Sanitization and Export", () => {
  it("escapes formula injection prefixes (=, +, -, @)", () => {
    expect(sanitizeForExcel("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)")
    expect(sanitizeForExcel("+12345")).toBe("'+12345")
    expect(sanitizeForExcel("-cmd|' /C calc'!A0")).toBe("'-cmd|' /C calc'!A0")
    expect(sanitizeForExcel("@malicious")).toBe("'@malicious")
    expect(sanitizeForExcel("Gasto normal")).toBe("Gasto normal")
  })

  it("generates a valid binary Excel workbook without errors", () => {
    const sample: Expense[] = [
      {
        id: "1",
        user_id: "user-1",
        type: "expense",
        amount: 5000,
        description: "Prueba",
        category: "Alimentación",
        expense_date: "2026-10-15",
        payment_method: "Efectivo",
        notes: null,
        created_at: "2026-10-15T10:00:00Z",
        updated_at: "2026-10-15T10:00:00Z",
      },
    ]
    const buffer = generateExpensesExcelWorkbook(sample, "Este mes")
    expect(buffer).toBeInstanceOf(Uint8Array)
    expect(buffer.length).toBeGreaterThan(1000) // Valid zip/xlsx structure
  })
})
