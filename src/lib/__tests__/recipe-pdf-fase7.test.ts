import { describe, it, expect, vi } from 'vitest'
import { exportSingleRecipePdf } from '../recipePdf'
import { Recipe } from '../costo-receta'

// Mock jsPDF and jspdf-autotable to inspect generated structure
const mockSave = vi.fn()
const mockAutoTable = vi.fn()
const mockText = vi.fn()

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
      getNumberOfPages: () => 1,
    }
    setFillColor = vi.fn()
    rect = vi.fn()
    setTextColor = vi.fn()
    setFontSize = vi.fn()
    setFont = vi.fn()
    text = mockText
    splitTextToSize = vi.fn((text: string) => [text])
    setDrawColor = vi.fn()
    roundedRect = vi.fn()
    line = vi.fn()
    addPage = vi.fn()
    setPage = vi.fn()
    save = mockSave
  }

  return {
    jsPDF: MockJsPDF,
  }
})

vi.mock('jspdf-autotable', () => {
  return {
    default: (...args: any[]) => mockAutoTable(...args),
  }
})

describe('Exportación de Ficha Técnica PDF con Subrecetas (Fase 7)', () => {
  const recipeWithSubrecipes: Recipe = {
    id: 'rec-torta-selva-negra',
    name: 'Torta Selva Negra',
    category: 'Pastelería Fina',
    description: 'Torta clásica con bizcochuelo y cerezas',
    yield_quantity: 1,
    yield_unit: 'unidades',
    target_margin: 40,
    target_markup: 0,
    pricing_mode: 'margin',
    ingredients: [
      {
        id: 'ing-crema',
        name: 'Crema de leche',
        quantity: 500,
        unit: 'ml',
        reference_price: 3000,
        reference_quantity: 1,
        reference_unit: 'l',
      },
    ],
    additional_costs: [],
    subrecipes: [
      {
        id: 'sub-rel-1',
        recipe_id: 'rec-torta-selva-negra',
        subrecipe_id: 'rec-bizcocho-cacao',
        subrecipe_name: 'Bizcochuelo de Cacao',
        quantity: 1,
        unit: 'unidades',
        waste_percentage: 0,
        position: 1,
        reference_yield_quantity: 1,
        reference_yield_unit: 'unidades',
        reference_total_cost: 1500,
      },
      {
        id: 'sub-rel-2',
        recipe_id: 'rec-torta-selva-negra',
        subrecipe_id: 'rec-cerezas-almibar',
        subrecipe_name: 'Cerezas al Marasquino',
        quantity: 250,
        unit: 'g',
        waste_percentage: 5,
        position: 2,
        reference_yield_quantity: 1000,
        reference_yield_unit: 'g',
        reference_total_cost: 1200,
      },
    ],
  }

  it('exporta ficha técnica llamando a jsPDF e incluyendo tabla de subrecetas', async () => {
    mockSave.mockClear()
    mockAutoTable.mockClear()
    mockText.mockClear()

    await exportSingleRecipePdf(recipeWithSubrecipes, {
      subrecipesBreakdown: [
        {
          subrecipeRelationId: 'sub-rel-1',
          subrecipeId: 'rec-bizcocho-cacao',
          subrecipeName: 'Bizcochuelo de Cacao',
          netQuantity: 1,
          grossQuantity: 1,
          unit: 'unidades',
          wastePercentage: 0,
          subrecipeYieldQuantity: 1,
          subrecipeYieldUnit: 'unidades',
          subrecipeTotalCost: 1500,
          subrecipeUnitCost: 1500,
          calculatedCost: 1500,
          percentageOfTotal: 35,
          savedHistoricalCost: 1500,
          hasCostDivergence: false,
          hasYieldDivergence: false,
          isProvisional: false,
        },
      ],
    })

    // Debe guardar el documento con nombre sanitizado
    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(mockSave).toHaveBeenCalledWith('Ficha_Receta_torta_selva_negra.pdf')

    // Debe renderizar la tabla de ingredientes y la tabla de subrecetas
    expect(mockAutoTable).toHaveBeenCalled()
    // Buscar si alguna llamada a text imprimió el título de la sección de subrecetas
    const subrecipesTitleCall = mockText.mock.calls.find((call) =>
      call[0]?.toString().includes('Subrecetas y Elaboraciones Compuestas')
    )
    expect(subrecipesTitleCall).toBeDefined()
  })

  it('mantiene compatibilidad intacta para recetas simples sin subrecetas', async () => {
    mockSave.mockClear()
    mockAutoTable.mockClear()
    mockText.mockClear()

    const simpleRecipe: Recipe = {
      id: 'rec-simple',
      name: 'Galletas de Manteca',
      category: 'Panadería',
      description: 'Galletas caseras de manteca',
      yield_quantity: 24,
      yield_unit: 'unidades',
      target_margin: 30,
      target_markup: 0,
      pricing_mode: 'margin',
      ingredients: [
        {
          id: 'ing-harina',
          name: 'Harina 0000',
          quantity: 500,
          unit: 'g',
          reference_price: 800,
          reference_quantity: 1,
          reference_unit: 'kg',
        },
      ],
      additional_costs: [],
      subrecipes: [],
    }

    await exportSingleRecipePdf(simpleRecipe)
    expect(mockSave).toHaveBeenCalledWith('Ficha_Receta_galletas_de_manteca.pdf')

    // No debe imprimir encabezado de subrecetas
    const subrecipesTitleCall = mockText.mock.calls.find((call) =>
      call[0]?.toString().includes('Subrecetas y Elaboraciones Compuestas')
    )
    expect(subrecipesTitleCall).toBeUndefined()
  })
})
