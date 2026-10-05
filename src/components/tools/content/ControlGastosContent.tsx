import { JsonLd } from "@/components/seo/JsonLd"

export function ControlGastosContent() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cómo llevar un control de gastos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Para llevar un control efectivo, debés registrar todos tus gastos diarios en una herramienta como esta. Ingresá el monto, seleccioná la categoría y la fecha. La clave es la constancia."
        }
      },
      {
        "@type": "Question",
        name: "¿Cómo registrar mis gastos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simplemente escribí la descripción del gasto (por ejemplo 'Supermercado'), el monto, y hacé clic en guardar. Podés hacerlo desde tu celular en cualquier momento del día."
        }
      },
      {
        "@type": "Question",
        name: "¿Cómo organizar los gastos por categorías?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Agrupá tus gastos en categorías generales como Alimentación, Vivienda, Transporte y Ocio. Esto te va a permitir ver qué áreas consumen más dinero al final del mes."
        }
      },
      {
        "@type": "Question",
        name: "¿Cómo controlar mis gastos mensuales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Revisá el resumen al final de cada mes. Si gastaste más de lo esperado en una categoría, podés ajustar tu presupuesto para el mes siguiente."
        }
      },
      {
        "@type": "Question",
        name: "¿Puedo guardar mis gastos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí. Iniciar sesión en PlayComun te permite guardar todos tus registros de forma segura y permanente en tu cuenta, sin riesgo de perderlos."
        }
      },
      {
        "@type": "Question",
        name: "¿Puedo consultar mis gastos desde otro dispositivo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Totalmente. Al estar sincronizados con tu cuenta, podés empezar a cargar gastos en el celular y seguir viéndolos o editándolos en la computadora."
        }
      }
    ]
  }

  return (
    <article className="prose prose-slate lg:prose-lg max-w-none w-full pb-16 px-4">
      <JsonLd data={faqJsonLd} />

      <h2>¿Por qué llevar un control de gastos?</h2>
      <p>
        Saber exactamente a dónde va tu dinero es el primer paso para mejorar tus finanzas personales. 
        Mucha gente llega a fin de mes preguntándose por qué no le alcanza la plata, y la respuesta suele 
        estar en los "gastos hormiga" o compras impulsivas que no quedan registradas en ningún lado.
      </p>

      <h3>Beneficios de registrar gastos</h3>
      <ul>
        <li><strong>Conciencia financiera:</strong> Ver tus gastos agrupados por categoría (ej: Alimentación vs Entretenimiento) te muestra la realidad de tus consumos.</li>
        <li><strong>Identificar fugas de dinero:</strong> Permite encontrar esos gastos pequeños diarios que suman un montón al final del mes.</li>
        <li><strong>Mejores decisiones:</strong> Con datos reales, podés decidir dónde recortar y empezar a ahorrar.</li>
      </ul>

      <h2>¿Cómo utilizar esta aplicación para controlar gastos?</h2>
      <p>
        Esta herramienta está pensada para ser rápida y fácil de usar, especialmente desde el celular, 
        para que puedas registrar un gasto en el mismo momento que lo hacés.
      </p>

      <ol>
        <li><strong>Ingresá el monto y descripción:</strong> Algo claro como "Almuerzo" o "Nafta".</li>
        <li><strong>Elegí la categoría:</strong> Es fundamental para los reportes y filtros posteriores.</li>
        <li><strong>Iniciá sesión para guardar:</strong> Tus gastos quedarán vinculados a tu cuenta y podrás acceder a ellos desde cualquier dispositivo, en cualquier momento.</li>
      </ol>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 my-8">
        <h3 className="mt-0">Preguntas Frecuentes</h3>
        
        <div className="space-y-6">
          {faqJsonLd.mainEntity.map((faq, index) => (
            <div key={index}>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.name}</h4>
              <p className="text-slate-600 m-0">{faq.acceptedAnswer.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-sm text-slate-500 mt-12">
        <em>Última actualización: 5 de Octubre de 2026. Esta herramienta se actualiza constantemente basándose en el feedback de los usuarios de PlayComun.</em>
      </p>
    </article>
  )
}
