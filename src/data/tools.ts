export type Tool = {
  slug: string
  name: string
  description: string
  category: "calculadoras" | "generadores" | "utilidades"
  icon: string
  tier: "free" | "pro"
  status: "live" | "soon"
  featured: boolean
  keywords: string[]
  updatedAt: string
  seo?: {
    title: string
    description: string
    h1: string
    intro: string
    keywords?: string[]
  }
  faqs?: { question: string; answer: string }[]
  related?: string[]
}

const NOW = new Date().toISOString()

export const tools: Tool[] = [
  {
    slug: "calculadora-precios",
    name: "Calculadora de precios",
    category: "calculadoras",
    tier: "free",
    description: "Calculá el precio de venta ideal con tus costos, IVA y comisiones.",
    icon: "Calculator",
    status: "live",
    featured: true,
    keywords: ["calculadora de precio de venta", "cómo calcular el precio de venta", "calcular margen de ganancia", "margen vs markup", "calcular precio con IVA", "calculadora de costos"],
    updatedAt: "2026-10-03T00:00:00.000Z",
    seo: {
      title: "Calculadora de precio de venta: costo, margen e IVA",
      description: "Calculá el precio de venta ideal de tu producto con costos, margen o recargo, IVA, comisiones e impuestos. Gratis, sin registro y pensada para Argentina.",
      h1: "Calculadora de precio de venta",
      intro: "Ingresá tus costos y calculá el precio al que tenés que vender para ganar lo que buscás, con IVA, comisiones e impuestos incluidos."
    },
    faqs: [
      {
        question: '¿Cuál es la diferencia entre margen y markup (recargo)?',
        answer: 'El margen es el porcentaje de ganancia sobre el precio final. El recargo o markup es el porcentaje que le sumás a tu costo original.'
      },
      {
        question: '¿Cómo calculo el precio de venta con IVA?',
        answer: 'Para calcularlo, tenés que dividir tu precio neto deseado por 1 menos las comisiones e impuestos (incluyendo el impacto del IVA). Esta calculadora hace esa matemática exacta por vos.'
      },
      {
        question: '¿Qué margen de ganancia debería tener mi producto?',
        answer: 'No hay un número único. Depende de tu rubro, qué tan exclusivos sean tus productos, tus costos fijos y a cuánto vende la competencia. Lo ideal es investigar el mercado y ajustar según tus números.'
      },
      {
        question: '¿Cómo incluyo los costos fijos en el precio?',
        answer: 'Para incluirlos, tenés que calcular un promedio de cuántas unidades vendés al mes y dividir tus costos fijos totales por esa cantidad. Ese número es tu costo fijo por unidad.'
      },
      {
        question: '¿Los monotributistas tienen que sumar IVA al precio?',
        answer: 'No. Los monotributistas no discriminan IVA, por lo que su precio neto es igual a su precio final. Deben elegir la opción "Monotributista o exento" en la calculadora.'
      },
      {
        question: '¿Cómo incluyo la comisión de Mercado Pago o de la tarjeta?',
        answer: 'Tenés que mirar el porcentaje que te descuentan sobre el precio final de venta. Si la plataforma le suma IVA a su propia comisión, sumá ese extra al porcentaje total.'
      },
      {
        question: '¿Cómo calculo cuánto gano si ya tengo un precio?',
        answer: 'Para eso usá el modo "Calcular mi ganancia" en la calculadora. Ingresás tu precio final, tus costos, IVA y comisiones, y te muestra la ganancia neta por unidad.'
      },
      {
        question: '¿Cada cuánto conviene revisar los precios?',
        answer: 'En contextos de alta inflación, lo ideal es revisarlos al menos una vez al mes o cada vez que un proveedor importante te suba los costos. Así evitás perder rentabilidad.'
      },
      {
        question: '¿Sirve también para servicios?',
        answer: 'Sí. Simplemente tenés que poner el costo de tus insumos o el valor de tus horas de trabajo como "Costo del producto o servicio" y calcular de la misma forma.'
      }
    ],
    related: ["calculadora-aguinaldo", "generador-presupuestos"]
  },
  {
    slug: "generador-presupuestos",
    name: "Generador de presupuestos",
    category: "generadores",
    tier: "free",
    description: "Creá presupuestos profesionales y descargalos en PDF",
    icon: "FileText",
    status: "live",
    featured: true,
    keywords: ["generador de presupuestos", "hacer presupuesto online", "presupuesto en PDF", "generador de presupuestos gratis", "crear cotización"],
    updatedAt: new Date().toISOString(),
    seo: {
      title: "Generador de presupuestos online gratis en PDF",
      description: "Creá, editá y descargá presupuestos profesionales en PDF de forma rápida, gratis y sin registrarte. Especial para emprendedores y freelancers en Argentina.",
      h1: "Generador de presupuestos",
      intro: "Creá tu presupuesto en segundos. Completá los datos, agregá tus conceptos y obtené un PDF con diseño profesional al instante."
    },
    faqs: [
      {
        question: '¿Qué es un presupuesto?',
        answer: 'Un presupuesto es una propuesta comercial donde se detallan los productos o servicios que vas a ofrecer a un cliente, junto con sus precios, condiciones y fechas de validez. No tiene valor fiscal como una factura.'
      },
      {
        question: '¿Puedo generar el presupuesto en formato PDF?',
        answer: 'Sí. Una vez que hayas completado todos los datos en el formulario, al hacer click en el botón "Descargar PDF", se generará automáticamente un archivo con diseño profesional listo para enviar a tu cliente.'
      },
      {
        question: '¿El servicio es realmente gratuito?',
        answer: 'Sí, la generación básica de presupuestos en PDF es completamente gratuita, sin necesidad de crear una cuenta ni de introducir tarjetas de crédito.'
      },
      {
        question: '¿Quedan guardados mis datos en la nube?',
        answer: 'En esta versión gratuita, los datos que ingresás en el formulario solo se guardan temporalmente en tu navegador. Si cerrás la pestaña sin descargar, se perderán. Para guardar el historial deberás acceder a una cuenta Pro en el futuro.'
      },
      {
        question: '¿Cómo agrego un descuento a un producto o servicio?',
        answer: 'Al agregar un concepto a tu presupuesto, podés especificar un porcentaje de descuento exclusivo para ese ítem. El generador calculará automáticamente los importes.'
      },
      {
        question: '¿Es válido un presupuesto sin firma?',
        answer: 'Sí. Un presupuesto es un documento comercial previo y no requiere firma obligatoria, aunque podés incluir tus condiciones de aceptación (como un adelanto) en el recuadro de observaciones.'
      }
    ],
    related: ["calculadora-precios"]
  },
  {
    slug: "calculadora-iva",
    name: "Calculadora de IVA",
    category: "calculadoras",
    tier: "free",
    description: "Calculá el IVA y el precio final con o sin impuestos.",
    icon: "Receipt",
    status: "soon",
    featured: true,
    keywords: ["iva", "impuesto", "precio", "afip", "factura"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-rentabilidad",
    name: "Calculadora de rentabilidad",
    category: "calculadoras",
    tier: "pro",
    description: "Conocé la rentabilidad de tu negocio o producto.",
    icon: "TrendingUp",
    status: "soon",
    featured: true,
    keywords: ["rentabilidad", "roi", "ganancia", "margen", "negocio"],
    updatedAt: NOW,
  },
  {
    slug: "generador-qr",
    name: "Generador de QR",
    category: "generadores",
    tier: "free",
    description: "Creá códigos QR para pagos, enlaces o texto.",
    icon: "QrCode",
    status: "soon",
    featured: true,
    keywords: ["qr", "codigo", "scan", "enlace", "pago"],
    updatedAt: NOW,
  },
  {
    slug: "control-gastos",
    name: "Control de gastos",
    category: "utilidades",
    tier: "free",
    description: "Llevá un control simple y efectivo de tus gastos.",
    icon: "Wallet",
    status: "soon",
    featured: true,
    keywords: ["gastos", "finanzas", "dinero", "control", "presupuesto"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-1rm",
    name: "Calculadora de 1RM",
    category: "calculadoras",
    tier: "free",
    description: "Conocé tu fuerza máxima en un ejercicio.",
    icon: "Dumbbell",
    status: "soon",
    featured: true,
    keywords: ["fuerza", "1rm", "gym", "gimnasio", "ejercicio", "pesas"],
    updatedAt: NOW,
  },
  {
    slug: "conversor-unidades",
    name: "Conversor de unidades",
    category: "utilidades",
    tier: "pro",
    description: "Convertí entre distintas unidades de forma rápida.",
    icon: "ArrowRightLeft",
    status: "soon",
    featured: true,
    keywords: ["conversor", "unidades", "medidas", "kilos", "libras", "metros", "centimetros"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-aguinaldo",
    name: "Calculadora de aguinaldo",
    category: "calculadoras",
    tier: "free",
    description: "Calculá tu aguinaldo (SAC) de forma rápida y sencilla.",
    icon: "Banknote",
    status: "live",
    featured: true,
    keywords: ["calculadora de aguinaldo", "calcular aguinaldo", "SAC", "aguinaldo proporcional", "aguinaldo diciembre 2026", "aguinaldo neto"],
    updatedAt: "2026-10-03T00:00:00.000Z",
    seo: {
      title: "Calculadora de aguinaldo 2026: calculá tu SAC",
      description: "Calculá tu aguinaldo (SAC) de junio o diciembre 2026, completo o proporcional. Gratis, sin registro y con la cuenta explicada paso a paso.",
      h1: "Calculadora de aguinaldo (SAC) 2026",
      intro: "Ingresá tu mejor sueldo del semestre y mirá cuánto te corresponde de aguinaldo, con la cuenta explicada paso a paso."
    },
    faqs: [
      {
        question: '¿Cuándo se cobra el aguinaldo de diciembre de 2026?',
        answer: 'La fecha límite legal para depositar la segunda cuota es el viernes 18 de diciembre. Sin embargo, con el margen de 4 días hábiles, los empleadores tienen tiempo hasta el jueves 24 de diciembre.'
      },
      {
        question: '¿El aguinaldo se calcula sobre el último sueldo o sobre un promedio?',
        answer: 'Ninguno de los dos. El aguinaldo se calcula siempre tomando el 50% de la mayor remuneración mensual bruta devengada dentro de ese semestre.'
      },
      {
        question: '¿Cómo se calcula el aguinaldo si tengo sueldo variable?',
        answer: 'No importa si tu sueldo cambia todos los meses por horas extras o comisiones. Tenés que buscar en tus recibos del semestre cuál fue el monto bruto más alto y calcular la mitad de ese valor.'
      },
      {
        question: '¿Qué pasa si entré a trabajar a mitad del semestre?',
        answer: 'En ese caso cobrás un aguinaldo proporcional. Se calcula la mitad de tu mejor sueldo, se lo multiplica por los días que trabajaste y se lo divide por 180 (los días convencionales del semestre).'
      },
      {
        question: '¿Cuánto me corresponde si mi mejor sueldo es de $1.000.000?',
        answer: 'Si trabajaste los 6 meses completos del semestre, tu aguinaldo bruto será exactamente la mitad: $500.000. A eso luego se le aplican los descuentos de ley para saber tu neto en mano.'
      },
      {
        question: '¿El aguinaldo tiene descuentos?',
        answer: 'Sí. El monto bruto calculado sufre los mismos descuentos legales que tu sueldo normal (generalmente un 17% entre jubilación, obra social y PAMI), además de cuotas sindicales o Impuesto a las Ganancias si corresponde.'
      },
      {
        question: '¿Los monotributistas cobran aguinaldo?',
        answer: 'No. El aguinaldo es un derecho exclusivo para quienes trabajan en relación de dependencia. Los monotributistas, al prestas servicios independientes, no perciben el SAC.'
      },
      {
        question: '¿Cambió el aguinaldo con la reforma laboral?',
        answer: 'La fórmula para calcular el SAC y las fechas de pago siguen siendo las mismas. La reforma laboral de 2024 solo modificó que el aguinaldo ya no se incluye en la base de ciertas indemnizaciones por despido.'
      },
      {
        question: '¿Qué hago si mi empleador no me pagó el aguinaldo?',
        answer: 'Una vez pasada la fecha límite y el margen de 4 días hábiles, tenés derecho a intimar por escrito para que se te pague. Lo ideal en esos casos es consultar a tu sindicato o a un abogado laboralista.'
      }
    ],
    related: ["calculadora-precios", "generador-presupuestos"]
  },
  {
    slug: "calculadora-cuotas",
    name: "Calculadora de cuotas",
    category: "calculadoras",
    tier: "pro",
    description: "Simulá cuotas y compará opciones de financiamiento.",
    icon: "CreditCard",
    status: "soon",
    featured: true,
    keywords: ["cuotas", "interes", "prestamo", "financiamiento", "tarjeta", "credito"],
    updatedAt: NOW,
  },
  {
    slug: "control-stock",
    name: "Control de stock",
    category: "utilidades",
    tier: "pro",
    description: "Gestioná tu inventario de forma simple y rápida.",
    icon: "Boxes",
    status: "soon",
    featured: true,
    keywords: ["stock", "inventario", "productos", "gestion", "deposito"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-calorias",
    name: "Calculadora de calorías",
    category: "calculadoras",
    tier: "free",
    description: "Conocé cuántas calorías necesitás según tu objetivo.",
    icon: "Flame",
    status: "soon",
    featured: true,
    keywords: ["calorias", "dieta", "nutricion", "macros", "tdee"],
    updatedAt: NOW,
  },
]
