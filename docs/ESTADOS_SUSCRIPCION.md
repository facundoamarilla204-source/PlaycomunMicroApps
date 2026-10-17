# Ciclo de Vida y Estados de Suscripción en PlayComun

Este documento describe la especificación formal y el comportamiento técnico de cada estado de suscripción en **PlayComun**, las políticas de acceso a **PlayComun Pro**, la gestión de cobros fallidos mediante **Período de Gracia**, y las reglas de protección contra fraudes y cancelaciones.

---

## 1. Catálogo de Estados y Efecto en Acceso Pro

| Estado (`status`) | Descripción Comercial | Acceso Pro | Período de Gracia | Efecto de Negocio y Comportamiento del Sistema |
| :--- | :--- | :---: | :---: | :--- |
| **`active`** | Suscripción Activa | **SÍ** | No aplica | Débito periódico al día. Acceso total e ilimitado a todas las herramientas y capacidades Pro. |
| **`trialing`** | Período de Prueba | **SÍ** | No aplica | Prueba de bienvenida o validación inicial de medio de pago en curso. Acceso Pro completo mientras no expire `current_period_end`. |
| **`past_due`** | Cobro Fallido / En Mora | **SÍ (Temporal)** | **SÍ (3 días por defecto)** | Mercado Pago rechazó el cobro automático recurrente (fondos insuficientes transitorios o tarjeta denegada). El sistema activa un **período de gracia corto y configurable** para permitir reintentos automáticos del emisor sin cortar la operatoria diaria del usuario. Si expira la gracia sin regularización, el acceso Pro se suspende automáticamente. |
| **`paused`** | Pausada | **NO** | No aplica | Suspensión voluntaria o administrativa temporal del débito. El acceso Pro se **revoca de forma inmediata**. Todos los datos y configuraciones guardados se conservan intactos. Al reanudar, se reactiva a `active`. |
| **`cancelled`** | Cancelación Voluntaria | **SÍ (Hasta fin de período)** | No aplica | El usuario desactiva la renovación automática para que no se debiten futuras cuotas. El acceso a PlayComun Pro se **mantiene activo hasta que expire `current_period_end`** (respeto irrestricto del período ya abonado). Llegada la fecha, se da por finalizada sin nuevos cargos. |
| **`expired`** | Suscripción Expirada | **NO** | No aplica | Concluyó el período abonado y cualquier gracia previa. La cuenta pasa a operar en modo Gratuito con todas las herramientas libres. |

---

## 2. Período de Gracia para Pagos Fallidos (`past_due`)

### Objetivo
Evitar interrupciones imprevistas en los flujos de trabajo de profesionales y comercios cuando un cobro recurrente es rechazado de forma temporal por el procesador de pagos.

### Configuración
- **Variable de Entorno:** `SUBSCRIPTION_GRACE_PERIOD_DAYS`
- **Valor Canónico por Defecto:** `3` días.
- **Archivo de Configuración:** [`src/config/subscription.ts`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/config/subscription.ts)

### Lógica de Evaluación en Base de Datos (`is_pro_user`)
La función de seguridad de Supabase evalúa:
```sql
(s.status = 'past_due' AND (COALESCE(s.current_period_end, s.updated_at, s.created_at) + interval '3 days') > now())
```
Durante este lapso:
1. El usuario puede seguir emitiendo documentos comerciales, accediendo a sus recetas, listas de precios y grupos QR.
2. En la sección de cuenta ([`/cuenta/suscripcion`](file:///j:/PROYECTOS/PlaycomunMicroApps/src/app/(dashboard)/cuenta/suscripcion/SuscripcionClient.tsx)), se muestra una alerta visual advirtiendo que el cobro automático no pudo concretarse y ofreciendo el botón para sincronizar o regularizar en Mercado Pago.
3. Una vez transcurridos los 3 días desde el vencimiento sin registrar un pago `approved`, la función `is_pro_user` devuelve `false` y las políticas de RLS bloquean las mutaciones y lecturas Pro.

---

## 3. Reglas Especiales de Revocación y Protección de Datos

### Reembolsos y Contracargos (`refunded`, `charged_back`)
Ante cualquier notificación confirmada de devolución voluntaria o disputa de contracargo:
- El acceso Pro se **revoca de manera inmediata e incondicional**, independientemente de la fecha registrada en `current_period_end`.
- La función `is_pro_user` filtra expresamente:
  `AND (s.provider_status IS NULL OR s.provider_status NOT IN ('refunded', 'charged_back'))`

### Preservación Perpetua de Datos
Cuando una suscripción pasa a `expired` o `paused`:
- **Ningún dato es eliminado:** Documentos guardados, clientes, productos, recetas, costos, movimientos de gastos y tandas de códigos QR impresos permanecen protegidos en Supabase.
- **Resolución Pública de QR:** Los códigos QR dinámicos impresos en material físico continúan resolviendo y redirigiendo normalmente a su destino sin interrupción.
- Al contratar o reactivar Pro nuevamente, el usuario recupera acceso inmediato a la totalidad de su historial.
