import { Recipe, calculateRecipeFinancials, formatCurrency } from './costo-receta'
import { RecipeStep, SubrecipeFinancialItem } from './gastronomia/types'

export interface ExportSingleRecipePdfOptions {
  steps?: RecipeStep[]
  isLivePrice?: boolean
  priceSourceNote?: string
  subrecipesBreakdown?: SubrecipeFinancialItem[]
}

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50) || 'receta'
}

/**
 * Export a single recipe technical sheet to PDF
 */
export async function exportSingleRecipePdf(
  recipe: Recipe,
  options?: ExportSingleRecipePdfOptions
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const financials = calculateRecipeFinancials(recipe)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  // 1. Header Banner
  doc.setFillColor(124, 58, 237) // Brand Purple
  doc.rect(0, 0, pageWidth, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('PLAYCOMÚN', margin, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const subtitle = options?.isLivePrice
    ? 'Ficha Técnica · Costeo en Vivo (Precios Biblioteca)'
    : 'Ficha Técnica y Escandallo de Costos'
  doc.text(subtitle, margin, 17)

  const todayStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(`Fecha: ${todayStr}`, pageWidth - margin, 14, { align: 'right' })

  let currentY = 30

  // 2. Recipe Title and Category
  doc.setTextColor(17, 24, 39) // Slate 900
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(recipe.name || 'Sin Título', margin, currentY)
  currentY += 6

  if (recipe.category) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(109, 40, 217) // Purple
    doc.text(`CATEGORÍA: ${recipe.category.toUpperCase()}`, margin, currentY)
    currentY += 5
  }

  if (recipe.description) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    const descLines = doc.splitTextToSize(recipe.description, contentWidth)
    doc.text(descLines, margin, currentY)
    currentY += descLines.length * 4.5 + 2
  } else {
    currentY += 2
  }

  const techParams: string[] = []
  if (recipe.prep_time_minutes) techParams.push(`Prep: ${recipe.prep_time_minutes} min`)
  if (recipe.cook_time_minutes) techParams.push(`Cocción: ${recipe.cook_time_minutes} min`)
  if (recipe.rest_time_minutes) techParams.push(`Reposo: ${recipe.rest_time_minutes} min`)
  if (recipe.baking_temperature_celsius) techParams.push(`Horno: ${recipe.baking_temperature_celsius}°C`)
  if (recipe.baking_loss_percentage && recipe.baking_loss_percentage > 0) techParams.push(`Pérdida horneado: ${recipe.baking_loss_percentage}%`)

  if (techParams.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    doc.text(`Parámetros técnicos: ${techParams.join('  |  ')}`, margin, currentY)
    currentY += 5
  }

  // Banner de advertencia en caso de conversiones incompletas o incompatibles
  if (financials.hasConversionErrors) {
    const bannerHeight = 12
    doc.setFillColor(254, 243, 199) // Amber 100
    doc.setDrawColor(245, 158, 11) // Amber 500
    doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(180, 83, 9) // Amber 700
    doc.text(
      `ADVERTENCIA: Esta receta contiene ${financials.invalidIngredientsCount} ingrediente(s) con unidades no convertibles (falta densidad).`,
      margin + 3,
      currentY + 5
    )
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(
      'Los costos e importes sugeridos son PROVISIONALES y no incluyen los ingredientes pendientes de conversión.',
      margin + 3,
      currentY + 9.5
    )
    currentY += bannerHeight + 4
  }

  // 3. Financial Summary KPI Grid
  const kpiBoxHeight = 22
  const kpiColWidth = contentWidth / 4

  // Background card for KPIs
  doc.setFillColor(249, 250, 251)
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(margin, currentY, contentWidth, kpiBoxHeight, 2, 2, 'FD')

  // Column 1: Rendimiento
  let colX = margin + 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text('RENDIMIENTO', colX, currentY + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text(`${recipe.yield_quantity} ${recipe.yield_unit}`, colX, currentY + 14)

  // Column 2: Costo Total
  colX += kpiColWidth
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text(financials.hasConversionErrors ? 'COSTO (PROVISORIO)' : 'COSTO TOTAL', colX, currentY + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text(
    `${formatCurrency(financials.totalCost)}${financials.hasConversionErrors ? '*' : ''}`,
    colX,
    currentY + 14
  )

  // Column 3: Costo Unitario
  colX += kpiColWidth
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text(financials.hasConversionErrors ? 'COSTO UNIT. (PROV.)' : 'COSTO UNITARIO', colX, currentY + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(109, 40, 217)
  doc.text(formatCurrency(financials.unitCost), colX, currentY + 14)

  // Column 4: Precio Venta Sugerido (destacado)
  colX += kpiColWidth
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text(financials.hasConversionErrors ? 'PRECIO (PROVISORIO)' : 'PRECIO VENTA SUG.', colX, currentY + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(financials.hasConversionErrors ? 217 : 16, financials.hasConversionErrors ? 119 : 149, financials.hasConversionErrors ? 6 : 106)
  doc.text(formatCurrency(financials.suggestedPrice), colX, currentY + 14)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Ganancia: ${formatCurrency(financials.profitPerUnit)}/u`, colX, currentY + 19)

  currentY += kpiBoxHeight + 8

  // 4. Tabla de Ingredientes
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text('Detalle de Ingredientes', margin, currentY)
  currentY += 4

  const ingredientsRows = financials.ingredientsWithCost.map((i, index) => {
    const costText = i.conversionError ? 'Revisar unidad*' : formatCurrency(i.calculated_cost)
    const incText = i.conversionError ? '-' : `${i.percentageOfTotal.toFixed(1)}%`
    return [
      (index + 1).toString(),
      i.name || 'Sin nombre',
      `${i.quantity} ${i.unit}`,
      `${formatCurrency(i.reference_price)} / ${i.reference_quantity} ${i.reference_unit}`,
      costText,
      incText,
    ]
  })

  // Subtotal row
  ingredientsRows.push([
    '',
    'SUBTOTAL INGREDIENTES',
    '',
    '',
    formatCurrency(financials.totalIngredients),
    `${financials.totalCost > 0 ? ((financials.totalIngredients / financials.totalCost) * 100).toFixed(1) : 0}%`,
  ])

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Ingrediente', 'Cantidad', 'Precio Compra Ref.', 'Costo Receta', '% Incidencia']],
    body: ingredientsRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      font: 'helvetica',
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 38, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'right' },
    },
    didParseCell: (data) => {
      // Highlight the subtotal row
      if (data.row.index === ingredientsRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [243, 244, 246]
        if (data.column.index === 1) {
          data.cell.styles.textColor = [124, 58, 237]
        }
      }
    },
  })

  let finalY = (doc as any).lastAutoTable?.finalY || currentY + 40

  // 4.1 Tabla de Subrecetas y Elaboraciones Compuestas (si existen)
  const subrecipesList = options?.subrecipesBreakdown || (recipe.subrecipes || []).map((sr) => ({
    subrecipeName: sr.subrecipe_name || 'Subreceta',
    netQuantity: sr.quantity,
    unit: sr.unit,
    wastePercentage: sr.waste_percentage || 0,
    subrecipeYieldQuantity: sr.reference_yield_quantity || 1,
    subrecipeYieldUnit: sr.reference_yield_unit || 'unidades',
    calculatedCost: sr.reference_total_cost || 0,
    percentageOfTotal: 0,
    conversionError: null,
  }))

  let totalSubrecipesCost = 0
  if (subrecipesList.length > 0) {
    if (finalY + 30 > pageHeight - 20) {
      doc.addPage()
      finalY = 20
    } else {
      finalY += 8
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(17, 24, 39)
    doc.text('Subrecetas y Elaboraciones Compuestas', margin, finalY)
    finalY += 4

    totalSubrecipesCost = subrecipesList.reduce((sum, item) => sum + (Number(item.calculatedCost) || 0), 0)

    const subrecipeRows = subrecipesList.map((sr, index) => {
      const wasteText = sr.wastePercentage > 0 ? ` (+${sr.wastePercentage}% merma)` : ''
      return [
        (index + 1).toString(),
        sr.subrecipeName,
        `${sr.netQuantity} ${sr.unit}${wasteText}`,
        `${sr.subrecipeYieldQuantity} ${sr.subrecipeYieldUnit}`,
        sr.conversionError ? 'Revisar unidad*' : formatCurrency(sr.calculatedCost),
        `${financials.totalCost > 0 ? ((sr.calculatedCost / financials.totalCost) * 100).toFixed(1) : 0}%`,
      ]
    })

    subrecipeRows.push([
      '',
      'SUBTOTAL SUBRECETAS',
      '',
      '',
      formatCurrency(totalSubrecipesCost),
      `${financials.totalCost > 0 ? ((totalSubrecipesCost / financials.totalCost) * 100).toFixed(1) : 0}%`,
    ])

    autoTable(doc, {
      startY: finalY,
      head: [['#', 'Subreceta / Componente', 'Cantidad Utilizada', 'Rendimiento Base', 'Costo Componente', '% Incidencia']],
      body: subrecipeRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        font: 'helvetica',
        textColor: [31, 41, 55],
      },
      headStyles: {
        fillColor: [109, 40, 217],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 22, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.index === subrecipeRows.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [245, 243, 255]
          if (data.column.index === 1) {
            data.cell.styles.textColor = [109, 40, 217]
          }
        }
      },
    })

    finalY = (doc as any).lastAutoTable?.finalY || finalY + 25
  }

  // 5. Tabla de Costos Adicionales (si existen)
  if (recipe.additional_costs && recipe.additional_costs.length > 0) {
    if (finalY + 30 > pageHeight - 20) {
      doc.addPage()
      finalY = 20
    } else {
      finalY += 8
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(17, 24, 39)
    doc.text('Otros Costos de Elaboración', margin, finalY)
    finalY += 4

    const costsRows = recipe.additional_costs.map((c, idx) => [
      (idx + 1).toString(),
      c.name || 'Concepto adicional',
      formatCurrency(Number(c.amount) || 0),
      `${financials.totalCost > 0 ? (((Number(c.amount) || 0) / financials.totalCost) * 100).toFixed(1) : 0}%`,
    ])

    costsRows.push([
      '',
      'SUBTOTAL OTROS COSTOS',
      formatCurrency(financials.totalAdditional),
      `${financials.totalCost > 0 ? ((financials.totalAdditional / financials.totalCost) * 100).toFixed(1) : 0}%`,
    ])

    autoTable(doc, {
      startY: finalY,
      head: [['#', 'Concepto / Mano de obra / Servicios', 'Monto', '% Incidencia']],
      body: costsRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        font: 'helvetica',
        textColor: [31, 41, 55],
      },
      headStyles: {
        fillColor: [75, 85, 99], // Slate
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 26, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.index === costsRows.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [243, 244, 246]
          if (data.column.index === 1) {
            data.cell.styles.textColor = [75, 85, 99]
          }
        }
      },
    })

    finalY = (doc as any).lastAutoTable?.finalY || finalY + 25
  }

  // 6. Rentabilidad y Fijación de Precios Resumen
  if (finalY + 30 > pageHeight - 20) {
    doc.addPage()
    finalY = 20
  } else {
    finalY += 8
  }

  doc.setFillColor(245, 243, 255) // Brand Light Purple
  doc.setDrawColor(221, 214, 254)
  doc.roundedRect(margin, finalY, contentWidth, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(109, 40, 217)
  const modeLabel =
    recipe.pricing_mode === 'margin'
      ? `Margen de Ganancia (${recipe.target_margin}%)`
      : `Recargo sobre Costo (${recipe.target_markup}%) - Margen real: ${financials.realMarginPct.toFixed(1)}%`
  doc.text(`POLÍTICA DE PRECIOS: ${modeLabel.toUpperCase()}`, margin + 4, finalY + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(55, 65, 81)
  doc.text(
    `Costo por unidad: ${formatCurrency(financials.unitCost)}  |  Ganancia estimada por unidad: ${formatCurrency(
      financials.profitPerUnit
    )}  |  Ganancia total por lote: ${formatCurrency(financials.totalProfit)}`,
    margin + 4,
    finalY + 15
  )

  // 6.b Pasos de Elaboración (si existen)
  const stepsList = options?.steps || recipe.steps
  if (stepsList && stepsList.length > 0) {
    if (finalY + 35 > pageHeight - 20) {
      doc.addPage()
      finalY = 20
    } else {
      finalY += 8
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(17, 24, 39)
    doc.text('Procedimiento y Pasos de Elaboración', margin, finalY)
    finalY += 4

    const stepsRows = stepsList.map((s, idx) => {
      const stepNum = (s.step_number || idx + 1).toString()
      const durationStr = s.duration_minutes ? `${s.duration_minutes} min` : '-'
      const extraParts: string[] = []
      if (s.temperature_celsius) extraParts.push(`${s.temperature_celsius}°C`)
      if (s.equipment) extraParts.push(`Equip: ${s.equipment}`)
      if (s.notes) extraParts.push(s.notes)
      const extraStr = extraParts.length > 0 ? extraParts.join(' | ') : '-'

      return [stepNum, s.instruction, durationStr, extraStr]
    })

    autoTable(doc, {
      startY: finalY,
      head: [['#', 'Instrucción / Procedimiento', 'Tiempo', 'Parámetros / Notas']],
      body: stepsRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        font: 'helvetica',
        textColor: [31, 41, 55],
      },
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 50 },
      },
    })

    finalY = (doc as any).lastAutoTable?.finalY || finalY + 25
  }

  // 7. Footer en todas las páginas
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(156, 163, 175)

    doc.setDrawColor(229, 231, 235)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

    doc.text(
      'Generado con PlayComun Herramientas | playcomun.online',
      margin,
      pageHeight - 6
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, {
      align: 'right',
    })
  }

  const filename = `Ficha_Receta_${sanitizeFilename(recipe.name)}.pdf`
  doc.save(filename)
}

/**
 * Export full catalog of all recipes to PDF
 */
export async function exportAllRecipesPdf(recipes: Recipe[]): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // Banner
  doc.setFillColor(124, 58, 237)
  doc.rect(0, 0, pageWidth, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('PLAYCOMUN HERRAMIENTAS', margin, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Catálogo Consolidado de Recetas, Costos y Precios de Venta', margin, 17)

  const todayStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.text(`Total Recetas: ${recipes.length} | Fecha: ${todayStr}`, pageWidth - margin, 14, {
    align: 'right',
  })

  let hasAnyProvisional = false
  const tableRows = recipes.map((r, index) => {
    const fin = calculateRecipeFinancials(r)
    if (fin.hasConversionErrors) hasAnyProvisional = true
    const costText = fin.hasConversionErrors
      ? `${formatCurrency(fin.totalCost)}* (Pendiente)`
      : formatCurrency(fin.totalCost)
    const priceText = fin.hasConversionErrors
      ? `${formatCurrency(fin.suggestedPrice)}*`
      : formatCurrency(fin.suggestedPrice)

    return [
      (index + 1).toString(),
      r.name || 'Sin nombre',
      r.category || '-',
      `${r.yield_quantity} ${r.yield_unit}`,
      costText,
      formatCurrency(fin.unitCost),
      r.pricing_mode === 'margin' ? `${r.target_margin}% (margen)` : `${r.target_markup}% (recargo)`,
      priceText,
      formatCurrency(fin.profitPerUnit),
    ]
  })

  autoTable(doc, {
    startY: 28,
    head: [
      [
        '#',
        'Receta',
        'Categoría',
        'Rendimiento',
        'Costo Total',
        'Costo Unit.',
        'Margen/Markup',
        'Precio Venta Sug.',
        'Ganancia Unit.',
      ],
    ],
    body: tableRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      font: 'helvetica',
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 30, halign: 'center' },
      7: { cellWidth: 34, halign: 'right', fontStyle: 'bold', textColor: [16, 149, 106] },
      8: { cellWidth: 28, halign: 'right', textColor: [109, 40, 217] },
    },
  })

  if (hasAnyProvisional) {
    const tableFinalY = (doc as any).lastAutoTable?.finalY || 180
    if (tableFinalY + 10 < pageHeight - 15) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(180, 83, 9) // Amber 700
      doc.text(
        '* Las recetas marcadas con (Pendiente) contienen ingredientes con unidades incompatibles (sin densidad). Sus costos son parciales.',
        margin,
        tableFinalY + 6
      )
    }
  }

  // Footers
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(156, 163, 175)

    doc.setDrawColor(229, 231, 235)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

    doc.text(
      'PlayComun Herramientas - Catálogo de Costos y Recetas | Generado desde playcomun.online',
      margin,
      pageHeight - 6
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, {
      align: 'right',
    })
  }

  doc.save('Catalogo_Recetas_PlayComun.pdf')
}
