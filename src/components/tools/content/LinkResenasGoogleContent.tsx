export function LinkResenasGoogleContent() {
  return (
    <article className="prose prose-neutral prose-a:text-[#7C3AED] prose-a:no-underline hover:prose-a:underline max-w-[650px] w-full">
      <h2>¿Qué es el link directo de reseñas de Google?</h2>
      <p>
        El enlace directo de reseñas de Google (oficialmente conocido como <code>writeAReviewUri</code>) es una URL especial que, 
        al abrirse, no solo lleva al usuario a tu ficha de Google Maps, sino que <strong>abre automáticamente la ventana emergente 
        para dejar una calificación y escribir una reseña</strong>.
      </p>
      <p>
        Esto elimina los pasos intermedios que suelen frustrar a los clientes: tener que buscar tu negocio, deslizar hacia abajo 
        hasta la sección de reseñas y presionar &quot;Escribir una reseña&quot;. Con un link directo, la tasa de conversión (es decir, cuántos 
        clientes efectivamente te dejan la reseña) aumenta drásticamente.
      </p>

      <h2>¿Para qué sirve este generador?</h2>
      <p>
        Google no siempre hace fácil encontrar este enlace desde el panel de Google Mi Negocio. Nuestro generador utiliza la 
        <strong>API oficial de Google Places</strong> para buscar tu negocio y extraer exactamente la URL diseñada para reseñas, 
        asegurando que funcione en todos los dispositivos móviles y navegadores.
      </p>

      <h3>Opciones de uso:</h3>
      <ul>
        <li>
          <strong>Tarjetas NFC:</strong> Si tenés tarjetas inteligentes, podés programar el chip NFC con este enlace. Cuando 
          el cliente acerque su celular, la pantalla de reseñas se abrirá instantáneamente.
        </li>
        <li>
          <strong>Códigos QR:</strong> Podés utilizar este link para crear un código QR y pegarlo en tus mesas, mostrador de 
          caja, folletos o packaging.
        </li>
        <li>
          <strong>WhatsApp o Email:</strong> Es el link ideal para enviar en mensajes de seguimiento después de una compra 
          o servicio.
        </li>
      </ul>

      <h2>¿Cómo funciona la búsqueda?</h2>
      <p>
        Para obtener tu enlace de manera segura, te ofrecemos dos métodos integrados en la misma herramienta:
      </p>
      <ol>
        <li>
          <strong>Buscar negocio:</strong> Es el método recomendado. Ingresás el nombre de tu negocio y la ciudad, y te 
          mostramos los resultados exactos que arroja Google. Al seleccionar el correcto, obtenés el enlace verificado.
        </li>
        <li>
          <strong>Desde Google Maps:</strong> Si ya tenés el enlace general de Google Maps (ese que compartís desde la app), 
          podés pegarlo acá y nuestro sistema intentará convertirlo en un link directo de reseñas.
        </li>
      </ol>

      <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 my-8">
        <h3 className="mt-0 text-[#7C3AED]">Importante: Verificá tu negocio</h3>
        <p className="mb-0">
          Antes de imprimir códigos QR o programar tarjetas NFC, siempre <strong>abrí el enlace generado</strong> y 
          comprobá que te lleve a la ficha correcta. Si tenés varias sucursales o tu nombre es muy común, asegúrate de 
          estar seleccionando el establecimiento exacto.
        </p>
      </div>

      <h2>Diferencia entre abrir la ficha y dejar una reseña</h2>
      <p>
        Muchos negocios cometen el error de compartir el enlace estándar de su ficha de Maps. Cuando un cliente abre ese 
        enlace, ve fotos, horarios y preguntas, pero no la pantalla para calificar. El cliente tiene que saber buscar el 
        botón de &quot;Reseñas&quot; y luego &quot;Escribir reseña&quot;.
      </p>
      <p>
        El link directo generado por esta herramienta se encarga de todo ese proceso: el cliente solo tiene que elegir las 
        estrellas y escribir. A menor fricción, mayor cantidad de reseñas positivas para tu negocio.
      </p>
    </article>
  )
}
