# Informe de Auditoría Integral: Modelo Gratis vs. Pro de PlayComun Online

**Fecha de auditoría:** 16 de octubre de 2026  
**Entorno técnico analizado:** Next.js 16.3.8 (App Router), React 19.2.8, Supabase (PostgreSQL 15 + RLS + GoTrue), Vitest 5.0.3, TypeScript 5.  
**Alcance:** Catálogo completo de herramientas, arquitectura central de suscripciones, Server Actions, rutas API, políticas RLS, cuotas del worker y mecanismos de retención de datos.  
**Regla de intervención aplicada:** Auditoría técnica estática y pruebas en ejecución no destructivas; sin alteración de datos de producción, esquemas de base de datos ni suscripciones activas.

---

## 1. Resumen Ejecutivo

| Métrica / Clasificación | Cantidad | Herramientas / Rutas |
| :--- | :---: | :--- |
| **Total de herramientas inventariadas** | **20** | Catálogo oficial registrado en [`src/data/tools.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/data/tools.ts) |
| **A. Completamente Gratis** | **12** | Calculadora de 1RM, Calculadora de aguinaldo, Calculadora de calorías, Calculadora de cuotas, Calculadora de IVA, Calculadora de precios, Calculadora de rentabilidad, Conversor de unidades, Link de reseñas de Google, Compresor de imágenes, Ordenar PDF, Cortador de audio online. |
| **B. Gratis + Pro (Híbridas)** | **6** | Calculadora de costo de receta, Control de gastos, Generador de documentos comerciales, Generador de presupuestos, Generador de listas de precios, Convertidor de archivos. |
| **C. Solo Pro** | **0** | Ninguna herramienta del catálogo bloquea el acceso inicial completo tras un muro de pago obligatorio. |
| **D. Próximamente o Incompleta** | **0** | Control de stock fue retirado del catálogo para reemplazo por una nueva herramienta a definir. |
| **E. Estado Indeterminado / Falla de Seguridad** | **1** | Generador de QR (`/herramientas/generador-qr`). |
| **Rutas y aliases complementarios detectados** | **2** | `/q/[token]` (resolución pública de QR) y `/herramientas/generador-facturas` (alias de documentos comerciales). |

### Diagnóstico General del Sistema
1. **Conservación de datos (Cumplimiento 100%):** El vencimiento, pausa o cancelación de una suscripción Pro **nunca elimina datos** del usuario. Las recetas, listas de precios, comprobantes comerciales y movimientos contables permanecen almacenados en Supabase asociados a su `user_id`. Al reactivar Pro, el acceso se reanuda de forma inmediata.
2. **Defensa en profundidad en herramientas recientes:** *Costo de receta*, *Listas de precios*, *Control de gastos* y *Convertidor de archivos* disponen de verificación estricta en el servidor (Server Actions / API Routes) y políticas RLS con funciones `SECURITY DEFINER` que devuelven el recuento de elementos retenidos sin exponer el detalle cuando Pro está inactivo.
3. **Brecha crítica en Generador de QR:** La generación y actualización de códigos QR dinámicos está protegida **únicamente en la interfaz de usuario**. La Server Action [`generateQrCodes`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/qr.ts#L101-L185) no valida la condición Pro, y la tabla `qr_codes` no tiene RLS condicionado a `is_pro_user()`.
4. **Validación técnica automatizada:** La suite de pruebas de la aplicación ejecutó **129 pruebas unitarias e integrales en 12 archivos con 100% de éxito**. Sin embargo, la verificación estricta de TypeScript detectó discrepancias de nombres de propiedades (`defaultDiscount` vs `defaultDiscountPercent`) que deben subsanarse.

---

## 2. Inventario Completo del Catálogo

| # | Herramienta | Ruta Real | Estado Técnico | Clasificación Comercial | Persistencia Local | Persistencia Supabase | Evidencia en Código |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | **Calculadora de costo de receta** | `/herramientas/costo-receta` | Producción | **B. Gratis + Pro** | Memoria de sesión | Tablas `recipes`, `recipe_ingredients`, `recipe_additional_costs` | [`CostoReceta.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/CostoReceta.tsx), [`recipes.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/recipes.ts) |
| **2** | **Control de gastos** | `/herramientas/control-gastos` | Producción | **B. Gratis + Pro** | `localStorage` (`playcomun_expenses_local_v2`) | Tablas `expenses`, `expense_categories` | [`ControlGastos.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/ControlGastos.tsx), [`expenses.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/expenses.ts) |
| **3** | **Calculadora de precios** | `/herramientas/calculadora-precios` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`CalculadoraPrecios.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/CalculadoraPrecios.tsx) |
| **4** | **Generador de presupuestos** | `/herramientas/generador-presupuestos` | Producción | **B. Gratis + Pro** | `sessionStorage` | Tablas `commercial_documents`, `commercial_clients`, `commercial_products` | [`[slug]/page.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/(main)/herramientas/[slug]/page.tsx#L69-L77), [`GeneradorFacturasTool.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/generador-facturas/GeneradorFacturasTool.tsx) |
| **5** | **Generador de documentos comerciales** | `/herramientas/generador-documentos-comerciales` | Producción | **B. Gratis + Pro** | `sessionStorage` | Tablas `commercial_documents`, `commercial_clients`, `commercial_products`, `business_profiles` | [`page.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/(main)/herramientas/generador-documentos-comerciales/page.tsx), [`commercial-documents.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts) |
| **6** | **Calculadora de IVA** | `/herramientas/calculadora-iva` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`CalculadoraIVA.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/CalculadoraIVA.tsx) |
| **7** | **Calculadora de rentabilidad** | `/herramientas/calculadora-rentabilidad` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`CalculadoraRentabilidad.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/CalculadoraRentabilidad.tsx) |
| **8** | **Generador de QR** | `/herramientas/generador-qr` | Producción / Vulnerable | **E. Indeterminado (Falla en Backend)** | No aplica | Tablas `qr_codes`, `qr_groups` | [`GeneradorQR.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/GeneradorQR.tsx), [`qr.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/qr.ts) |
| **9** | **Calculadora de 1RM** | `/herramientas/calculadora-1rm` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`Calculadora1RM.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/Calculadora1RM.tsx) |
| **10** | **Conversor de unidades** | `/herramientas/conversor-unidades` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`ConversorUnidades.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/ConversorUnidades.tsx) |
| **11** | **Calculadora de aguinaldo** | `/herramientas/calculadora-aguinaldo` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`CalculadoraAguinaldo.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/CalculadoraAguinaldo.tsx) |
| **12** | **Calculadora de cuotas** | `/herramientas/calculadora-cuotas` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`CalculadoraCuotas.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/CalculadoraCuotas.tsx) |
| **13** | **Calculadora de calorías** | `/herramientas/calculadora-calorias` | Producción | **A. Completamente Gratis** | No aplica | Ninguna | [`CalculadoraCalorias.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/CalculadoraCalorias.tsx) |
| **15** | **Link de reseñas de Google** | `/herramientas/link-resenas-google` | Producción | **A. Completamente Gratis** | No aplica | Ninguna (API Google Places) | [`LinkResenasGoogle.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/LinkResenasGoogle.tsx), [`google-reviews/search`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/google-reviews/search/route.ts) |
| **16** | **Generador de listas de precios** | `/herramientas/generador-listas-precios` | Producción | **B. Gratis + Pro** | `localStorage` (`playcomun_price_list_current_v2`) | Tablas `price_lists`, `price_list_categories`, `price_list_products` | [`page.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/(main)/herramientas/generador-listas-precios/page.tsx), [`price-lists.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/price-lists.ts) |
| **17** | **Compresor de imágenes** | `/herramientas/compresor-imagenes` | Producción | **A. Completamente Gratis** | No aplica (Motor Canvas en navegador) | Ninguna | [`CompresorImagenes.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/compresor-imagenes/CompresorImagenes.tsx) |
| **18** | **Convertidor de archivos** | `/herramientas/convertidor-archivos` | Producción | **B. Gratis + Pro** | No aplica (Motor JS client / LibreOffice worker) | Tabla `conversion_reservations` | [`ConvertidorArchivos.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/convertidor-archivos/ConvertidorArchivos.tsx), [`token/route.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/conversion/token/route.ts) |
| **19** | **Ordenar PDF** | `/herramientas/ordenar-pdf` | Producción | **A. Completamente Gratis** | No aplica (pdf-lib / pdfjs en navegador) | Ninguna | [`OrdenarPdf.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/ordenar-pdf/OrdenarPdf.tsx) |
| **20** | **Cortador de audio online** | `/herramientas/cortar-audio` | Producción | **A. Completamente Gratis** | No aplica (FFmpeg WASM en navegador) | Ninguna | [`CortadorAudio.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/cortador-audio/CortadorAudio.tsx) |

---

## 3. Matriz de Funcionalidades Gratis vs. Pro

### 3.1 Calculadora de Costo de Receta (`/herramientas/costo-receta`)

| Operación Concreta | Anónimo | Registrado sin Pro | Pro Activo | Validación de Permiso | Al perder Pro | Al reactivar Pro |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **Cálculo de costos e ingredientes** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (en memoria) | Permanece funcional | Permanece funcional |
| **Cálculo de margen y markup** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (en memoria) | Permanece funcional | Permanece funcional |
| **Exportar receta a PDF** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (jsPDF) | Permanece funcional | Permanece funcional |
| **Guardar receta en la nube** | ❌ Modal Login | ❌ Modal Pro | ✅ Sí | Servidor [`saveRecipeServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/recipes.ts#L222) + RLS | Bloqueado para nuevas | Habilitado |
| **Biblioteca de recetas guardadas** | ❌ No | ❌ Contador | ✅ Sí | Servidor [`getUserRecipesServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/recipes.ts#L63) + RLS | Se preservan (contador) | Se listan completas |
| **Editar receta existente** | ❌ No | ❌ No | ✅ Sí | Servidor [`saveRecipeServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/recipes.ts#L222) + RLS | Bloqueado | Habilitado |
| **Duplicar receta en la nube** | ❌ No | ❌ No | ✅ Sí | Servidor [`duplicateRecipeServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/recipes.ts#L368) + RLS | Bloqueado | Habilitado |
| **Eliminar receta en la nube** | ❌ No | ❌ No | ✅ Sí | Servidor [`deleteRecipeServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/recipes.ts#L327) + RLS | Bloqueado | Habilitado |

### 3.2 Generador de Documentos Comerciales y Presupuestos

| Operación Concreta | Anónimo | Registrado sin Pro | Pro Activo | Validación de Permiso | Al perder Pro | Al reactivar Pro |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **Emisión y edición de comprobante** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`sessionStorage`) | Permanece funcional | Permanece funcional |
| **Cálculo de totales, impuestos y señas** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`math.ts`) | Permanece funcional | Permanece funcional |
| **Descarga de PDF con marca de agua** | ✅ Sí | ✅ Sí | ❌ No (Marca blanca) | Cliente (`pdfGenerator.ts`) | Emite con marca PlayComun | Emite en marca blanca |
| **Descarga de PDF en marca blanca** | ❌ No | ❌ No | ✅ Sí | Cliente (`pdfGenerator.ts`) | Bloqueado (agrega marca) | Habilitado |
| **Guardar documento en la nube** | ❌ Modal Pro | ❌ Modal Pro | ✅ Sí | Servidor [`saveCommercialDocumentServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts#L430) + RLS | Bloqueado | Habilitado |
| **Historial de documentos emitidos** | ❌ No | ❌ No | ✅ Sí | Servidor [`getCommercialDocumentsServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts#L361) + RLS | Se preservan en DB | Se recuperan todos |
| **Agenda de clientes reutilizables** | ❌ No | ❌ No | ✅ Sí | Servidor [`saveCommercialClientServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts#L169) + RLS | Se preservan en DB | Se recuperan todos |
| **Catálogo de productos/servicios** | ❌ No | ❌ No | ✅ Sí | Servidor [`saveCommercialProductServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts#L270) + RLS | Se preservan en DB | Se recuperan todos |
| **Perfil comercial emisor permanente** | ❌ No | ❌ No | ✅ Sí | Servidor [`saveBusinessProfileServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts#L77) + RLS | Se preserva en DB | Se recupera |
| **Numeración correlativa atómica nube** | ❌ Temporal | ❌ Temporal | ✅ Sí | Servidor [`getNextDocumentNumberServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts#L336) (RPC) | Vuelve a temporal | Reanuda correlativo |

### 3.3 Generador de Listas de Precios (`/herramientas/generador-listas-precios`)

| Operación Concreta | Anónimo | Registrado sin Pro | Pro Activo | Validación de Permiso | Al perder Pro | Al reactivar Pro |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **Crear y editar lista activa local** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`localStorage`) | Permanece funcional | Permanece funcional |
| **Ajuste masivo de precios (%)** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`MassPriceModal.tsx`) | Permanece funcional | Permanece funcional |
| **Exportar lista en PDF** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`PDFGenerator.tsx`) | Permanece funcional | Permanece funcional |
| **Guardar lista en la nube** | ❌ Modal Pro | ❌ Modal Pro | ✅ Sí | Servidor [`savePriceListServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/price-lists.ts#L187) + RLS | Bloqueado | Habilitado |
| **Biblioteca de múltiples listas** | ❌ No | ❌ Contador | ✅ Sí | Servidor [`getUserPriceListsServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/price-lists.ts#L58) + RLS | Se preservan (contador) | Se recuperan todas |
| **Duplicar lista en la nube** | ❌ No | ❌ No | ✅ Sí | Servidor [`duplicatePriceListServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/price-lists.ts#L324) + RLS | Bloqueado | Habilitado |

### 3.4 Control de Gastos (`/herramientas/control-gastos`)

| Operación Concreta | Anónimo | Registrado sin Pro | Pro Activo | Validación de Permiso | Al perder Pro | Al reactivar Pro |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **Registro local de ingresos y gastos** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`localStorage`) | Permanece funcional | Permanece funcional |
| **Categorías personalizadas locales** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`localStorage`) | Permanece funcional | Permanece funcional |
| **Resúmenes, balance y filtros** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (`ExpenseSummary.tsx`) | Permanece funcional | Permanece funcional |
| **Sincronización automática en nube** | ❌ No | ❌ No | ✅ Sí | Servidor [`createExpenseServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/expenses.ts#L115) + RLS | Vuelve a local | Sincroniza en nube |
| **Migración de registros locales a nube** | ❌ No | ❌ No | ✅ Sí | Servidor [`syncExpensesBatchServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/expenses.ts#L269) + RLS | No aplica | Importa sin duplicar |
| **Exportación a planilla Excel (.xlsx)** | ❌ Modal Pro | ❌ Modal Pro | ✅ Sí | Servidor [`exportExpensesExcelServer`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/expenses.ts#L323) | Bloqueado | Habilitado |

### 3.5 Generador de QR (`/herramientas/generador-qr`)

| Operación Concreta | Anónimo | Registrado sin Pro | Pro Activo | Validación Real en Servidor | Comportamiento Vencimiento |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Generar y descargar QR estático** | ✅ Sí | ✅ Sí | ✅ Sí | Cliente (SVG a PNG) | No requiere backend |
| **Crear tanda física de QR dinámicos** | ❌ Bloqueado UI | ⚠️ **Vulnerable** (Permitido por Server Action) | ✅ Sí | ❌ **Sin validación Pro en servidor** | Grupos y códigos quedan en DB |
| **Configurar destino de QR dinámico** | ❌ Bloqueado UI | ⚠️ **Vulnerable** (Permitido por Server Action) | ✅ Sí | ❌ **Sin validación Pro en servidor** | Queda configurado |
| **Pausar / reactivar QR dinámico** | ❌ Bloqueado UI | ⚠️ **Vulnerable** (Permitido por Server Action) | ✅ Sí | ❌ **Sin validación Pro en servidor** | Queda el estado asignado |
| **Descargar plancha de impresión PDF** | ❌ Bloqueado UI | ⚠️ Permitido si tiene grupo | ✅ Sí | Cliente (jsPDF) | No requiere servidor |
| **Resolución pública (`/q/[token]`)** | ✅ Público | ✅ Público | ✅ Público | Servidor (Service Role en Next.js) | **Mantiene redirección activa** |

### 3.6 Convertidor de Archivos (`/herramientas/convertidor-archivos`)

| Operación Concreta | Motor de Ejecución | Modalidad Gratis | Modalidad Pro | Validación en Servidor | Consumo de Cuota Diaria |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **Word a PDF (.doc, .docx)** | Worker (LibreOffice) | Hasta 5/día (Máx 10 MB) | Hasta 100/día (Máx 50 MB) | Servidor ([`/api/conversion/token`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/conversion/token/route.ts)) | ✅ Sí (solo al confirmarse) |
| **Excel a PDF (.xls, .xlsx)** | Worker (LibreOffice) | Hasta 5/día (Máx 10 MB) | Hasta 100/día (Máx 50 MB) | Servidor ([`/api/conversion/token`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/conversion/token/route.ts)) | ✅ Sí (solo al confirmarse) |
| **PowerPoint a PDF (.ppt, .pptx)**| Worker (LibreOffice) | Hasta 5/día (Máx 10 MB) | Hasta 100/día (Máx 50 MB) | Servidor ([`/api/conversion/token`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/conversion/token/route.ts)) | ✅ Sí (solo al confirmarse) |
| **OpenDocument a PDF (.odt, .ods)**| Worker (LibreOffice) | Hasta 5/día (Máx 10 MB) | Hasta 100/día (Máx 50 MB) | Servidor ([`/api/conversion/token`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/conversion/token/route.ts)) | ✅ Sí (solo al confirmarse) |
| **Imágenes a PDF (JPG, PNG, WebP)**| Cliente (pdf-lib) | Ilimitado | Ilimitado | No requiere servidor | ❌ No consume cuota |
| **PDF a Word (.docx)** | Cliente (pdfjs + docx) | Ilimitado | Ilimitado | No requiere servidor | ❌ No consume cuota |
| **PDF a Excel (.xlsx)** | Cliente (pdfjs + xlsx) | Ilimitado | Ilimitado | No requiere servidor | ❌ No consume cuota |
| **PDF a PowerPoint (.pptx)** | Cliente (pdfjs + pptxgen)| Ilimitado | Ilimitado | No requiere servidor | ❌ No consume cuota |
| **PDF a PDF/A (Preservación)** | Cliente (pdf-lib + XMP)| Ilimitado | Ilimitado | No requiere servidor | ❌ No consume cuota |
| **PDF a Imágenes (JPG, PNG, ZIP)** | Cliente (pdfjs + canvas)| Ilimitado | Ilimitado | No requiere servidor | ❌ No consume cuota |

---

## 4. Registro de Cuotas y Límites Técnicos

```
+---------------------------------------------------------------------------------------------------+
|                        ARQUITECTURA DE CUOTAS Y LÍMITES EN PLAYCOMUN                              |
+---------------------------------------------------------------------------------------------------+
| HERRAMIENTA           | RESTRICCIÓN           | GRATIS          | PRO            | MECANISMO      |
+-----------------------+-----------------------+-----------------+----------------+----------------+
| Convertidor Worker    | Conversiones diarias  | 5 / día         | 100 / día      | Supabase RPC   |
| Convertidor Worker    | Tamaño máximo archivo | 10 MB           | 50 MB          | Backend Token  |
| Convertidor Worker    | Horario de reinicio   | 00:00 (Arg)     | 00:00 (Arg)    | Timezone SQL   |
| Convertidor Worker    | Token de seguridad    | 5 min (HMAC)    | 5 min (HMAC)   | Timing-safe    |
| Convertidor Local     | Cantidad de archivos  | Sin límite      | Sin límite     | Browser Memory |
| Control de Gastos     | Movimientos locales   | Sin límite      | Sin límite     | localStorage   |
| Documentos Comerciales| Correlativo numérico  | Temporal (TMP)  | Atómico Nube   | SQL Sequence   |
| Google Reviews API    | Búsqueda de comercio  | 30 req / 10 min | 30 req / 10 min| Sliding Window |
+-----------------------+-----------------------+-----------------+----------------+----------------+
```

### Detalle de Funcionamiento del Convertidor de Archivos:
- **Identificación segura:** Usuarios autenticados mediante `usr:<user_id>`. Visitantes anónimos mediante huella criptográfica unidireccional `anon:<HMAC_SHA256(ip, salt)>` sin registrar IPs en texto claro (cumplimiento de privacidad).
- **Reserva atómica:** La función [`reserve_conversion_quota`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016030000_conversion_quotas_pro.sql#L121-L207) adquiere un bloqueo transaccional consultivo (`pg_advisory_xact_lock(hashtext(p_identifier || ':' || v_quota_date::text))`), impidiendo carreras críticas por solicitudes simultáneas.
- **Tolerancia a fallos:** Las conversiones que fallan o se cancelan invocan `/api/conversion/release`, liberando la cuota. Si la ventana se cierra inesperadamente, la reserva expira a los 5 minutos sin penalizar la cuota del usuario.
- **Confirmación criptográfica:** El worker contenerizado emite un recibo firmado con SHA-256 (`receipt:<reservationId>:<fileSize>`). La ruta `/api/conversion/confirm` verifica la firma con `crypto.timingSafeEqual` antes de asentar el consumo en la base de datos.

---

## 5. Seguridad, Autorización y Conservación de Datos

### 5.1 Conservación de Datos tras el Vencimiento de Suscripciones
- **Integridad referencial intacta:** Las tablas del sistema (`recipes`, `price_lists`, `expenses`, `commercial_documents`, `commercial_clients`, `commercial_products`, `business_profiles`) no tienen disparadores de borrado automático ni restricciones de expiración temporal.
- **Aislamiento por RLS:** Las políticas RLS en Postgres deniegan lecturas y escrituras cuando `public.is_pro_user(auth.uid())` evalúa a `false`, garantizando que ninguna interfaz o cliente de API pueda modificar registros sin suscripción.
- **Visibilidad no destructiva:** Para evitar que el usuario piense que sus datos fueron eliminados, las funciones `SECURITY DEFINER` [`get_user_recipe_count()`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016000000_recipes_pro_permissions.sql#L25), [`get_user_price_list_count()`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016010000_price_lists_pro.sql#L30) y [`get_user_expense_count()`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016020000_control_gastos_pro.sql#L46) permiten a la interfaz informar: *"Tenés X elementos guardados en tu cuenta. Se conservan intactos y volverán a estar disponibles al reactivar Pro"*.

### 5.2 Comportamiento en Producción de Códigos QR Físicos
- **Persistencia de resolución en `/q/[token]`:** La ruta pública de redirección [`src/app/q/[token]/page.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/q/[token]/page.tsx) utiliza el cliente Supabase con privilegios administrativos (`SUPABASE_SERVICE_ROLE_KEY`) para buscar el token público.
- Si el código tiene estado `active` y una `destination_url`, ejecuta inmediatamente `redirect(destination_url)`.
- **Decisión arquitectónica clave:** La resolución **no verifica si el creador del QR mantiene su suscripción Pro activa**. Esto protege a los comerciantes y usuarios finales evitando que stickers, cartas de restaurantes o folletos impresos queden inutilizados o rotos ante una tarjeta vencida o un fallo transitorio de cobro.

### 5.3 Vulnerabilidades de Seguridad Detectadas
- 🚨 **Generación no autorizada de QR Dinámicos (Severidad Alta):**
  - **Ubicación:** [`src/app/actions/qr.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/qr.ts#L101-L185) y [`006_qr_codes.sql`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/006_qr_codes.sql#L32-L35).
  - **Fallo:** La acción del servidor solo valida `if (!user) throw new Error("No autenticado")`. No ejecuta `isProUser(user.id)`. La política de inserción RLS es `with check (auth.uid() = user_id)`.
  - **Impacto:** Cualquier usuario registrado sin suscripción Pro puede enviar una petición POST a la Server Action y generar tandas completas de QR dinámicos en la nube.
- ⚠️ **Cancelación prematura en Webhook de Mercado Pago (Severidad Media):**
  - **Ubicación:** [`src/app/api/webhooks/mercadopago/route.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/webhooks/mercadopago/route.ts#L70) y [`004_helper_functions.sql`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/004_helper_functions.sql#L20).
  - **Fallo:** Cuando Mercado Pago reporta `cancelled`, el webhook asigna `subscriptions.status = 'cancelled'`. La función SQL `is_pro_user` exige `s.status in ('active', 'trialing')`.
  - **Impacto:** Si un usuario cancela la renovación automática a mitad de su mes facturado, pierde acceso Pro de inmediato, en lugar de conservarlo hasta la fecha estipulada en `current_period_end`.

---

## 6. Inconsistencias Detectadas

### 6.1 Inconsistencias en el Catálogo de Features de Supabase
- La tabla [`features`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/002_plans_features.sql) contiene registros para `generador-presupuestos`, pero **no tiene registrado el slug `generador-documentos-comerciales`**.
- Dado que [`is_feature_premium`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/004_helper_functions.sql#L38-L47) devuelve `false` si el feature no está mapeado para ese slug específico, cualquier consulta directa a esta función SQL sobre `generador-documentos-comerciales` indicaría falsamente que todas sus funciones son gratuitas (a pesar de que sus Server Actions sí exigen Pro).
- No existen features mapeadas en la base de datos para `generador-qr`.

### 6.2 Discrepancias de Tipado TypeScript en Compilación
La ejecución de `tsc --noEmit` reveló los siguientes errores en archivos activos:
1. **Conflicto de interfaz en productos comerciales:**
   - [`src/components/tools/generador-facturas/types.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/generador-facturas/types.ts) define `defaultDiscount?: number`.
   - [`src/app/actions/commercial-documents.ts:287`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts#L287) y [`useDocumentState.ts:476`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/generador-facturas/useDocumentState.ts#L476) intentan leer `defaultDiscountPercent`.
2. **Discordancia en comparador de formatos de imagen:**
   - [`src/components/tools/compresor-imagenes/GlobalConfigPanel.tsx:70`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/compresor-imagenes/GlobalConfigPanel.tsx#L70) compara el tipo `"png" | "webp" | "original"` con `"jpeg"`.
3. **Firmas de eventos en GeneradorFacturasTool:**
   - [`GeneradorFacturasTool.tsx:734`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/generador-facturas/GeneradorFacturasTool.tsx#L734) pasa una función tipada con `keyof CommercialDocument` a una prop que espera `field: string`.
4. **Archivo residual en raíz:**
   - El archivo [`old_nav.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/old_nav.tsx) en la raíz del repositorio genera error de importación faltante (`./CommandSearch`).

---

## 7. Plan de Acción y Tareas Pendientes Priorizadas

### Prioridad 1: Seguridad y Control de Acceso (Inmediato)
1. **Blindar `generateQrCodes` en el servidor:**
   - Incorporar `isProUser(user.id)` en [`src/app/actions/qr.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/qr.ts).
   - Actualizar la política RLS de inserción en `public.qr_codes` para exigir `public.is_pro_user(auth.uid())`.
2. **Corregir período de gracia en cancelación de suscripción:**
   - Modificar la función [`is_pro_user`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/004_helper_functions.sql) para que, si el estado es `cancelled`, mantenga Pro válido mientras `current_period_end > now()`.

### Prioridad 2: Consistencia de Catálogo y Datos (Corto Plazo)
1. **Homogeneizar `tool_features` en Supabase:**
   - Registrar formalmente los features para `generador-documentos-comerciales` y `generador-qr` en las tablas `features` y `tool_features`.
2. **Resolver tipado TypeScript:**
   - Unificar `defaultDiscount` en `commercial-documents.ts` y `useDocumentState.ts`.
   - Corregir el selector de formato en `GlobalConfigPanel.tsx`.
   - Eliminar o archivar el archivo obsoleto [`old_nav.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/old_nav.tsx).

### Prioridad 3: Limpieza y Experiencia de Usuario (Medio Plazo)
1. **Depurar componentes huérfanos:**
   - Eliminar [`src/components/tools/GeneradorPresupuestos.tsx`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/GeneradorPresupuestos.tsx) ya que ambas herramientas comerciales convergen de forma limpia en `GeneradorFacturasTool`.
2. **Reemplazo de Control de Stock:**
   - Control de stock fue retirado del catálogo para dar lugar a una nueva herramienta solicitada por el dueño.

---

## 8. Propuesta de Catálogo Comercial Definitivo

```
+---------------------------------------------------------------------------------------------------+
|                           MATRIZ RECOMENDADA DE CATÁLOGO PLAYCOMUN                                |
+---------------------------------------------------------------------------------------------------+
| MODALIDAD COMERCIAL       | HERRAMIENTAS INCLUIDAS                 | REGLA GENERAL DE ACCESO      |
+---------------------------+----------------------------------------+------------------------------+
| 1. TOTALMENTE GRATIS      | • Calculadora de precios               | Operaciones de cálculo local,|
|    (Sin registro previo)  | • Calculadora de IVA                   | utilidades de navegador,     |
|                           | • Calculadora de rentabilidad          | sin costos de infraestructura|
|                           | • Calculadora de 1RM                   | recurrentes en la nube.      |
|                           | • Conversor de unidades                |                              |
|                           | • Calculadora de aguinaldo             |                              |
|                           | • Calculadora de cuotas                |                              |
|                           | • Calculadora de calorías              |                              |
|                           | • Link de reseñas de Google            |                              |
|                           | • Compresor de imágenes                |                              |
|                           | • Ordenar PDF                          |                              |
|                           | • Cortador de audio                    |                              |
+---------------------------+----------------------------------------+------------------------------+
| 2. GRATIS CON NUBE PRO    | • Costo de receta                      | Modo básico libre ilimitado. |
|    (Híbridas con valor    | • Control de gastos                    | Funciones Pro de guardado    |
|    agregado de negocio)   | • Documentos comerciales y presupuestos| multi-dispositivo, agenda de |
|                           | • Generador de listas de precios       | clientes, catálogo de ítems, |
|                           | • Generador de QR                      | marca blanca y sincronización|
|                           | • Convertidor de archivos              | nube con retención perpetua. |
+---------------------------+----------------------------------------+------------------------------+
```

---

## 9. Evidencias Técnicas

### 9.1 Pruebas Automatizadas Ejecutadas (Vitest)
```bash
 RUN  v5.0.3 J:/PROYECTOS/PlaycomunMicroApps

 ✓ src/lib/costo-receta.test.ts (10 tests)
 ✓ src/lib/precio-venta.test.ts (8 tests)
 ✓ src/lib/aguinaldo.test.ts (7 tests)
 ✓ src/lib/audio-cutter/audio-cutter.test.ts (8 tests)
 ✓ src/lib/costo-receta-pro.test.ts (7 tests)
 ✓ src/lib/control-gastos.test.ts (16 tests)
 ✓ src/lib/control-gastos-pro.test.ts (11 tests)
 ✓ src/lib/price-lists.test.ts (7 tests)
 ✓ src/lib/converter/quota-engine.test.ts (18 tests)
 ✓ src/lib/pdf-editor/pdf-editor.test.ts (5 tests)
 ✓ src/lib/converter/converter.test.ts (12 tests)
 ✓ src/components/tools/generador-facturas/__tests__/commercial-documents.test.ts (20 tests)

 Test Files  12 passed (12)
      Tests  129 passed (129)
   Duration  1.25s
```

### 9.2 Archivos y Referencias Clave Inspeccionadas
- **Autenticación y Helpers Pro:** [`src/lib/pro.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/lib/pro.ts), [`supabase/migrations/004_helper_functions.sql`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/004_helper_functions.sql).
- **Control de Cuotas del Convertidor:** [`src/lib/converter/quota-service.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/lib/converter/quota-service.ts), [`supabase/migrations/20261016030000_conversion_quotas_pro.sql`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016030000_conversion_quotas_pro.sql).
- **Preservación en Costo de Receta:** [`src/app/actions/recipes.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/recipes.ts), [`supabase/migrations/20261016000000_recipes_pro_permissions.sql`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016000000_recipes_pro_permissions.sql).
- **Preservación en Control de Gastos:** [`src/app/actions/expenses.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/expenses.ts), [`supabase/migrations/20261016020000_control_gastos_pro.sql`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016020000_control_gastos_pro.sql).
- **Preservación en Listas de Precios:** [`src/app/actions/price-lists.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/price-lists.ts), [`supabase/migrations/20261016010000_price_lists_pro.sql`](file:///j:/PROYECTOS/PlaycomunMicroApps/supabase/migrations/20261016010000_price_lists_pro.sql).
- **Documentos Comerciales y Marca de Agua:** [`src/app/actions/commercial-documents.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/commercial-documents.ts), [`src/components/tools/generador-facturas/pdfGenerator.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/components/tools/generador-facturas/pdfGenerator.ts#L562-L578).
- **Webhook e Idempotencia Mercado Pago:** [`src/app/api/webhooks/mercadopago/route.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/webhooks/mercadopago/route.ts), [`src/app/api/subscriptions/sync/route.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/api/subscriptions/sync/route.ts).

---

## 10. Decisiones Definidas vs. Pendientes de Aprobación

### Decisiones Ya Definidas y Consolidadas en Código:
1. **Regla de No Eliminación:** Los datos en la nube jamás se borran por vencimiento o cancelación de suscripción.
2. **Cuota 5/100 del Convertidor:** 5 diarias para Gratis y 100 para Pro con reinicio a medianoche argentina (`America/Argentina/Buenos_Aires`), aplicando únicamente a documentos de oficina procesados en el worker.
3. **Conversiones locales sin costo ni cuota:** Manipulaciones de PDF locales, extracción y compresiones en navegador no consumen cuota.
4. **Persistencia física del QR:** El acceso público de redirección en `/q/[token]` no se interrumpe por vencimiento de suscripción para proteger material ya impreso.

### Decisiones que Requieren Aprobación:
1. **Blindaje de la Server Action del Generador QR:** Confirmar la aplicación inmediata de la restricción Pro en [`src/app/actions/qr.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/actions/qr.ts) para evitar la creación no autorizada de QR dinámicos por usuarios gratuitos.
2. **Política de Período de Gracia en Cancelaciones:** Confirmar que ante una cancelación voluntaria en Mercado Pago, el usuario mantenga el beneficio Pro hasta cumplir la fecha `current_period_end`.
3. **Mapeo Formal de Slugs en Supabase:** Registrar `generador-documentos-comerciales` y `generador-qr` en `tool_features` para evitar inconsistencias con `is_feature_premium()`.
