# PlaycomunMicroApps — Contexto del proyecto

Documento de contexto para el agente de desarrollo (Antigravity). Leelo completo antes de escribir código y volvé a consultarlo cuando tengas dudas. Guardalo en el repositorio como `docs/contexto-proyecto.md`.

Leyenda de estado:
- **[Decidido]** lo confirmó Facundo. Se implementa tal cual.
- **[Propuesto]** recomendado, pero falta su confirmación. Se puede implementar como valor provisorio, dejándolo fácil de cambiar y avisando en el resumen final.
- **[Pendiente]** no está definido. No lo decidas por tu cuenta: usá un valor provisorio configurable y avisá.

---

## 0. Instrucciones para el agente

1. **Idioma:** textos de la interfaz en español rioplatense, con voseo ("Calculá", "Generá", "Probá"). Código, nombres de variables, archivos y commits en inglés.
2. **No inventes decisiones de producto.** Si algo figura como Pendiente, usá un valor provisorio configurable y mencionalo al terminar.
3. **Trabajá por pasos.** Cada tarea que te pasen tiene un alcance. No implementes cosas fuera de ese alcance (por ejemplo, cobros o autenticación) hasta que se pidan.
4. **Nada hardcodeado que pueda cambiar:** el nombre del hub, el año, los links externos y los textos repetidos van en configuración o en archivos de datos.
5. **Sin Google Fonts.** Usar tipografías del sistema (ver sección 5).
6. **Sin emojis en la interfaz.** Íconos con una librería de íconos de trazo (ver sección 4).
7. **Accesibilidad básica siempre:** HTML semántico, contraste AA, foco visible, navegación por teclado, textos alternativos.
8. **Al terminar cada tarea**, entregá un resumen corto: qué hiciste, qué quedó pendiente, cómo probarlo y qué decisiones provisorias tomaste.

---

## 1. Qué es el proyecto

**PlaycomunMicroApps** es un hub de **microapps**: herramientas web pequeñas, enfocadas en una sola tarea y que se usan en segundos (calculadoras, generadores, utilidades). Todas viven juntas en un único sitio, orientadas al público de Argentina (y LATAM más adelante).

Lo desarrolla Facundo, desarrollador y diseñador independiente, bajo su estudio **PlayComun** (`playcomun.com`), que hace aplicaciones web y SaaS.

**Nombre público del hub [Pendiente]:** no se va a llamar "PlayComun Online". Candidatos: "PlayComun" o "PlayComun Herramientas". Valor provisorio: **"PlayComun Herramientas"**, definido en un único archivo de configuración (`src/config/site.ts`).

**Nombre del proyecto/repositorio [Decidido]:** PlaycomunMicroApps (repo sugerido: `playcomun-microapps`).

---

## 2. Objetivos y modelo de negocio

**Objetivos [Decidido]**
- Desarrollar varias microapps y monetizarlas.
- Mezclar modelos: algunas 100% gratuitas con publicidad, otras freemium o premium. No depender solo de la publicidad.
- Que el hub sirva también como vidriera: traer tráfico que pueda terminar contratando servicios de PlayComun.
- Ofrecer **cuentas gratuitas** donde el usuario guarda sus herramientas favoritas.

**Dos tipos de herramienta [Decidido en concepto]**

| Tipo | Para qué | Monetización | Ejemplos |
|---|---|---|---|
| De tráfico | Atraer gente desde Google | Publicidad, 100% gratis | Aguinaldo, IVA, QR, links de WhatsApp, divisor de gastos |
| De trabajo | La usa gente que trabaja con ella seguido | Freemium: gratis lo básico, pago lo avanzado | Presupuestos, recibos, costos, stock, lista de precios |

**Cobros [Decidido en concepto, precios pendientes]:** hay dos formas de pagar: **una herramienta puntual** o **un plan general** con todas. El precio se define después, y también si la compra puntual es pago único o suscripción. Detalle en la sección 9.

**Expectativa realista:** cada microapp genera poco por sí sola y el SEO tarda entre 3 y 6 meses en dar resultados. La estrategia es lanzar varias, medir cuáles tienen uso y reforzar solo esas.

---

## 3. Dominios

Facundo tiene `playcomun.com`, `playcomun.store` y `playcomun.online`. No tiene `.com.ar` ni `.net`.

