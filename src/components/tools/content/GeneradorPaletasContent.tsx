import Link from "next/link"
import { Palette, Eye, Image as ImageIcon, Sliders, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react"

export function GeneradorPaletasContent() {
  const faqs = [
    {
      q: "¿Cómo funciona la generación de paletas armónicas?",
      a: "El algoritmo se basa en el círculo cromático y el modelo de color HSL. A partir de un tono base seleccionado, calcula relaciones geométricas precisas (180° para complementarios, 120° para triádicos, o saltos adyacentes para análogos) asegurando que las combinaciones resulten agradables y equilibradas.",
    },
    {
      q: "¿Las fotos que cargo para extraer colores se suben a algún servidor?",
      a: "No. El análisis se ejecuta 100% en tu navegador mediante Canvas y la API ImageData. Las imágenes no se transmiten por internet, no se almacenan en servidores remotos y se eliminan de la memoria de tu dispositivo en cuanto cerrás o limpiás la pestaña.",
    },
    {
      q: "¿Qué significa que una combinación cumpla con WCAG 2.2 nivel AA?",
      a: "Significa que la diferencia de luminancia relativa entre el texto y el fondo es de al menos 4.5 a 1 para texto estándar o 3 a 1 para texto grande (18pt o 14pt en negrita). Esto garantiza que personas con baja visión, daltonismo o usuarios en pantallas con reflejos puedan leer el contenido con comodidad.",
    },
    {
      q: "¿Cómo se transfieren los colores extraídos de una imagen al editor?",
      a: "Una vez que cargás la imagen y seleccionás la cantidad de muestras deseadas, hacés clic en 'Editar esta paleta'. Los códigos calculados se trasladan de forma directa al editor principal, donde podés fijar colores con el candado, probar contraste o descargarlos en CSS, JSON o PNG.",
    },
    {
      q: "¿En qué formatos puedo exportar los colores?",
      a: "Disponés de variables CSS estándar (:root), configuración lista para Tailwind CSS (v4 @theme y v3 extend.colors), archivo estructurado JSON para desarrolladores y una imagen gráfica PNG de 1200x630 píxeles con muestras y códigos HEX.",
    },
    {
      q: "¿Tiene algún costo o límite de uso?",
      a: "Ninguno. La herramienta es totalmente gratuita, sin registro previo y sin restricciones de cantidad de paletas generadas o imágenes analizadas.",
    },
  ]

  return (
    <article className="max-w-4xl mx-auto space-y-12 text-slate-700 leading-relaxed pt-8 border-t border-slate-200">
      {/* Sección 1: Introducción práctica */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Palette className="w-6 h-6 text-purple-700 flex-shrink-0" aria-hidden="true" />
          <span>El papel de una paleta cromática en diseño y desarrollo web</span>
        </h2>
        <p>
          Una paleta de colores no es solo una elección decorativa: define la personalidad de una marca, jerarquiza la información visual en una pantalla y guía la atención del usuario hacia las acciones prioritarias. En interfaces digitales, una combinación armónica y contrastada reduce la fatiga cognitiva y transmite profesionalismo desde el primer segundo.
        </p>
        <p>
          El <strong>Generador de paletas de colores de PlayComun Online</strong> te permite crear combinaciones basadas en reglas clásicas de colorimetría o descubrir los tonos dominantes de cualquier fotografía, con herramientas inmediatas para comprobar accesibilidad y exportar el código a tu proyecto.
        </p>
      </section>

      {/* Sección 2: Reglas de armonía cromática */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-700 flex-shrink-0" aria-hidden="true" />
          <span>Reglas de armonía cromática explicadas</span>
        </h2>
        <p>
          Los algoritmos de la herramienta calculan relaciones angulares sobre el espacio cromático para asegurar coherencia visual:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <h3 className="font-bold text-slate-900">1. Colores Complementarios</h3>
            <p className="text-slate-600">
              Utiliza colores situados en extremos opuestos del círculo cromático (a 180°). Produce un contraste dinámico ideal para botones de acción principal (CTA) sobre fondos neutros.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <h3 className="font-bold text-slate-900">2. Colores Análogos</h3>
            <p className="text-slate-600">
              Selecciona matices vecinos en el círculo cromático. Es una de las combinaciones más naturales y serenas para fondos, degradados suaves y paneles secundarios.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <h3 className="font-bold text-slate-900">3. Armonía Triádica</h3>
            <p className="text-slate-600">
              Distribuye 3 colores equidistantes a 120 grados. Mantiene alta vitalidad visual preservando el equilibrio entre el tono dominante y los secundarios.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <h3 className="font-bold text-slate-900">4. Esquema Monocromático</h3>
            <p className="text-slate-600">
              Explora variaciones graduadas de luminosidad y saturación sobre un mismo matiz. Resulta en interfaces sobrias, elegantes y con jerarquía predecible.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <h3 className="font-bold text-slate-900">5. Complementario Dividido</h3>
            <p className="text-slate-600">
              Toma el color base y los dos tonos contiguos a su complementario directo (a 150° y 210°). Brinda contraste vivo con menor tensión visual que el complementario puro.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <h3 className="font-bold text-slate-900">6. Esquema Tetrádico</h3>
            <p className="text-slate-600">
              Forma dos pares de complementarios organizados en rectángulo. Ofrece amplia riqueza tonal, recomendando utilizar un tono dominante y los restantes para detalles específicos.
            </p>
          </div>
        </div>
      </section>

      {/* Sección 3: Extracción desde imágenes */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-700 flex-shrink-0" aria-hidden="true" />
          <span>Extracción de colores dominantes a partir de imágenes</span>
        </h2>
        <p>
          Cuando contás con una fotografía de producto, una ilustración o un logotipo y necesitás extraer una paleta que combine a la perfección, la pestaña <strong>Extraer de una imagen</strong> realiza el muestreo de píxeles mediante cuantización cromática (Median Cut).
        </p>
        <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-sm space-y-2 text-purple-950">
          <div className="flex items-center gap-2 font-bold text-purple-900">
            <ShieldCheck className="w-4 h-4 text-purple-700" aria-hidden="true" />
            <span>Manejo de transparencias y privacidad</span>
          </div>
          <p className="text-xs sm:text-sm">
            Los píxeles con canal alfa transparente en imágenes PNG se excluyen del cómputo para no generar falsos bloques negros en el resultado. Todo el proceso es cliente-servidor cero: la imagen nunca abandona tu dispositivo.
          </p>
        </div>
      </section>

      {/* Sección 4: Accesibilidad WCAG 2.2 */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-700 flex-shrink-0" aria-hidden="true" />
          <span>Accesibilidad y ratio de contraste WCAG 2.2</span>
        </h2>
        <p>
          El estándar internacional de las Pautas de Accesibilidad para el Contenido Web (WCAG 2.2) define umbrales específicos de luminancia relativa para garantizar la lectura de textos e íconos:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
          <li><strong>Nivel AA para texto normal (menor a 18pt):</strong> Requiere un contraste mínimo de <strong>4.5 a 1</strong>.</li>
          <li><strong>Nivel AA para texto grande (18pt o 14pt en negrita):</strong> Requiere al menos <strong>3 a 1</strong>.</li>
          <li><strong>Nivel AAA (máxima legibilidad):</strong> Exige <strong>7 a 1</strong> para texto normal y <strong>4.5 a 1</strong> para texto grande.</li>
          <li><strong>Componentes gráficos e interfaces:</strong> Exige un ratio de al menos <strong>3 a 1</strong> respecto de los colores adyacentes.</li>
        </ul>
        <p className="text-sm">
          El evaluador integrado te permite testear cualquier combinación de tu paleta con un clic y obtener sugerencias de ajuste en caso de contraste insuficiente.
        </p>
      </section>

      {/* Sección 5: Preguntas frecuentes */}
      <section className="space-y-6 pt-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Preguntas frecuentes sobre el generador de paletas
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sección 6: Herramientas relacionadas */}
      <section className="pt-6 border-t border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          Otras herramientas gratuitas para diseño y archivos en PlayComun
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Link
            href="/herramientas/compresor-imagenes"
            className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-colors flex flex-col justify-between group"
          >
            <div>
              <p className="font-bold text-slate-900 text-sm group-hover:text-purple-700">
                Compresor de imágenes
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Optimizá imágenes JPG, PNG y WebP reduciendo peso sin perder nitidez.
              </p>
            </div>
          </Link>

          <Link
            href="/herramientas/generador-qr"
            className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-colors flex flex-col justify-between group"
          >
            <div>
              <p className="font-bold text-slate-900 text-sm group-hover:text-purple-700">
                Generador de códigos QR
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Generá códigos QR estáticos y dinámicos para enlaces, Wi-Fi y redes.
              </p>
            </div>
          </Link>

          <Link
            href="/herramientas/convertidor-archivos"
            className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-colors flex flex-col justify-between group"
          >
            <div>
              <p className="font-bold text-slate-900 text-sm group-hover:text-purple-700">
                Convertidor de archivos
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Transformá formatos de oficina PDF, Word, Excel e imágenes online.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </article>
  )
}
