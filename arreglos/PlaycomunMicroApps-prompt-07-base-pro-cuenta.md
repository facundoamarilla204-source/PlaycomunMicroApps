# Prompt 07 — Base Pro: datos por usuario, área de cuenta, marca, clientes y productos

> Este prompt es **independiente** del modelo Gratis/Pro: no hace falta haber aplicado antes ningún otro prompt de planes. Tené en el repo `docs/contexto-proyecto.md` y `docs/seo.md`.

---

## Rol

Actuá como desarrollador full-stack senior (Next.js, Supabase, PostgreSQL) con foco en **seguridad de datos por usuario**, experiencia de uso clara y accesibilidad.

## Contexto

**PlaycomunMicroApps** (`playcomun.online`) ya tiene login con Supabase y cobro con Mercado Pago funcionando. Las herramientas de negocio (documentos comerciales, presupuestos, listas de precios, costo de receta, control de gastos) hoy no guardan nada en el servidor: cada vez hay que cargar todo de nuevo. El valor de la versión Pro va a ser **guardar y reutilizar**.

**Decisión pendiente del dueño:** todavía no definió qué funciones van a ser gratis, cuáles gratis con límite y cuáles solo Pro. Por eso hay que **construir primero todas las funciones y dejar el control de acceso configurable**, de modo que decidir después sea cambiar un valor, no reescribir código.

Este prompt construye la **base compartida**: las tablas con seguridad por usuario, el sistema de acceso configurable y un área de cuenta donde el usuario administra su **marca, clientes y productos**. La integración con cada herramienta (guardar documentos, historial, numeración, recetas, listas, gastos) viene en los prompts siguientes, **no en este**.

**Leé primero** `docs/contexto-proyecto.md` y `docs/seo.md`, y revisá cómo está hoy el esquema de Supabase y cómo se determina el estado del plan.

## Objetivo

Dejar lista la infraestructura de datos, un **sistema de acceso configurable por función**, y el área **"Mi cuenta"** con: **Marca**, **Clientes**, **Productos y servicios**, **Mi plan** y **Mis datos** (exportar y eliminar).

## Paso 0 — Relevamiento (obligatorio, antes de tocar nada)

Inspeccioná el repositorio y documentá en `docs/pro-estado-actual.md`:
1. Cómo se determina hoy si un usuario es Pro (tabla de Supabase, webhook de Mercado Pago, estado, vencimiento) y dónde está esa lógica.
2. Qué funciones Pro existen y funcionan hoy (por ejemplo, los QR dinámicos).
3. Si existen o no la cancelación y la gestión de la suscripción.
4. Cómo está organizado el esquema actual de Supabase (tablas, políticas, buckets).
Reutilizá lo que ya existe; no rehagas el cobro ni el estado del plan.

## Alcance

**Incluye**
1. Migraciones SQL en `supabase/migrations/` para: `brand_profiles`, `clients`, `products` y `feature_rules`, con seguridad a nivel de fila (RLS).
2. Función `is_pro(user_id)` apoyada en el estado del plan que **ya existe**.
3. **Sistema de acceso configurable por función** (ver sección siguiente), aplicado en el servidor y con una salvaguarda en la base de datos.
4. Subida segura del logo a Supabase Storage.
5. Rutas de cuenta (solo con sesión): `/cuenta`, `/cuenta/marca`, `/cuenta/clientes`, `/cuenta/productos`, `/cuenta/plan`, `/cuenta/datos`.
6. Exportar los datos del usuario y eliminar la cuenta con sus datos.
7. Pruebas de seguridad y de acceso, y documentación en `docs/pro-datos.md`.

**No incluye (no lo implementes)**
- Guardar documentos, historial ni numeración, recetas, listas de precios o sincronización de gastos (prompts siguientes).
- Cambios en el cobro con Mercado Pago ni en las etiquetas Gratis/Pro de las tarjetas.
- Textos legales, política de privacidad ni términos (los resuelve el dueño después).
- Ejecutar migraciones contra la base de producción: generá los archivos y las instrucciones, el dueño los aplica.

## Sistema de acceso configurable

**Idea:** cada función que podría ser limitada o exclusiva de Pro tiene una **regla** que se puede cambiar sin tocar código. **Por defecto, todas están abiertas** (cualquier usuario registrado las usa sin límite), hasta que el dueño decida.

- Tabla **`feature_rules`**: `feature_key` (clave primaria), `mode` (`'open'` | `'limited'` | `'pro'`), `free_limit` (entero, opcional) y `updated_at`. Lectura permitida a usuarios autenticados; **escritura solo con rol de servicio**.
  - `open`: cualquier usuario registrado puede usar la función sin límite.
  - `limited`: los usuarios gratis pueden crear hasta `free_limit` elementos; Pro sin límite.
  - `pro`: solo Pro puede **crear**; los gratis ven lo que ya hubieran guardado.