| Dominio | Uso | Estado |
|---|---|---|
| `playcomun.online` | **Hub de microapps (este proyecto).** | [Decidido] |
| `playcomun.com` | Portfolio de servicios, sin publicidad. Tendrá una sección "Herramientas" que enlaza al hub. | [Decidido] |
| `playcomun.store` | Redirigir a `playcomun.com`. | [Propuesto] |

El hub va separado del portfolio para que la publicidad de las herramientas no mezcle imagen con el sitio profesional que ve un cliente potencial.

---

## 4. Stack y arquitectura

**Stack [Decidido, es el habitual de Facundo]:** Next.js + Supabase + Vercel.

**Detalles técnicos [Propuesto]**
- Next.js con App Router y TypeScript.
- Tailwind CSS para estilos.
- `lucide-react` para íconos.
- ESLint y Prettier.
- Supabase se incorpora cuando llegue la autenticación (no antes).
- Mercado Pago para cobros, más adelante.

**Arquitectura [Decidido]:** **una sola aplicación** con **una ruta por herramienta** (por ejemplo `/calculadora-aguinaldo`), no un subdominio por herramienta. Todo comparte layout, SEO, analytics y espacio para anuncios. Un solo deploy. Si una microapp crece y se vuelve producto independiente, se evalúa un dominio propio con redirección 301.

**Estructura de carpetas sugerida**
```
src/
  app/
    layout.tsx
    page.tsx                  # home
    herramientas/page.tsx     # listado completo con filtros
    [slug]/page.tsx           # página de cada herramienta
    planes/ ingresar/ registro/ favoritas/ contacto/ privacidad/ terminos/   # placeholders al inicio
  components/
    layout/                   # SiteHeader, SiteFooter, MobileMenu, CommandSearch
    home/                     # Hero, CategoryTabs, ToolGrid, TrustStrip, ServicesBanner
    tools/                    # ToolCard, FavoriteButton, TierBadge
    ui/                       # Button, Badge, Container, etc.
  data/
    categories.ts
    tools.ts
  config/
    site.ts                   # nombre del hub, links externos, redes sociales
  lib/
public/images/
docs/
```

**Rutas reservadas:** `/herramientas`, `/planes`, `/ingresar`, `/registro`, `/favoritas`, `/cuenta`, `/contacto`, `/privacidad`, `/terminos`. Ninguna herramienta puede usar uno de estos slugs.

**Modelo de datos de herramientas (fuente única de verdad)**
```ts
type Tool = {
  slug: string;                 // ruta: /{slug}
  name: string;
  description: string;          // una o dos líneas
  category: 'calculadoras' | 'generadores' | 'utilidades';
  icon: string;                 // nombre del ícono de lucide
  tier: 'free' | 'pro';         // etiqueta Gratis o Pro
  status: 'live' | 'soon';      // publicada o en construcción
  featured: boolean;            // aparece en "Herramientas destacadas"
  keywords: string[];           // para el buscador
};
```
Sumar una microapp nueva debe requerir solo agregar un ítem a `tools.ts` y crear su página. Los **contadores de categoría se calculan** desde esta lista, nunca se escriben a mano.

---

## 5. Identidad visual

Diseño definido por Facundo (hay una imagen de referencia del home, ver sección 6). **Tema claro.**

**Marca**
- Color de acento: **violeta `#7C3AED`**.
- Mascota: **nutria violeta** con una notebook con el logo "P". Aparece en el hero. Facundo provee la ilustración (`public/images/otter-hero.png`). Mientras no esté, usar un placeholder visible.
- Voz: rioplatense, cercana, en primera persona.

**Tokens aproximados (tomados de la imagen de referencia, ajustar a ojo)**
- Violeta principal `#7C3AED`, hover `#6D28D9`.
- Lavanda de fondo suave (hero, franja de confianza) `#F5F3FF`.
- Texto principal `#111827`, secundario `#4B5563`, terciario `#6B7280`.
- Bordes `#E5E7EB`.
- Etiqueta **Gratis:** fondo verde suave `#DCFCE7`, texto `#166534`.
- Etiqueta **Pro:** fondo lavanda `#EDE9FE`, texto `#6D28D9`.
- Tarjetas blancas, borde fino, esquinas redondeadas de unos 12px, sin sombras decorativas.
- Los íconos de las tarjetas van dentro de un cuadrado lavanda con esquinas redondeadas.

