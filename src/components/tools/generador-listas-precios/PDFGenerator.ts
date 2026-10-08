import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PriceList } from './types'

export function generatePDF(list: PriceList, action: 'download' | 'blob' = 'download') {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(22)
  doc.text(list.name || 'Lista de Precios', 14, 20)
  
  doc.setFontSize(11)
  if (list.business_name) {
    doc.text(`Negocio: ${list.business_name}`, 14, 30)
  }
  if (list.contact_info) {
    doc.text(`Contacto: ${list.contact_info}`, 14, 36)
  }
  if (list.updated_date) {
    doc.text(`Actualizado: ${new Date(list.updated_date).toLocaleDateString('es-AR')}`, 14, 42)
  }

  // Table
  const tableData = list.products.map(p => [
    p.code || '-',
    p.name,
    p.category || '-',
    `$${p.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ])

  autoTable(doc, {
    startY: 50,
    head: [['Código', 'Producto', 'Categoría', 'Precio']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237] }, // #7C3AED
    styles: { font: 'helvetica', fontSize: 10 },
  })

  if (action === 'blob') {
    return doc.output('bloburl')
  }
  
  doc.save(`${list.name || 'lista-de-precios'}.pdf`)
}