- Cargá estas funciones iniciales, todas en `open`: `clients`, `products`, `brand_profile`. Dejá el mecanismo listo para sumar más (por ejemplo `saved_documents`, `saved_recipes`, `price_lists`, `expenses_sync`, `doc_numbering`, `no_footer`) sin cambios de código en el sistema.
- **En el servidor:** un helper (por ejemplo `assertCanCreate(featureKey)`) que consulta la regla y el uso actual y falla con un error claro cuando corresponde.
- **En la base de datos:** una salvaguarda (trigger o función) que lee `feature_rules` y rechaza inserciones que superen la regla, de modo que no se pueda saltear manipulando el cliente.
- **En la interfaz:** un hook `useFeatureAccess(featureKey)` que devuelve `{ allowed, used, limit, mode, isPro }`. Y un componente mínimo **`UpgradeNotice`** (aviso en línea, descartable, con el violeta de la marca y voseo) que se muestra solo cuando una acción está bloqueada o cerca del límite, con un enlace a `/planes`. No bloquea el uso básico.
- **Regla de oro:** si un usuario baja de Pro a gratis, **no se borra ni se oculta nada** de lo guardado: sigue visible y editable; solo se bloquea crear más por encima de la regla.
- Dejá en `docs/pro-datos.md` la forma de cambiar una regla (por ejemplo, con una sentencia SQL de ejemplo para pasar `clients` de `open` a `limited` con `free_limit = 5`).

## Reglas de seguridad (críticas)

- **RLS activado en todas las tablas nuevas**, con políticas que permitan a cada usuario ver y modificar **solo sus propias filas** (`user_id = auth.uid()`). Sin acceso público ni anónimo.
- **Nunca** uses la clave de servicio (`service_role`) en el navegador. Si hace falta en el servidor, solo en variables de entorno del servidor.
- Los límites se validan **en el servidor**; el cliente solo informa.
- Sin datos personales en logs ni en eventos de analítica.
- Entradas validadas y saneadas del lado del servidor. Sin SQL armado a mano con texto del usuario.
- El logo va a un **bucket privado**, en una carpeta por usuario, con política de acceso por usuario. Solo PNG, JPG o WEBP, hasta 2 MB. **No aceptes SVG** (riesgo de código malicioso).
- Todo lo que el usuario guarda es **suyo**: tiene que poder exportarlo y borrarlo.

## Modelo de datos (propuesta, adaptala a lo que ya exista)

Todas las tablas de usuario con `id uuid` (clave primaria), `user_id uuid` (referencia a `auth.users`, con borrado en cascada), `created_at` y `updated_at`.

- **`brand_profiles`** (una fila por usuario): nombre del negocio o razón social, identificación fiscal (CUIT/DNI), teléfono, email, dirección, ruta del logo en Storage, color de acento, notas al pie, datos bancarios o de pago.
- **`clients`**: nombre o razón social (obligatorio), CUIT/DNI, teléfono, email, dirección, notas.
- **`products`**: nombre (obligatorio), descripción, precio unitario (`numeric(14,2)`), moneda (ARS por defecto), unidad.
- **`feature_rules`**: ver arriba.

Índices por `user_id` y por nombre para la búsqueda. No guardes nada que no se use. Para las migraciones, incluí también el script de reversión (rollback).

## Especificación de la interfaz

**Reglas generales:** mismo diseño del sitio (violeta `#7C3AED`, tema claro), voseo, accesibilidad AA, uso completo con teclado, estados de carga y de error. Para los estados vacíos, usá el componente de la nutria con globito (`OtterSays`) **si ya existe**; si no, un estado vacío simple con las imágenes de marca disponibles. Solo con sesión iniciada; sin sesión, redirigir a `/ingresar` y volver a la página al terminar. Estas rutas quedan **fuera del sitemap y con `noindex`** (ya están bloqueadas en `robots`).

- **`/cuenta` (resumen):** tarjetas con acceso a Marca, Clientes, Productos, Plan y Datos; medidor de uso (por ejemplo "3 de 5 clientes") **solo si la regla de esa función es `limited`**; estado del plan.
- **`/cuenta/marca`:** formulario con los datos del negocio, subida de logo con vista previa (y opción de quitarlo), selector de color de acento y notas al pie. Guardado con confirmación. Lo guardado debe poder **leerse desde las herramientas** mediante una función reutilizable (`getBrandProfile()`), para los prompts siguientes.
- **`/cuenta/clientes`:** lista con búsqueda y paginación, alta, edición y borrado (con confirmación). Validación: nombre obligatorio, email con formato válido, **CUIT con dígito verificador válido** si se carga (11 dígitos) y DNI de 7 u 8 dígitos.
- **`/cuenta/productos`:** misma lógica que clientes. Precio con formato es-AR (miles con punto y decimales con coma), validado y no negativo.
- **`/cuenta/plan`:** estado de la suscripción (plan, período, próxima renovación o vencimiento), usando lo que ya existe del cobro. Si ya hay una forma de cancelar o gestionar la suscripción, enlazala; si no la hay, **informalo en el resumen sin construirla**. Mostrá qué funciones tienen hoy la regla `limited` o `pro` (leída de `feature_rules`); si no hay ninguna, un texto genérico con enlace a `/planes`.
- **`/cuenta/datos`:**
  - **Exportar mis datos:** descarga de un archivo (JSON y CSV por tabla, o un ZIP) con marca, clientes y productos. El logo se incluye o se indica cómo descargarlo.
  - **Eliminar mi cuenta y mis datos:** acción protegida con confirmación explícita (por ejemplo, escribir "ELIMINAR"). Borra los datos y el logo del usuario. Si el usuario tiene una suscripción activa, **avisalo antes de borrar** y no permitas eliminar sin aclarar qué pasa con el cobro (informalo en el resumen para que el dueño decida el flujo).
