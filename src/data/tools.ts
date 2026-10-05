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
    intro: string
    h1?: string
    keywords?: string[]
  }
  customUrl?: string
  faqs?: { question: string; answer: string }[]
  related?: string[]
}

export function getToolUrl(tool: Tool): string {
  return tool.customUrl || `/herramientas/${tool.slug}`
}


const NOW = new Date().toISOString()

export const tools: Tool[] = [
  {
    slug: "control-gastos",
    name: "Control de gastos",
    category: "utilidades",
    tier: "free",
    description: "Registrá y organizá tus gastos diarios de forma rápida. Conocé en qué se va tu dinero.",
    icon: "Wallet",
    status: "live",
    featured: true,
    keywords: ["control de gastos", "app gastos", "registro de gastos", "organizar finanzas", "control gastos personales"],
    updatedAt: NOW,
    seo: {
      title: "Control de Gastos Personales | PlayComun",
      description: "Llevá un registro de tus gastos, conocé en qué se va tu dinero y organizá tus finanzas. App gratis, rápida y fácil de usar desde el celular.",
      h1: "Control de Gastos Personales",
      intro: "La forma más simple de registrar lo que gastás y cuidar tu bolsillo mes a mes."
    }
  },
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
    description: "Calculá el IVA, agregalo a un precio o desglosalo de un importe final.",
    icon: "Receipt",
    status: "live",
    featured: true,
    keywords: ["calculadora de IVA", "calcular IVA", "calculadora IVA Argentina", "calcular IVA online", "calcular precio con IVA", "calcular precio sin IVA", "quitar IVA", "agregar IVA", "IVA 21%", "calcular IVA incluido", "impuestos", "precios"],
    updatedAt: NOW,
    seo: {
      title: "Calculadora de IVA Argentina: Agregar o quitar IVA",
      description: "Calculadora de IVA gratuita para Argentina. Agregá IVA a un precio neto o desglosá el IVA de un precio final. Tasas del 21%, 10,5% y 27%.",
      h1: "Calculadora de IVA",
      intro: "Calculá fácilmente el IVA de cualquier producto o servicio. Agregá IVA a un precio sin impuestos o desglosá el IVA de un precio final."
    },
    faqs: [
      {
        question: "¿Cómo se calcula el IVA?",
        answer: "Para calcular el IVA a partir de un precio neto, multiplicás el precio por la alícuota dividida por 100. Por ejemplo, para un IVA del 21% sobre $1000, hacés $1000 × 0,21 = $210."
      },
      {
        question: "¿Cómo agregar IVA a un precio?",
        answer: "Para agregar IVA a un precio neto (sin IVA), multiplicás el precio por (1 + alícuota/100). Para el 21%, sería multiplicar tu precio neto por 1,21."
      },
      {
        question: "¿Cómo sacar el IVA de un precio final?",
        answer: "Para desglosar o quitar el IVA de un precio que ya lo tiene incluido, debés dividir ese precio final por (1 + alícuota/100). Para el 21%, dividís el precio final por 1,21 y obtendrás el precio neto."
      },
      {
        question: "¿Cuál es el IVA del 21%?",
        answer: "El 21% es la alícuota general del Impuesto al Valor Agregado en Argentina. Aplica a la mayoría de los bienes y servicios, salvo que la ley establezca una tasa diferencial (como el 10,5% o el 27%)."
      },
      {
        question: "¿Cómo calcular un precio sin IVA?",
        answer: "Usá la opción 'Quitar IVA' de nuestra calculadora. Ingresá el precio final que incluye impuestos, seleccioná la alícuota correspondiente y la herramienta te mostrará el precio neto (sin IVA)."
      },
      {
        question: "¿La calculadora sirve para Argentina?",
        answer: "Sí, esta calculadora está especialmente diseñada con las tasas vigentes en Argentina, incluyendo el 21% (general), 10,5% (reducida) y 27% (incrementada para ciertos servicios)."
      }
    ],
    related: ["calculadora-precios", "generador-presupuestos"]
  },
  {
    slug: "calculadora-rentabilidad",
    name: "Calculadora de rentabilidad",
    category: "calculadoras",
    tier: "free",
    description: "Calculá ganancias, margen y rentabilidad de tus productos o servicios.",
    icon: "TrendingUp",
    status: "live",
    featured: true,
    keywords: ["rentabilidad", "ganancia", "margen", "markup", "ventas", "calculadora de rentabilidad", "calcular rentabilidad", "calculadora de rentabilidad de un producto", "calcular margen de ganancia", "margen de rentabilidad", "calcular markup", "ganancia sobre ventas", "rentabilidad de un producto"],
    updatedAt: "2026-10-03T00:00:00.000Z",
    seo: {
      title: "Calculadora de rentabilidad: margen, markup y ganancia",
      description: "Calculá cuánto ganás con tus ventas. Conocé la diferencia entre margen y markup, y calculá el precio ideal de venta para asegurar tu rentabilidad.",
      intro: "Ingresá tus costos y el precio de venta para conocer tu rentabilidad real. También podés calcular el precio a cobrar según el margen de ganancia que desees."
    },
    faqs: [
      {
        question: "¿Cómo se calcula la rentabilidad de un producto?",
        answer: "La rentabilidad se calcula restando el costo total del producto al precio de venta para obtener la ganancia, y luego dividiendo esa ganancia por el precio de venta (multiplicado por 100) para obtener el porcentaje de margen."
      },
      {
        question: "¿Cuál es la diferencia entre margen y markup?",
        answer: "El margen es el porcentaje de tu precio de venta que representa tu ganancia. El markup es el porcentaje que le agregás a tu costo original para llegar a ese precio de venta."
      },
      {
        question: "¿Cómo calcular la ganancia de una venta?",
        answer: "Simplemente restá el costo del producto al precio al que lo vendiste. La diferencia en pesos es tu ganancia neta por esa venta."
      },
      {
        question: "¿Cómo calcular el precio de venta con un margen deseado?",
        answer: "Dividí tu costo por (1 - el margen deseado en decimal). Por ejemplo, si tu costo es $600 y querés un margen del 40% (0.4), el cálculo es: 600 / (1 - 0.4) = $1.000."
      },
      {
        question: "¿Un margen del 40% significa agregar 40% al costo?",
        answer: "No. Agregar un porcentaje al costo se llama markup. Si a un costo de $600 le agregás un 40%, vendés a $840 y ganás $240, lo que representa un margen real del 28,5% sobre la venta, no del 40%."
      },
      {
        question: "¿Cómo calcular la rentabilidad de varios productos?",
        answer: "En nuestra calculadora podés ingresar la cantidad de unidades vendidas. La herramienta multiplicará automáticamente los costos e ingresos para mostrarte la ganancia total de la venta."
      }
    ],
    related: ["calculadora-precios", "generador-presupuestos", "calculadora-iva"]
  },
  {
    slug: "generador-qr",
    name: "Generador de QR",
    category: "generadores",
    tier: "free",
    description: "Creá códigos QR para pagos, enlaces o texto.",
    icon: "QrCode",
    status: "live",
    featured: true,
    keywords: ["qr", "codigo", "scan", "enlace", "pago"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-1rm",
    name: "Calculadora de 1RM",
    category: "calculadoras",
    tier: "free",
    description: "Calculá tu 1RM estimado y consultá cargas orientativas según distintos porcentajes.",
    icon: "Dumbbell",
    status: "live",
    featured: true,
    keywords: ["calculadora 1rm", "calcular 1rm", "calcular repetición máxima", "1rm calculadora", "one rep max", "calculadora de rm", "calcular rm", "1rm fórmula", "fuerza", "gym", "gimnasio", "pesas"],
    updatedAt: "2026-10-03T00:00:00.000Z",
    seo: {
      title: "Calculadora de 1RM: Calculá tu repetición máxima",
      description: "Calculá gratis tu 1RM (One Rep Max) estimado. Obtené tu repetición máxima y una tabla de porcentajes de carga para tu entrenamiento de fuerza.",
      h1: "Calculadora de 1RM",
      intro: "Ingresá el peso que levantaste y las repeticiones que hiciste para estimar tu repetición máxima (1RM) y ver tu tabla de porcentajes."
    },
    faqs: [
      {
        question: "¿Qué es el 1RM?",
        answer: "El 1RM (One Rep Max) es el peso máximo que una persona puede levantar en una única repetición de un ejercicio determinado, con técnica correcta."
      },
      {
        question: "¿Cómo se calcula el 1RM?",
        answer: "Existen diferentes fórmulas matemáticas (como Epley, Brzycki o Lander) que estiman el peso máximo a partir de las repeticiones realizadas con un peso submáximo."
      },
      {
        question: "¿Qué fórmula utiliza la calculadora de 1RM?",
        answer: "Por defecto utilizamos la fórmula de Epley, que es una de las más precisas y utilizadas a nivel mundial. También podés elegir otras fórmulas como Brzycki o Lander desde las opciones."
      },
      {
        question: "¿El 1RM calculado es exacto?",
        answer: "No, es una estimación matemática. El rendimiento real puede variar según tu nivel de experiencia, fatiga, técnica y la naturaleza del ejercicio."
      },
      {
        question: "¿Para qué sirven los porcentajes del 1RM?",
        answer: "Conocer tus porcentajes te permite planificar entrenamientos. Por ejemplo, para ganar hipertrofia muscular a menudo se entrena entre el 65% y el 85% del 1RM, mientras que para fuerza máxima se usan cargas del 85% al 100%."
      },
      {
        question: "¿Tengo que probar mi 1RM real para utilizar la calculadora?",
        answer: "Justamente no. La ventaja de la calculadora es que podés estimar tu fuerza máxima usando un peso que podés levantar varias veces, evitando el riesgo de lesión de levantar una carga límite real."
      }
    ],
    related: ["calculadora-calorias"]
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
    tier: "free",
    description: "Calculá cuotas con o sin interés y conocé cuánto vas a pagar en total.",
    icon: "CreditCard",
    status: "live",
    featured: true,
    keywords: ["calculadora de cuotas", "calcular cuotas", "calculadora de cuotas con interés", "calculadora de cuotas sin interés", "calcular cuota mensual", "calcular cuotas de una compra", "calculadora de financiación", "calcular financiación", "cuotas", "interés", "préstamo"],
    updatedAt: "2026-10-03T00:00:00.000Z",
    seo: {
      title: "Calculadora de cuotas con o sin interés: Simulá tu financiación",
      description: "Calculadora de cuotas online gratis. Calculá el valor mensual, los intereses y el total a pagar de una compra financiada en cuotas fijas.",
      h1: "Calculadora de cuotas",
      intro: "Simulá tu financiación de forma rápida. Conocé cuánto vas a pagar por mes y el total de intereses de tu compra."
    },
    faqs: [
      {
        question: "¿Cómo se calcula una cuota?",
        answer: "Para cuotas sin interés, simplemente se divide el monto total por la cantidad de cuotas. Si hay interés, se aplica la fórmula del sistema de amortización francés sobre el capital, considerando la tasa periódica."
      },
      {
        question: "¿Cómo calcular cuotas con interés?",
        answer: "Debes ingresar el monto a financiar, la cantidad de cuotas, el tipo de tasa (mensual o anual) y su porcentaje. La calculadora aplicará el interés sobre saldos usando el sistema francés para darte una cuota fija mensual."
      },
      {
        question: "¿Cómo calcular cuotas sin interés?",
        answer: "Seleccioná la opción 'Sin interés' en la calculadora. Solo necesitás ingresar el monto total y en cuántos meses querés pagar; la herramienta dividirá el monto exacto."
      },
      {
        question: "¿Cómo saber cuánto voy a pagar en total?",
        answer: "El resultado te mostrará el 'Total pagado', que es la suma de todas tus cuotas. Si es con interés, este total será mayor al monto original."
      },
      {
        question: "¿Cómo calcular cuánto pago de intereses?",
        answer: "Nuestra herramienta desglosa automáticamente el 'Total de intereses', que surge de restarle el monto financiado inicial al total final que terminás pagando."
      },
      {
        question: "¿La calculadora sirve para una financiación mensual?",
        answer: "Sí, asume por defecto pagos mensuales. Si tenés una tasa anual, la convierte automáticamente a tasa mensual para realizar el cálculo de la cuota correcta."
      }
    ],
    related: ["calculadora-iva", "calculadora-rentabilidad", "calculadora-precios"]
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
    description: "Calculá tu metabolismo basal y estimá las calorías que necesitás por día.",
    icon: "Flame",
    status: "live",
    featured: true,
    keywords: ["calculadora de calorias", "calcular calorias", "calculadora de calorias diarias", "calcular calorias diarias", "cuantas calorias necesito", "calorias de mantenimiento", "calculadora de calorias para bajar de peso", "calculadora TDEE", "calcular metabolismo basal", "calculadora BMR", "nutricion", "BMR", "TDEE", "metabolismo"],
    updatedAt: "2026-10-04T00:00:00.000Z",
    seo: {
      title: "Calculadora de Calorías: Calculá tu TDEE y BMR",
      description: "Calculá cuántas calorías necesitás por día. Obtené tu metabolismo basal (BMR) y gasto energético (TDEE) para mantener, perder o ganar peso.",
      h1: "Calculadora de Calorías",
      intro: "Ingresá tus datos para conocer tu gasto energético diario (TDEE) y tu metabolismo basal (BMR)."
    },
    faqs: [
      {
        question: "¿Cómo calcular cuántas calorías necesito al día?",
        answer: "Para calcular tus necesidades calóricas diarias, primero se estima tu metabolismo basal (las calorías que tu cuerpo usa en reposo) y luego se multiplica por un factor correspondiente a tu nivel de actividad física diaria."
      },
      {
        question: "¿Qué es el metabolismo basal (BMR)?",
        answer: "El metabolismo basal o Tasa Metabólica Basal (BMR) es la cantidad mínima de energía (calorías) que tu cuerpo necesita para mantener las funciones vitales en reposo (respiración, circulación, temperatura, etc)."
      },
      {
        question: "¿Qué diferencia hay entre BMR y TDEE?",
        answer: "El BMR son las calorías que quemarías si estuvieras todo el día en cama sin moverte. El TDEE (Gasto Energético Diario Total) suma al BMR las calorías que quemás por tu estilo de vida, trabajo y ejercicio."
      },
      {
        question: "¿Cómo calcular las calorías de mantenimiento?",
        answer: "Las calorías de mantenimiento son exactamente tu TDEE. Si consumís esa cantidad de calorías diariamente, tu peso debería mantenerse estable en el tiempo."
      },
      {
        question: "¿Las calorías calculadas son exactas?",
        answer: "No, son estimaciones matemáticas (basadas en la fórmula de Mifflin-St Jeor). Tu consumo real puede variar según tu composición corporal (porcentaje de grasa vs músculo), genética y variaciones metabólicas."
      },
      {
        question: "¿La actividad física cambia el resultado?",
        answer: "Sí, significativamente. Mientras mayor sea tu actividad diaria y ejercicio, mayor será el factor multiplicador aplicado a tu metabolismo basal, requiriendo más calorías para mantener tu peso."
      },
      {
        question: "¿La calculadora sirve para bajar de peso?",
        answer: "Sí. Una vez que conocés tus calorías de mantenimiento, la calculadora te ofrece una estimación orientativa de cuántas calorías deberías consumir para lograr un déficit calórico (necesario para perder peso)."
      },
      {
        question: "¿Qué fórmula utiliza la calculadora?",
        answer: "Utilizamos la fórmula de Mifflin-St Jeor, que actualmente se considera una de las ecuaciones más precisas para estimar el metabolismo basal en la población general."
      }
    ],
    related: ["calculadora-1rm", "calculadora-rentabilidad"]
  },
  {
    slug: "link-resenas-google",
    name: "Link de reseñas de Google",
    category: "generadores",
    tier: "free",
    description: "Obtené el enlace directo para que tus clientes puedan dejar una reseña en Google.",
    icon: "Link",
    status: "live",
    featured: true,
    keywords: ["link de reseñas de Google", "link reseñas Google", "enlace reseñas Google", "link para reseñas de Google", "enlace para dejar reseña en Google", "link directo reseña Google", "crear link reseñas Google", "enlace para pedir reseñas Google"],
    updatedAt: NOW,
    seo: {
      title: "Generador de link de reseñas de Google: Directo a tu ficha",
      description: "Obtené el enlace directo para que tus clientes dejen una reseña en Google Maps. Fácil, rápido y listo para usar en QR, NFC o WhatsApp.",
      h1: "Link de reseñas de Google",
      intro: "Generá el enlace directo para que tus clientes califiquen tu negocio en Google en un solo paso."
    },
    faqs: [
      {
        question: "¿Cómo obtener el link de reseñas de Google?",
        answer: "Podés buscar tu negocio por nombre y localidad en nuestra herramienta, o pegar directamente el enlace de tu ficha de Google Maps. Te generaremos un link directo que abre la ventana para dejar la reseña."
      },
      {
        question: "¿Cómo crear un enlace para que mis clientes dejen una reseña?",
        answer: "Simplemente usá nuestro generador. Buscá tu negocio, seleccionalo en los resultados y copiá el enlace final. Es el link directo y oficial de Google."
      },
      {
        question: "¿Cómo obtener el enlace directo para una reseña de Google?",
        answer: "El enlace directo (reviewUrl) lo obtenemos consultando la API oficial de Google Places. Te ahorra tener que buscarlo manualmente en tu panel de Google Mi Negocio."
      },
      {
        question: "¿Puedo usar el link en un código QR?",
        answer: "Sí, es el uso más recomendado. Podés generar un código QR con este enlace y colocarlo en tu local, mesas, mostradores o folletos para que los clientes lo escaneen."
      },
      {
        question: "¿Puedo usar el link en una tarjeta NFC?",
        answer: "Totalmente. Si programás una etiqueta o tarjeta NFC con este enlace, tus clientes solo tendrán que acercar su celular para que se abra automáticamente la pantalla de reseñas de Google."
      },
      {
        question: "¿Cómo sé si elegí el negocio correcto?",
        answer: "Antes de copiar el enlace, te mostramos el nombre, la dirección exacta y un botón para abrir la ficha en Google Maps. Asegurate de que esos datos coincidan con tu negocio."
      }
    ],
    related: ["generador-qr"]
  }
]
