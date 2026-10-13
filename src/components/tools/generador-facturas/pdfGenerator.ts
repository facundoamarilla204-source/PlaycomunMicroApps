import { CommercialDocument } from './types'
import { calculateDocumentTotals, formatCurrencyAmount } from './math'

// Helpers de color hexadecimal a RGB
function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '')
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('')
  }
  const intVal = parseInt(clean, 16)
  if (isNaN(intVal)) return [124, 58, 237] // Default purple #7C3AED
  return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255]
}

function sanitizeFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export async function generateDocumentPdf(
  docData: CommercialDocument,
  action: 'download' | 'blob' = 'download'
): Promise<string | Blob | void> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  const rgbColor = hexToRgb(docData.accentColor || '#7C3AED')
  const totals = calculateDocumentTotals(
    docData.items,
    docData.globalDiscountPercent,
    docData.applyTax,
    docData.taxRate
  )

  let currentY = margin

  // 1. HEADER BANNER / TOP SECTION SEGÚN PLANTILLA
  if (docData.designTemplate === 'modern') {
    doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2])
    doc.rect(0, 0, pageWidth, 7, 'F')
    currentY += 4
  }

  // Si es Factura Proforma: Banner de advertencia obligatorio
  if (docData.type === 'factura-proforma') {
    doc.setFillColor(254, 242, 242) // Fondo rojizo tenue
    doc.setDrawColor(248, 113, 113) // Borde suave
    doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'FD')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(185, 28, 28)
    doc.text(
      'DOCUMENTO COMERCIAL INFORMATIVO — NO VÁLIDO COMO FACTURA FISCAL (SIN VALOR TRIBUTARIO ARCA / AFIP)',
      pageWidth / 2,
      currentY + 5.2,
      { align: 'center' }
    )
    currentY += 12
  }

  // 2. ENCABEZADO: LOGO Y DATOS DEL EMISOR (IZQ) / TÍTULO Y NUMERACIÓN (DER)
  const headerStartY = currentY

  // Lado Izquierdo: Logo y Emisor
  let emisorX = margin
  if (docData.emisor.logo) {
    try {
      doc.addImage(docData.emisor.logo, 'PNG', margin, currentY, 26, 26, undefined, 'FAST')
      emisorX += 30
    } catch {
      // Si falla la imagen por formato, continuar sin romper el PDF
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(17, 24, 39) // Slate 900
  doc.text(docData.emisor.name || 'Nombre del Emisor', emisorX, currentY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(75, 85, 99) // Slate 600

  let emisorLineY = currentY + 10
  if (docData.emisor.taxId) {
    doc.text(`Identificación / CUIT: ${docData.emisor.taxId}`, emisorX, emisorLineY)
    emisorLineY += 4
  }
  if (docData.emisor.address || docData.emisor.city) {
    const loc = [docData.emisor.address, docData.emisor.city].filter(Boolean).join(', ')
    doc.text(loc, emisorX, emisorLineY)
    emisorLineY += 4
  }
  if (docData.emisor.phone) {
    doc.text(`Tel / WhatsApp: ${docData.emisor.phone}`, emisorX, emisorLineY)
    emisorLineY += 4
  }
  if (docData.emisor.email) {
    doc.text(`Email: ${docData.emisor.email}`, emisorX, emisorLineY)
    emisorLineY += 4
  }

  // Lado Derecho: Título del documento y número
  const docTitles: Record<string, string> = {
    presupuesto: 'PRESUPUESTO',
    recibo: 'RECIBO DE PAGO',
    'orden-trabajo': 'ORDEN DE TRABAJO',
    'factura-proforma': 'FACTURA PROFORMA',
  }
  const mainTitle = docTitles[docData.type] || 'DOCUMENTO COMERCIAL'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2])
  doc.text(mainTitle, pageWidth - margin, headerStartY + 6, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(31, 41, 55)
  doc.text(`N° ${docData.number || '0001'}`, pageWidth - margin, headerStartY + 12, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`Fecha de emisión: ${docData.issueDate || '—'}`, pageWidth - margin, headerStartY + 17, { align: 'right' })
  doc.text(`Moneda: ${docData.currency}`, pageWidth - margin, headerStartY + 21, { align: 'right' })

  currentY = Math.max(emisorLineY, headerStartY + 26) + 4

  // Línea separadora decorativa
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.4)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 6

  // 3. DATOS DEL CLIENTE Y FECHAS CLAVE EN CAJAS VISUALES
  const clientBoxWidth = (contentWidth - 6) / 2
  const clientBoxHeight = 28

  // Caja Cliente
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, currentY, clientBoxWidth, clientBoxHeight, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2])
  doc.text('DATOS DEL CLIENTE / RECEPTOR', margin + 3.5, currentY + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(17, 24, 39)
  doc.text(docData.cliente.name || 'Consumidor Final / Cliente General', margin + 3.5, currentY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(75, 85, 99)
  let cY = currentY + 14.5
  if (docData.cliente.taxId) {
    doc.text(`CUIT / DNI: ${docData.cliente.taxId}`, margin + 3.5, cY)
    cY += 3.5
  }
  if (docData.cliente.address || docData.cliente.city) {
    doc.text([docData.cliente.address, docData.cliente.city].filter(Boolean).join(', '), margin + 3.5, cY)
    cY += 3.5
  }
  if (docData.cliente.phone || docData.cliente.email) {
    doc.text([docData.cliente.phone, docData.cliente.email].filter(Boolean).join(' • '), margin + 3.5, cY)
  }

  // Caja Detalles Documento / Metadatos
  const metaX = margin + clientBoxWidth + 6
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(metaX, currentY, clientBoxWidth, clientBoxHeight, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2])
  doc.text('CONDICIONES Y PLAZOS', metaX + 3.5, currentY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(55, 65, 81)
  let mY = currentY + 10

  if (docData.type === 'presupuesto') {
    doc.text(`Validez de la oferta: ${docData.presupuestoMeta?.validityDays || 15} días corridos`, metaX + 3.5, mY)
    mY += 4.5
    if (docData.presupuestoMeta?.deliveryTime) {
      doc.text(`Plazo de entrega: ${docData.presupuestoMeta.deliveryTime}`, metaX + 3.5, mY)
      mY += 4.5
    }
    if (docData.presupuestoMeta?.commercialTerms) {
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      const splitTerms = doc.splitTextToSize(`Condiciones: ${docData.presupuestoMeta.commercialTerms}`, clientBoxWidth - 7)
      doc.text(splitTerms.slice(0, 2), metaX + 3.5, mY)
    }
  } else if (docData.type === 'recibo') {
    doc.text(`Medio de pago: ${(docData.reciboMeta?.paymentMethod || 'Efectivo').toUpperCase()}`, metaX + 3.5, mY)
    mY += 4.5
    doc.text(`Fecha de cobro: ${docData.issueDate}`, metaX + 3.5, mY)
    mY += 4.5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2])
    doc.text(`Saldo restante: ${formatCurrencyAmount(docData.reciboMeta?.pendingBalance || 0, docData.currency)}`, metaX + 3.5, mY)
  } else if (docData.type === 'orden-trabajo') {
    if (docData.ordenTrabajoMeta?.targetDeliveryDate) {
      doc.text(`Fecha estimada entrega: ${docData.ordenTrabajoMeta.targetDeliveryDate}`, metaX + 3.5, mY)
      mY += 4.5
    }
    if (docData.ordenTrabajoMeta?.warrantyTerms) {
      doc.text(`Garantía: ${docData.ordenTrabajoMeta.warrantyTerms}`, metaX + 3.5, mY)
      mY += 4.5
    }
    doc.text('Estado: Recibido en taller / En proceso', metaX + 3.5, mY)
  } else if (docData.type === 'factura-proforma') {
    if (docData.facturaProformaMeta?.validityUntil) {
      doc.text(`Válida hasta: ${docData.facturaProformaMeta.validityUntil}`, metaX + 3.5, mY)
      mY += 4.5
    }
    if (docData.facturaProformaMeta?.paymentConditions) {
      const splitCond = doc.splitTextToSize(`Pago: ${docData.facturaProformaMeta.paymentConditions}`, clientBoxWidth - 7)
      doc.text(splitCond.slice(0, 2), metaX + 3.5, mY)
    }
  }

  currentY += clientBoxHeight + 5

  // 4. CAMPOS ESPECÍFICOS SEGÚN EL TIPO DE DOCUMENTO
  if (docData.type === 'recibo') {
    // DESTACADO DE IMPORTE RECIBIDO
    doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2])
    doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('IMPORTE TOTAL RECIBIDO EN ESTE ACTO', margin + 6, currentY + 6)

    doc.setFontSize(15)
    doc.text(
      formatCurrencyAmount(docData.reciboMeta?.amountPaid || 0, docData.currency),
      margin + 6,
      currentY + 12.5
    )

    // Detalle de saldo
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const saldoTxt = `Total Operación: ${formatCurrencyAmount(docData.reciboMeta?.totalOperationAmount || 0, docData.currency)}   |   Saldo Pendiente: ${formatCurrencyAmount(docData.reciboMeta?.pendingBalance || 0, docData.currency)}`
    doc.text(saldoTxt, pageWidth - margin - 6, currentY + 9, { align: 'right' })

    currentY += 21

    if (docData.reciboMeta?.paymentConcept) {
      doc.setFillColor(243, 244, 246)
      doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(75, 85, 99)
      doc.text('EN CONCEPTO DE:', margin + 4, currentY + 4.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(17, 24, 39)
      const splitConcept = doc.splitTextToSize(docData.reciboMeta.paymentConcept, contentWidth - 8)
      doc.text(splitConcept.slice(0, 2), margin + 4, currentY + 8.5)
      currentY += 16
    }
  } else if (docData.type === 'orden-trabajo') {
    // SECCIÓN TÉCNICA DE ORDEN DE TRABAJO
    doc.setFillColor(241, 245, 249)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, currentY, contentWidth, 22, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2])
    doc.text('INFORMACIÓN DEL EQUIPO / VEHÍCULO / OBJETO', margin + 4, currentY + 5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(17, 24, 39)
    const equipText = [
      docData.ordenTrabajoMeta?.equipmentOrTarget || 'Equipo no especificado',
      docData.ordenTrabajoMeta?.brandModel,
      docData.ordenTrabajoMeta?.identifierNumber ? `[ID/Serie: ${docData.ordenTrabajoMeta.identifierNumber}]` : ''
    ].filter(Boolean).join(' • ')
    doc.text(equipText, margin + 4, currentY + 9.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text('PROBLEMA MANIFESTADO / TRABAJO SOLICITADO:', margin + 4, currentY + 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(31, 41, 55)
    const issueText = docData.ordenTrabajoMeta?.reportedIssue || 'Mantenimiento y revisión general'
    const splitIssue = doc.splitTextToSize(issueText, contentWidth - 8)
    doc.text(splitIssue.slice(0, 1), margin + 4, currentY + 18)

    currentY += 26

    if (docData.ordenTrabajoMeta?.technicalDiagnosis) {
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2])
      doc.text('DIAGNÓSTICO TÉCNICO PRELIMINAR:', margin + 4, currentY + 4.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(31, 41, 55)
      const splitDiag = doc.splitTextToSize(docData.ordenTrabajoMeta.technicalDiagnosis, contentWidth - 8)
      doc.text(splitDiag.slice(0, 2), margin + 4, currentY + 8.5)
      currentY += 16
    }
  }

  // 5. TABLA DE ÍTEMS / CONCEPTOS CON AUTOTABLE
  const tableHead = docData.type === 'orden-trabajo'
    ? [['#', 'Mano de obra, repuesto o concepto', 'Cant.', 'Precio Unit.', 'Subtotal']]
    : [['#', 'Descripción / Concepto', 'Cant.', 'Precio Unit.', 'Desc.', 'Subtotal']]

  const tableRows = docData.items.map((item, index) => {
    const qty = Number(item.quantity) || 1
    const unitPrice = Number(item.unitPrice) || 0
    const desc = Number(item.discountPercent) || 0
    const subtotal = item.subtotal || 0

    if (docData.type === 'orden-trabajo') {
      return [
        (index + 1).toString(),
        item.description || 'Concepto sin detalle',
        qty.toString(),
        formatCurrencyAmount(unitPrice, docData.currency, false),
        formatCurrencyAmount(subtotal, docData.currency, false),
      ]
    }

    return [
      (index + 1).toString(),
      item.description || 'Concepto sin detalle',
      qty.toString(),
      formatCurrencyAmount(unitPrice, docData.currency, false),
      desc > 0 ? `${desc}%` : '—',
      formatCurrencyAmount(subtotal, docData.currency, false),
    ]
  })

  // Título de la tabla
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(17, 24, 39)
  const tableSectionTitle = docData.type === 'orden-trabajo'
    ? 'Detalle de Tareas y Repuestos'
    : docData.type === 'recibo'
    ? 'Conceptos incluidos'
    : 'Detalle de Productos y Servicios'
  doc.text(tableSectionTitle, margin, currentY)
  currentY += 3

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableRows.length > 0 ? tableRows : [['1', 'Sin ítems especificados', '1', '0.00', '—', '0.00']],
    margin: { left: margin, right: margin },
    theme: docData.designTemplate === 'minimal' ? 'plain' : 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      font: 'helvetica',
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: docData.designTemplate === 'minimal' ? [243, 244, 246] : rgbColor,
      textColor: docData.designTemplate === 'minimal' ? [17, 24, 39] : [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: docData.type === 'orden-trabajo' ? { cellWidth: 26, halign: 'right' } : { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: docData.designTemplate === 'classic' ? [249, 250, 251] : undefined,
    },
  })

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 6

  // 6. TOTALES Y RESUMEN FINANCIERO (ALINEADO A LA DERECHA)
  const totalsBoxWidth = 78
  const totalsX = pageWidth - margin - totalsBoxWidth

  // Verificamos si entra en la página o requiere salto
  if (currentY + 45 > pageHeight - 20) {
    doc.addPage()
    currentY = margin + 5
  }

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)

  // Subtotal
  doc.text('Subtotal:', totalsX, currentY)
  doc.text(formatCurrencyAmount(totals.rawSubtotal, docData.currency), pageWidth - margin, currentY, { align: 'right' })
  currentY += 4.5

  // Descuentos en líneas
  if (totals.linesDiscountTotal > 0) {
    doc.text('Descuentos por ítem:', totalsX, currentY)
    doc.setTextColor(220, 38, 38)
    doc.text(`-${formatCurrencyAmount(totals.linesDiscountTotal, docData.currency)}`, pageWidth - margin, currentY, { align: 'right' })
    doc.setTextColor(75, 85, 99)
    currentY += 4.5
  }

  // Descuento global
  if (docData.globalDiscountPercent > 0) {
    doc.text(`Descuento general (${docData.globalDiscountPercent}%):`, totalsX, currentY)
    doc.setTextColor(220, 38, 38)
    doc.text(`-${formatCurrencyAmount(totals.globalDiscountAmount, docData.currency)}`, pageWidth - margin, currentY, { align: 'right' })
    doc.setTextColor(75, 85, 99)
    currentY += 4.5
  }

  // IVA / Impuesto si está activo
  if (docData.applyTax && docData.taxRate > 0) {
    doc.text(`IVA (${docData.taxRate}%):`, totalsX, currentY)
    doc.text(formatCurrencyAmount(totals.taxAmount, docData.currency), pageWidth - margin, currentY, { align: 'right' })
    currentY += 4.5
  }

  // Línea separadora
  doc.setDrawColor(209, 213, 219)
  doc.line(totalsX, currentY, pageWidth - margin, currentY)
  currentY += 4

  // TOTAL FINAL DESTACADO
  doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2])
  doc.roundedRect(totalsX - 3, currentY - 1, totalsBoxWidth + 3, 10, 1.5, 1.5, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL:', totalsX + 2, currentY + 6)

  doc.setFontSize(11)
  doc.text(
    formatCurrencyAmount(totals.grandTotal, docData.currency),
    pageWidth - margin - 2,
    currentY + 6,
    { align: 'right' }
  )

  currentY += 15

  // 7. OBSERVACIONES, CONDICIONES Y FIRMA
  if (currentY + 30 > pageHeight - 20) {
    doc.addPage()
    currentY = margin + 5
  }

  if (docData.footerNotes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    doc.text('OBSERVACIONES Y CONDICIONES:', margin, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(107, 114, 128)
    const splitNotes = doc.splitTextToSize(docData.footerNotes, contentWidth)
    doc.text(splitNotes, margin, currentY)
    currentY += splitNotes.length * 3.5 + 4
  }

  // Espacio para Firma si aplica
  if (docData.type === 'recibo' || docData.type === 'orden-trabajo' || docData.type === 'presupuesto') {
    const signY = Math.max(currentY + 12, pageHeight - 38)
    if (signY < pageHeight - 20) {
      const signLineWidth = 55
      const signX = pageWidth - margin - signLineWidth

      doc.setDrawColor(156, 163, 175)
      doc.setLineWidth(0.3)
      doc.line(signX, signY, signX + signLineWidth, signY)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(107, 114, 128)
      const signLabel = docData.type === 'recibo'
        ? (docData.reciboMeta?.receiverSignatureTitle || 'Firma y Aclaración del Receptor')
        : docData.type === 'orden-trabajo'
        ? 'Firma / Conformidad del Cliente'
        : 'Firma / Aceptación del Presupuesto'

      doc.text(signLabel, signX + signLineWidth / 2, signY + 4, { align: 'center' })
    }
  }

  // 8. PIE DE PÁGINA Y NUMERACIÓN EN TODAS LAS PÁGINAS
  // @ts-expect-error getNumberOfPages is standard jsPDF
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Línea tenue
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(156, 163, 175)

    const footerText = docData.type === 'factura-proforma'
      ? 'Documento comercial proforma sin validez fiscal ni contable • PlayComún Online (playcomun.com)'
      : 'Documento comercial de gestión interna • Generado con PlayComún Online (playcomun.com)'

    doc.text(footerText, margin, pageHeight - 8)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  const baseFileName = `${sanitizeFilename(docData.type)}-${sanitizeFilename(docData.number || '0001')}.pdf`

  if (action === 'blob') {
    return doc.output('blob')
  }

  doc.save(baseFileName)
}