- **Navegación:** agregá "Mi cuenta" al menú del avatar del header, con acceso a Marca, Clientes, Productos y Plan.

## Pruebas

Escribí pruebas (SQL o scripts de integración, y pruebas unitarias donde corresponda) que verifiquen:
1. Un usuario **no puede leer, crear, editar ni borrar** filas de otro usuario en ninguna tabla.
2. Un usuario anónimo no accede a nada.
3. Con las reglas por defecto (`open`), un usuario gratis crea clientes y productos sin límite.
4. Al cambiar la regla de `clients` a `limited` con un límite, el servidor **y** la base rechazan superar ese límite para un usuario gratis, y un usuario Pro no tiene límite.
5. Con la regla en `pro`, un usuario gratis no puede crear pero sigue viendo lo que ya tenía.
6. Bajar de Pro a gratis no borra ni oculta datos existentes.
7. Un usuario no puede modificar `feature_rules`.
8. La validación del CUIT acepta uno válido y rechaza uno con dígito verificador incorrecto.
9. Subir un archivo que no sea PNG, JPG o WEBP, o de más de 2 MB, se rechaza; un SVG se rechaza.
10. Eliminar la cuenta elimina todas las filas y los archivos del usuario.

## Documentación (`docs/pro-datos.md`)

Esquema de tablas, políticas de seguridad, función `is_pro`, el sistema de reglas de acceso y **cómo cambiar una regla**, política del bucket del logo, cómo correr las migraciones y las pruebas, y cómo agregar una función nueva siguiendo el mismo patrón. Debe servir de base para los prompts siguientes.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint`, la verificación de tipos y todas las pruebas pasan.
- [ ] Existe `docs/pro-estado-actual.md` con el relevamiento.
- [ ] Las migraciones y sus reversiones existen y están documentadas.
- [ ] RLS está activo en todas las tablas nuevas y las pruebas de aislamiento entre usuarios pasan.
- [ ] Por defecto todas las funciones están abiertas, y cambiar una regla en `feature_rules` cambia el comportamiento sin tocar código, en servidor y en base de datos.
- [ ] El logo se sube a un bucket privado con las restricciones indicadas.
- [ ] Todas las rutas de `/cuenta/*` exigen sesión, están fuera del sitemap y con `noindex`.
- [ ] Alta, edición, búsqueda y borrado de clientes y productos funcionan, con validación de CUIT/DNI y precios en formato es-AR.
- [ ] La marca se guarda y se puede leer con una función reutilizable.
- [ ] Se puede exportar los datos y eliminar la cuenta con confirmación explícita.
- [ ] Usuarios que bajan de Pro a gratis conservan sus datos.
- [ ] No hay claves de servicio en el código del cliente ni datos personales en logs o eventos.
- [ ] Accesibilidad AA y teclado completo en todas las pantallas nuevas; sin scroll horizontal en 375px.
- [ ] Lighthouse no empeora en las páginas públicas.

## Entregables

1. El código y las migraciones (sin ejecutarlas en producción).
2. `docs/pro-datos.md` y `docs/pro-estado-actual.md`.
3. Un resumen final con qué se implementó, decisiones provisorias, cómo aplicar las migraciones y cómo probar con usuarios gratis y Pro, incluido cómo cambiar una regla de acceso.
4. Una lista titulada **"Para decidir o revisar por el dueño"**: qué funciones pasarán a `limited` o `pro` y con qué valores, qué pasa con una suscripción activa al eliminar la cuenta, si falta construir la cancelación de la suscripción, y los textos legales y de privacidad que habrá que actualizar (qué datos nuevos se guardan y dónde).

## Reglas

- No implementes nada del bloque "No incluye".
- Si algo es ambiguo, elegí lo más simple, dejalo configurable y anotalo en el resumen. Preguntá solo si algo bloquea el avance.
- No modifiques `docs/contexto-proyecto.md` ni `docs/seo.md`; la documentación nueva va en archivos propios.
