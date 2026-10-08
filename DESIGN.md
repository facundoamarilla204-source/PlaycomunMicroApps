# Design Direction

## Identity & Personality
PlayComun Online es una plataforma de herramientas simples y ágiles diseñadas para emprendedores, trabajadores independientes y pequeños comercios. 
La personalidad es **clara, directa y amigable** (hablando de persona a persona en español argentino), evitando completamente el tono corporativo o técnico. Todo debe transmitir confianza, simplicidad y eficiencia: "La persona primero, luego la pantalla".

## Audience
- Emprendedores y trabajadores independientes.
- Pequeños comercios y cuentapropistas.
- Usuarios particulares para cálculos y tareas puntuales.
- Buscan inmediatez, herramientas que carguen y resuelvan en segundos sin requerir aprender un software complejo, en su gran mayoría desde el teléfono móvil (Mobile-first estricto).

## Visual Language
- **Estilo:** Estructural, moderno, profesional y limpio. La información manda, guiada por el espaciado generoso y la jerarquía visual sólida. 
- **Lo que NO es:** Cero aspecto a "plantilla" o producto de IA por defecto. No abusar de sombras (box-shadows excesivos), no redondear en extremo (border-radius) ni usar gradientes decorativos.

## Typography
- **Fuente Principal:** Sora
- La tipografía debe asegurar una legibilidad impecable tanto en títulos (aportando personalidad moderna) como en los datos duros (números, precios, cálculos).

## Color Palette
- **Fondo:** Blanco limpio, evitando los grises oscuros de fondo en modo claro.
- **Color Principal (Acento):** Violeta `#7C3AED` (usado estratégicamente para llamados a la acción y jerarquía).
- **Variantes del Principal:** Tonos derivados del violeta para estados o agrupaciones (hover, focus, tags).
- **Texto:** Oscuro puro (ej. `#111827` o `#1F2937`) para máxima legibilidad.
- **Neutros:** Escala de grises estructurada para bordes, textos secundarios y separadores. No usar colores genéricos si compiten con la jerarquía.

## Dials
- **ENERGY (1-5):** 3 - El foco está en la productividad. Es dinámico al responder, pero sin abrumar visualmente.
- **RHYTHM (1-5):** 2 - Consistencia y predictibilidad son claves. El usuario debe sentir que la herramienta es sólida y familiar en cada paso, las variaciones extremas distraen de la tarea (ej. ingresar un gasto).
- **MOTION (1-5):** 2 - Animaciones muy sutiles y funcionales (feedback de botones, aparición de modales, loading states), sin transiciones pesadas o cinematográficas.

## Functional Principles
1. **Verdad funcional:** Todo botón, enlace o interacción hace algo real. Cero funciones de humo o datos ficticios simulados.
2. **Estados UI completos:** Toda tabla, lista o formulario contempla diseño de estado "vacío", "cargando" y "error".
3. **Gratis / Pro claro:** Las funciones gratuitas fluyen sin interrupciones; el pase a "Pro" debe ser una mejora real de valor, no una trampa de interfaz.
