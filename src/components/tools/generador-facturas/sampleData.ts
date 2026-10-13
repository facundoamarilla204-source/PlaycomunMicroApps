import { CommercialDocument, DocumentType } from './types'
import { calculateLineSubtotal } from './math'

export function getSampleDocument(type: DocumentType): CommercialDocument {
  const today = new Date().toISOString().split('T')[0]

  switch (type) {
    case 'presupuesto':
      return {
        id: 'sample-presupuesto',
        type: 'presupuesto',
        number: 'PRE-000104',
        issueDate: today,
        currency: 'ARS',
        emisor: {
          name: 'Estudio Pixel Creativo',
          taxId: '20-38491204-7',
          phone: '+54 11 4892-3321',
          email: 'contacto@pixelcreativo.com.ar',
          address: 'Av. Corrientes 1450, Piso 4',
          city: 'CABA, Argentina',
        },
        cliente: {
          name: 'Distribuidora Los Andes S.R.L.',
          taxId: '30-71449812-4',
          phone: '+54 11 5521-9988',
          email: 'administracion@losandesdist.com',
          address: 'Belgrano 820',
          city: 'Córdoba, Argentina',
        },
        items: [
          {
            id: 'item-1',
            description: 'Rediseño de Identidad Visual y Manual de Marca (Logo, paleta, tipografías)',
            quantity: 1,
            unitPrice: 280000,
            discountPercent: 10,
            subtotal: calculateLineSubtotal(1, 280000, 10),
          },
          {
            id: 'item-2',
            description: 'Diseño y maquetación de Catálogo Digital de Productos (24 páginas en PDF interactivo)',
            quantity: 1,
            unitPrice: 195000,
            discountPercent: 0,
            subtotal: calculateLineSubtotal(1, 195000, 0),
          },
          {
            id: 'item-3',
            description: 'Pack de plantillas editables para redes sociales (15 piezas en Canva/Figma)',
            quantity: 2,
            unitPrice: 45000,
            discountPercent: 0,
            subtotal: calculateLineSubtotal(2, 45000, 0),
          },
        ],
        globalDiscountPercent: 0,
        applyTax: false,
        taxRate: 21,
        presupuestoMeta: {
          validityDays: 15,
          deliveryTime: '12 a 15 días hábiles a partir de la confirmación',
          commercialTerms: '50% de anticipo para iniciar tareas y 50% al entregar los archivos finales aprobados.',
        },
        reciboMeta: {
          paymentConcept: '',
          paymentMethod: 'transferencia',
          amountPaid: 0,
          totalOperationAmount: 0,
          pendingBalance: 0,
          receiverSignatureTitle: 'Firma y Aclaración',
        },
        ordenTrabajoMeta: {
          equipmentOrTarget: '',
          reportedIssue: '',
        },
        facturaProformaMeta: {},
        designTemplate: 'modern',
        accentColor: '#7C3AED',
        footerNotes: 'Precios sujetos a confirmación dentro de los 15 días de validez. Alias CBU: pixel.creativo.mp / Banco Santander Río.',
      }

    case 'recibo':
      return {
        id: 'sample-recibo',
        type: 'recibo',
        number: 'REC-000832',
        issueDate: today,
        currency: 'ARS',
        emisor: {
          name: 'Climatización & Servicios del Sur',
          taxId: '23-32456789-9',
          phone: '+54 11 3822-1100',
          email: 'info@climasur.com.ar',
          address: 'Av. San Martín 2341',
          city: 'Lomas de Zamora, Buenos Aires',
        },
        cliente: {
          name: 'Federico Gómez',
          taxId: '20-35112443-1',
          phone: '+54 11 6112-4433',
          email: 'federico.gomez@gmail.com',
          address: 'Calle Las Heras 450',
          city: 'Banfield, Buenos Aires',
        },
        items: [
          {
            id: 'rec-item-1',
            description: 'Provisión e Instalación de 2 Equipos Split 3000 Fg Inverter con ménsulas y cañería',
            quantity: 1,
            unitPrice: 750000,
            discountPercent: 0,
            subtotal: 750000,
          },
        ],
        globalDiscountPercent: 0,
        applyTax: false,
        taxRate: 21,
        presupuestoMeta: {
          validityDays: 15,
        },
        reciboMeta: {
          paymentConcept: 'Anticipo 50% para reserva de equipos y fijación de fecha de colocación domiciliaria.',
          paymentMethod: 'transferencia',
          amountPaid: 375000,
          totalOperationAmount: 750000,
          pendingBalance: 375000,
          receiverSignatureTitle: 'Firma y Sello del Receptor',
        },
        ordenTrabajoMeta: {
          equipmentOrTarget: '',
          reportedIssue: '',
        },
        facturaProformaMeta: {},
        designTemplate: 'modern',
        accentColor: '#059669', // Verde esmeralda para recibos de cobro
        footerNotes: 'El saldo restante ($ 375.000) se abonará una vez concluida la prueba y puesta en marcha del equipo en el domicilio.',
      }

    case 'orden-trabajo':
      return {
        id: 'sample-ot',
        type: 'orden-trabajo',
        number: 'OT-000491',
        issueDate: today,
        currency: 'ARS',
        emisor: {
          name: 'Laboratorio Informático FixPoint',
          taxId: '27-36778912-3',
          phone: '+54 11 5002-8877',
          email: 'soporte@fixpoint.com.ar',
          address: 'Av. Cabildo 2840, Local 12',
          city: 'Belgrano, CABA',
        },
        cliente: {
          name: 'Valeria Rivas',
          taxId: '27-40112834-8',
          phone: '+54 11 4411-9922',
          email: 'valerivas@outlook.com',
          address: 'Juramento 1920, 2° B',
          city: 'CABA',
        },
        items: [
          {
            id: 'ot-item-1',
            description: 'Mano de obra: Mantenimiento integral, cambio de pasta térmica Arctic MX-4 y limpieza de disipadores',
            quantity: 1,
            unitPrice: 38000,
            discountPercent: 0,
            subtotal: 38000,
          },
          {
            id: 'ot-item-2',
            description: 'Repuesto: Disco Sólido SSD NVMe 1TB Kingston NV2 PCIe 4.0 con clonación de sistema',
            quantity: 1,
            unitPrice: 85000,
            discountPercent: 0,
            subtotal: 85000,
          },
        ],
        globalDiscountPercent: 0,
        applyTax: false,
        taxRate: 21,
        presupuestoMeta: {
          validityDays: 15,
        },
        reciboMeta: {
          paymentConcept: '',
          paymentMethod: 'efectivo',
          amountPaid: 0,
          totalOperationAmount: 0,
          pendingBalance: 0,
        },
        ordenTrabajoMeta: {
          equipmentOrTarget: 'Notebook Lenovo ThinkPad E14 Gen 2',
          brandModel: 'Lenovo ThinkPad E14 / Intel Core i5 11va Gen',
          identifierNumber: 'S/N: PF-28K901 / Cargador original 65W USB-C',
          reportedIssue: 'Equipo levanta temperatura excesiva, el cooler hace ruido continuo y se apaga a los 20 minutos de uso intensivo.',
          technicalDiagnosis: 'Pasta térmica cristalizada y obstrucción de pelusa en tobera de salida. Disco mecánico secundario con sectores dañados.',
          targetDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          warrantyTerms: '90 días de garantía sobre la mano de obra realizada. Garantía del SSD según fabricante oficial (36 meses).',
        },
        facturaProformaMeta: {},
        designTemplate: 'classic',
        accentColor: '#2563EB', // Azul técnico
        footerNotes: 'Los equipos no retirados transcurridos 60 días corridos de la fecha de entrega podrán ser enviados a depósito general.',
      }

    case 'factura-proforma':
      return {
        id: 'sample-proforma',
        type: 'factura-proforma',
        number: 'PRO-000215',
        issueDate: today,
        currency: 'USD',
        emisor: {
          name: 'Comercializadora Industrial Austral',
          taxId: '30-68912445-9',
          phone: '+54 11 4300-7711',
          email: 'ventas@industrialaustral.com',
          address: 'Ruta 8 Km 54, Parque Industrial',
          city: 'Pilar, Buenos Aires',
        },
        cliente: {
          name: 'Constructora del Plata S.A.',
          taxId: '30-71009845-2',
          phone: '+54 11 5900-1122',
          email: 'compras@constructoradelplata.com',
          address: 'Av. Alicia Moreau de Justo 1150',
          city: 'Puerto Madero, CABA',
        },
        items: [
          {
            id: 'pro-item-1',
            description: 'Válvula Reguladora de Presión Neumática 1" Alta Resistencia en Acero Inoxidable',
            quantity: 4,
            unitPrice: 320,
            discountPercent: 5,
            subtotal: calculateLineSubtotal(4, 320, 5),
          },
          {
            id: 'pro-item-2',
            description: 'Manómetro Digital de Precisión 0-100 PSI con calibración trazable',
            quantity: 4,
            unitPrice: 110,
            discountPercent: 0,
            subtotal: calculateLineSubtotal(4, 110, 0),
          },
          {
            id: 'pro-item-3',
            description: 'Kit de juntas y sellos de alta temperatura Viton (Set x 10)',
            quantity: 2,
            unitPrice: 45,
            discountPercent: 0,
            subtotal: calculateLineSubtotal(2, 45, 0),
          },
        ],
        globalDiscountPercent: 0,
        applyTax: true,
        taxRate: 21,
        presupuestoMeta: {
          validityDays: 10,
        },
        reciboMeta: {
          paymentConcept: '',
          paymentMethod: 'transferencia',
          amountPaid: 0,
          totalOperationAmount: 0,
          pendingBalance: 0,
        },
        ordenTrabajoMeta: {
          equipmentOrTarget: '',
          reportedIssue: '',
        },
        facturaProformaMeta: {
          paymentConditions: 'Pago 100% anticipado mediante transferencia bancaria o carta de crédito.',
          validityUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          originCountry: 'Argentina',
        },
        designTemplate: 'modern',
        accentColor: '#334155',
        footerNotes: 'DOCUMENTO PROFORMA DE CARÁCTER INFORMATIVO Y COMERCIAL. Despacho en depósito una vez acreditado el pago bancario.',
      }
  }
}
