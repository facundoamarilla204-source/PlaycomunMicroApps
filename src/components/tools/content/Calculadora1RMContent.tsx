import React from 'react';

export function Calculadora1RMContent() {
  return (
    <article className="prose prose-violet max-w-4xl mx-auto space-y-6 text-gray-700">
      <h2 className="text-2xl font-bold text-gray-900">¿Qué es el 1RM (One Rep Max)?</h2>
      <p>
        El <strong>1RM</strong>, o repetición máxima, es la mayor cantidad de peso que podés levantar para realizar una única repetición de un ejercicio determinado, utilizando la técnica correcta y abarcando el rango de movimiento completo. Es la medida estándar de la <strong>fuerza máxima</strong> en el entrenamiento con pesas.
      </p>
      
      <h3 className="text-xl font-semibold text-gray-800">¿Por qué usar una calculadora para estimar el 1RM?</h3>
      <p>
        Probar tu 1RM de manera real y directa implica levantar el peso máximo absoluto que tu cuerpo puede soportar. Esto genera una gran fatiga sobre el sistema nervioso central, requiere un calentamiento extenso, asistentes (spotters) experimentados y conlleva un <strong>riesgo significativo de lesión</strong> si la técnica falla.
      </p>
      <p>
        Por ello, utilizar una calculadora para <strong>estimar el 1RM</strong> a partir de un levantamiento submáximo (por ejemplo, el peso que podés levantar 5 o 8 veces) es mucho más seguro, menos fatigante y lo suficientemente preciso para programar tus entrenamientos.
      </p>

      <h3 className="text-xl font-semibold text-gray-800">Fórmulas utilizadas para calcular el 1RM</h3>
      <p>
        Existen varias fórmulas matemáticas avaladas por estudios científicos para predecir la repetición máxima basándose en la relación entre el peso y las repeticiones:
      </p>
      <ul>
        <li>
          <strong>Fórmula de Epley:</strong> Es la más recomendada y utilizada a nivel general, especialmente precisa cuando las repeticiones están entre 1 y 10. (<code>1RM = Peso × (1 + Repeticiones / 30)</code>)
        </li>
        <li>
          <strong>Fórmula de Brzycki:</strong> Muy popular y precisa para esfuerzos de bajas repeticiones, aunque matemáticamente pierde exactitud si las repeticiones superan las 10.
        </li>
        <li>
          <strong>Fórmula de Lander:</strong> Otra alternativa validada que ofrece resultados similares a las anteriores, utilizada frecuentemente en ciertos protocolos de entrenamiento.
        </li>
      </ul>

      <h3 className="text-xl font-semibold text-gray-800">¿Cómo usar los porcentajes del 1RM?</h3>
      <p>
        Conocer tu 1RM te permite organizar tu entrenamiento de forma estructurada mediante porcentajes de carga. Dependiendo de tus objetivos, deberías trabajar en distintos rangos:
      </p>
      <ul>
        <li><strong>Fuerza Máxima (85% - 100%):</strong> Cargas muy pesadas y bajas repeticiones (1 a 5). Busca adaptaciones neurales y ganancia de fuerza pura.</li>
        <li><strong>Hipertrofia Muscular (65% - 85%):</strong> Cargas moderadas y medias repeticiones (6 a 12). Rango óptimo para estimular el crecimiento muscular y volumen.</li>
        <li><strong>Resistencia Muscular (menos del 65%):</strong> Cargas livianas y altas repeticiones (más de 12). Mejora la resistencia muscular local y el acondicionamiento metabólico.</li>
      </ul>
      
      <h3 className="text-xl font-semibold text-gray-800">Importante: Es una estimación</h3>
      <p>
        Recordá que todas las fórmulas proporcionan un resultado <strong>estimado</strong>. La precisión de la estimación disminuye a medida que aumentan las repeticiones ingresadas (es decir, calcular tu 1RM basándote en una serie de 3 repeticiones será mucho más preciso que basarte en una serie de 15 repeticiones). Además, la proporción de fibras musculares de cada individuo y la eficiencia técnica en cada ejercicio específico pueden generar variaciones respecto al cálculo matemático.
      </p>
    </article>
  );
}
