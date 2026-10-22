import { Link as LinkIcon, QrCode, Smartphone, Printer, Settings } from "lucide-react"

export function GeneradorQRContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
      <div className="prose prose-purple max-w-none">
        <h2>¿Qué es un Código QR Dinámico?</h2>
        <p>
          Un <strong>código QR dinámico</strong> es un tipo especial de QR que no contiene directamente la información final (como una URL o texto), sino que incluye un enlace intermedio corto. Esto permite que, a diferencia de los QR estáticos, <strong>puedas cambiar el destino cuantas veces quieras</strong> sin necesidad de volver a generar o imprimir el código físico.
        </p>

        <div className="grid md:grid-cols-2 gap-6 my-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold mt-0 mb-2">QR Estático</h3>
            <ul className="text-sm text-gray-600 space-y-2 mt-0 mb-0">
              <li>• Contiene el enlace final</li>
              <li>• Gratis para siempre</li>
              <li>• Si la URL cambia, el QR deja de servir</li>
              <li>• Ideal para usos únicos</li>
            </ul>
          </div>
          <div className="bg-neutral-50 p-6 rounded-2xl shadow-sm border border-neutral-100">
            <div className="w-10 h-10 bg-neutral-100 text-neutral-600 rounded-xl flex items-center justify-center mb-4">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mt-0 mb-2">QR Dinámico (Pro)</h3>
            <ul className="text-sm text-neutral-800 space-y-2 mt-0 mb-0">
              <li>• Podés cambiar el destino cuando quieras</li>
              <li>• Generás y activás después</li>
              <li>• Imprimís una sola vez</li>
              <li>• Ideal para negocios y vidrieras</li>
            </ul>
          </div>
        </div>

        <h2>¿Cómo funciona el Generador QR de PlayComun?</h2>
        <p>
          Si sos usuario de <strong>PlayComun Pro</strong>, el flujo está pensado para tu comodidad y la de tu negocio:
        </p>

        <div className="space-y-6 my-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h4 className="text-lg font-semibold mt-0 mb-1">Generás y descargás</h4>
              <p className="text-gray-600 m-0">Seleccioná cuántos códigos QR necesitás. El sistema generará un PDF listo para imprimir en hoja A4, con cada QR de exactamente 5x5 cm.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h4 className="text-lg font-semibold mt-0 mb-1">Imprimís y pegás</h4>
              <p className="text-gray-600 m-0">Imprimí el PDF, recortá los QR y pegalos físicamente donde los necesites (mesas, vidrieras, mostradores).</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h4 className="text-lg font-semibold mt-0 mb-1">Escaneás para activar</h4>
              <p className="text-gray-600 m-0">Con tu celular, escaneá el QR físico. El sistema detectará que no está configurado y te permitirá asignarle una URL (por ejemplo, tu menú o tu link de reseñas de Google).</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <div>
              <h4 className="text-lg font-semibold mt-0 mb-1">Actualizás cuando quieras</h4>
              <p className="text-gray-600 m-0">¿Cambió tu carta? ¿Querés que ahora apunte a tu WhatsApp? Entrá al panel y cambiá el destino. El QR físico sigue siendo el mismo.</p>
            </div>
          </div>
        </div>

        <h2>Preguntas Frecuentes</h2>
        
        <h4>¿Cuántos QR puedo generar con PlayComun Pro?</h4>
        <p>No hay un límite comercial para la cantidad de QR dinámicos que podés generar. Podés generar todos los que tu negocio necesite.</p>

        <h4>¿Qué tamaño tienen los QR del PDF?</h4>
        <p>El PDF está preparado para imprimirse en tamaño A4 (sin escalar) y contiene los códigos QR con un tamaño exacto de 5 × 5 cm, el tamaño ideal para ser escaneados cómodamente manteniendo su legibilidad.</p>

        <h4>¿Cómo activo un QR que todavía no está configurado?</h4>
        <p>Simplemente escanealo con la cámara de tu celular. Se abrirá una pantalla de activación. Si tenés la sesión iniciada, vas a poder asignarle el destino en ese mismo instante.</p>
      </div>
    </div>
  )
}