**Tipografía:** stack de fuentes del sistema (por ejemplo `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). En los templates de la marca se evitó Google Fonts porque estaba bloqueado en el hosting de Facundo. Confirmar si aplica en Vercel [Pendiente]; hasta entonces, fuentes del sistema. La anotación manuscrita del hero va dentro de la imagen de la ilustración; si no, usar un fallback cursivo del sistema.

**Estilo general:** plano, limpio, mucho espacio en blanco, sin degradados ni efectos decorativos.

---

## 6. Home

El home es un **directorio**, no una landing de ventas: la gente tiene que encontrar la herramienta en segundos. El tráfico de Google va a llegar directo a las páginas de cada herramienta, así que el home funciona como índice y punto de descubrimiento.

**Es una maqueta de estructura** [Decidido]: se va a ir puliendo. La imagen de referencia (la tiene Facundo, se adjunta al prompt) es la guía visual. Si algo de este documento difiere de la imagen, preguntá o priorizá la imagen en lo visual y este documento en lo funcional.

**Estructura, de arriba hacia abajo [Decidido]**
1. **Header / nav** (ver sección 7).
2. **Hero** sobre banda lavanda, dos columnas:
   - Izquierda: etiqueta pequeña "HERRAMIENTAS ONLINE"; título "Herramientas online para tu **negocio**" (la palabra "negocio" en violeta); subtítulo "Calculá, generá y resolvé en segundos. Las básicas son gratis y sin registro."; buscador con placeholder "Buscar una herramienta…" y botón violeta "Buscar".
   - Derecha: ilustración de la nutria y la anotación manuscrita "Herramientas que te hacen la vida más fácil".
3. **Menú de categorías** (pastillas) con contador: **Todas, Calculadoras, Generadores, Utilidades.** La activa va rellena en violeta.
4. **"Herramientas destacadas"** con link "Ver todas →". Grilla de **4 columnas × 3 filas (12 tarjetas)**. Cada tarjeta: ícono en cuadrado lavanda, etiqueta Gratis o Pro arriba a la derecha, nombre, descripción de dos líneas y una flecha abajo a la izquierda. Con un botón de favorito.
5. **Franja de confianza** sobre fondo lavanda, tres bloques con ícono, título y descripción:
   - "Gratis y sin registro" / "Usá las herramientas que necesitás, cuando las necesitás."
   - "No guardamos tus datos" / "Tu información siempre es tuya." **Ojo:** con cuentas, este mensaje debe reformularse (ver sección 9, privacidad). Dejarlo provisorio y configurable.
   - "Pensadas para Argentina" / "Con valores, impuestos y formatos locales."
6. **Bloque de servicios**, discreto: etiqueta "¿NECESITÁS ALGO A MEDIDA?"; título "También desarrollamos aplicaciones web y SaaS"; texto "Si tenés una idea o necesitás una solución personalizada, podemos ayudarte."; botón violeta "Ver el portfolio" hacia `playcomun.com`. A la derecha, ilustración simple de una ventana de código y la anotación "Tu idea, nuestra tecnología".
7. **Footer:** logo, links Contacto, Privacidad y Términos, "Ver PlayComun.com" (externo), íconos de redes (LinkedIn, Instagram, YouTube; solo se muestran los que tengan URL en la configuración) y derechos reservados con el **año actual calculado**, nunca escrito a mano.

**Comportamiento [Decidido salvo indicación]**
- Al elegir una categoría, la grilla muestra las herramientas de esa categoría. Con "Todas" muestra las destacadas.
- Los contadores salen de `tools.ts`.
- Si no hay resultados: "No encontramos esa herramienta. Probá con otra palabra."
- **Favoritos [Propuesto]:** botón con corazón en cada tarjeta. Sin cuenta, se guardan en el navegador (localStorage). Cuando haya favoritos, aparece una fila "Mis favoritas" sobre "Herramientas destacadas". La estructura debe permitir migrar a Supabase al implementar cuentas.
- Responsive: 4 columnas en escritorio, 2 en tablet, 1 en celular.

**Publicidad:** pocos anuncios o ninguno en el home. La publicidad va en las páginas de cada herramienta.

---

## 7. Nav [Propuesto, Facundo quiere mejorarlo]

El nav es el mismo en todas las páginas, incluidas las de cada herramienta.

- **Izquierda:** logo con el nombre del hub.
- **Centro:**
  - **Herramientas** con menú desplegable por categoría (Calculadoras, Generadores, Utilidades, cada una con su ícono y cantidad) y "Ver todas las herramientas".
  - **Favoritas**, visible solo con sesión iniciada (mientras no haya autenticación, oculto).
  - **Planes**.
- **Derecha:**
  - Ícono de **búsqueda** que abre un buscador rápido (atajo `Ctrl+K` o `⌘+K`), con resultados filtrables, navegación con flechas, Enter para abrir y Escape para cerrar.
  - **Ingresar** (botón secundario) y **Crear cuenta gratis** (botón violeta principal). Con sesión iniciada se reemplazan por un avatar con menú (Mis favoritas, Mi plan, Cerrar sesión).
  - **"Servicios"** como link de texto discreto hacia `playcomun.com`. "Hacé tu proyecto" **no** es el botón principal del header, porque competiría con "Crear cuenta gratis".
- **Celular:** menú hamburguesa con las mismas opciones; las categorías en acordeón; la búsqueda siempre a mano.

---

## 8. Página de cada herramienta (futuro)

Cada microapp tiene su ruta, pensada para posicionar en Google:
- URL descriptiva y directa (`/calculadora-aguinaldo`).
- La herramienta usable arriba, sin vueltas, con botón de favorito.
- Título, meta descripción y encabezados pensados para lo que la gente busca.
- Debajo, un bloque de texto con explicación breve y preguntas frecuentes (ayuda al SEO).
- Anuncios en esta página (no en el home) para las herramientas gratuitas.
- Enlaces cruzados a herramientas relacionadas.
- En las que dependen de valores que cambian (monotributo, ICL, cotizaciones), mostrar la fecha de última actualización.
- Si la herramienta tiene funciones Pro, mostrar con claridad qué se desbloquea y cómo.

---

## 9. Cuentas, favoritos y cobros (futuro, no implementar hasta que se pida)

**Cuenta [Decidido]:** registro **gratuito** con login. Función inicial: guardar herramientas favoritas.
- Autenticación con Supabase Auth, email y Google [Propuesto].
- **El uso de las herramientas básicas no debería exigir cuenta** [Propuesto, falta confirmar]: la cuenta se ofrece por el beneficio de guardar, no se impone.
- Favoritos sin cuenta: se guardan en el navegador y, al crear la cuenta, se migran solos.

**Cobros [Decidido en concepto]:**
1. Una herramienta puntual.
2. Un plan general con todas las herramientas.

**Modelo de datos de accesos [Propuesto]:** una tabla de accesos (usuario, alcance, estado, vencimiento, origen del pago), donde el alcance es el `slug` de una herramienta o `all`. Así conviven ambos modos de cobro: la lógica de cada herramienta solo pregunta si el usuario tiene acceso Pro a esa herramienta. Un plan general es un acceso con alcance `all`.

**Qué se vuelve premium [Propuesto]:** gratis lo que se usa una vez; pago lo que se guarda, repite o se personaliza.
- Guardar y tener historial (presupuestos, clientes, productos).
- Personalizar PDFs con logo, colores y datos propios.
- Quitar la marca de agua de PlayComun.
- Límites de uso en el plan gratis.
- Exportar a Excel o en lotes.

Las calculadoras de un solo uso y los conversores van gratis (son las que traen tráfico). La etiqueta Pro va en las que guardan datos o generan documentos.

**Medio de cobro [Propuesto]:** Mercado Pago. Los webhooks activan o desactivan los accesos en Supabase. Con la inflación, cobrar en pesos con revisión periódica, o fijar en dólares y cobrar el equivalente. Antes de cobrar, Facundo revisará la facturación con un contador.

**Orden de ejecución [Propuesto]:** primero cuentas gratuitas y favoritos con todas las herramientas gratis; después activar cobros solo en las de trabajo que ya tengan uso real. Mientras tanto, la etiqueta Pro puede mostrarse como "Próximamente".

**Privacidad y datos [Propuesto, importante]**
- Con cuentas y datos guardados, "No guardamos tus datos" deja de ser cierto. Reformularlo, por ejemplo: "Las herramientas básicas no guardan lo que ingresás" o "Tus datos son tuyos".
- Hacen falta política de privacidad y términos antes de abrir registro y publicidad.
- Aviso de cookies si se usan anuncios y analytics.
- En Argentina, la ley de protección de datos personales (25.326) puede exigir registrar la base de datos de usuarios ante la AAIP; consultarlo con un profesional.
- Guardar solo lo necesario.

---

## 10. Catálogo de ideas

Estimaciones propias, conviene validarlas con Google Trends o mirando la competencia.

| Microapp | Dificultad | Tráfico | Mantenimiento | Conecta con servicios |
|---|---|---|---|---|
| Generador de presupuestos (PDF) | Media | Medio | Bajo | Sí |
| Calculadora de costos y precio de venta | Baja | Medio | Bajo | Sí |
| Calculadora de ganancias / punto de equilibrio | Baja | Medio | Bajo | Sí |
| Calculadora de precio por hora (freelancers) | Baja | Medio-bajo | Bajo | Sí |
| Generador de recibos y remitos | Media | Medio-alto | Bajo | Sí |
| Calculadora de aguinaldo | Baja | Alto (picos jun/dic) | Bajo | No |
| Calculadora de indemnización | Media | Alto | Medio | No |
| Actualizador de alquiler (ICL, IPC) | Media | Alto | Alto | No |
| Calculadora de monotributo | Media | Alto | Alto | No |
| Conversor de cotizaciones (blue, MEP) | Media | Muy alto | Alto (necesita API) | No |
| Generador de QR | Baja | Alto, muy competido | Nulo | Poco |
| Generador de links de WhatsApp | Baja | Medio | Nulo | Poco |
| Divisor de gastos | Media | Medio | Bajo | No |
| Lista de precios con aumento porcentual | Baja | Medio-bajo | Bajo | Sí |

Ideas que Facundo mencionó o incluyó en su diseño: calculadoras de costos, de ganancias, de precios, de IVA, de rentabilidad, de cuotas, de 1RM y de calorías; generador de presupuestos; conversor de unidades; control de gastos y control de stock.

**Primeras 4 sugeridas [Propuesto]:** calculadora de costos y precio de venta, generador de presupuestos, calculadora de aguinaldo (con tráfico estacional fuerte antes de diciembre) y generador de QR (rápida y sin mantenimiento). Las de tráfico alto con mantenimiento alto (monotributo, ICL, cotizaciones) quedan para una segunda tanda, porque pierden valor si no se actualizan.

---

## 11. Hoja de ruta

Facundo prefiere ir paso a paso.
1. **Home y nav** (primer entregable, ver `prompt-01-home`).
2. Proyecto base reutilizable: layout compartido, SEO base, analytics, espacio para anuncios.
3. Autenticación con Supabase y favoritos en cuenta.
4. Primeras 4 herramientas, cada una con su página optimizada.
5. Sección "Herramientas" en `playcomun.com` y redirección de `playcomun.store`.
6. Medir tráfico y uso.
7. Activar cobros (herramienta puntual y plan general) en las herramientas de trabajo que lo justifiquen.

Principio: **base reutilizable.** Cada microapp nueva debería ser solo su lógica y su contenido, reutilizando layout, componentes, SEO, analytics y anuncios.

---

## 12. Pendiente de decidir

- Nombre público final del hub.
- Si las herramientas básicas se usan sin cuenta (propuesto que sí).
- Confirmar la propuesta de nav, en particular el lugar de "Hacé tu proyecto".
- Precios del plan general y de la compra por herramienta, y si la compra puntual es pago único o suscripción.
- Qué herramientas reales aparecen al lanzar, y si se incluyen las de fitness (1RM, calorías) o se mantiene el foco en negocio y finanzas.
- Etiqueta Gratis/Pro de cada herramienta (por ejemplo, el conversor de unidades figura como Pro en la maqueta y conviene gratis).
- Confirmar las primeras 4 herramientas y la redirección de `playcomun.store`.
- Confirmar si se pueden usar fuentes web en el hosting final.
- Redactar privacidad y términos, y reformular el mensaje "No guardamos tus datos".
- Facturación con un contador y registro de la base de datos de usuarios.
- Red publicitaria y momento de activarla.
