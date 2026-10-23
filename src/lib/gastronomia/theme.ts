/**
 * Amasia Design System Tokens & Component Classes
 * 
 * Reglas de diseño e ingeniería visual:
 * - antislop & antislop-ui: Cero gradientes arbitrarios sin propósito, jerarquía clara, accesibilidad WCAG AA.
 * - emil-design-eng: Min-height 44px para targets táctiles, active:scale-[0.98], transiciones snappy cubic-bezier.
 * - Paleta oficial:
 *     Primario / Marca: #7F22FE (hover: #6C1CE0, active: #5B14C4)
 *     Superficies / Tarjetas: #FFFFFF (border-slate-200/90)
 *     Fondo general: #FAFCFD (bg-slate-50/70)
 *     Tinte de acento sutil: bg-violet-50 text-violet-900 border-violet-200/80
 * - Tipografía: Work Sans (font-sans) en toda la interfaz funcional.
 */

export const AMASIA_PALETTE = {
  brand: '#7F22FE',
  brandHover: '#6C1CE0',
  brandActive: '#5B14C4',
  brandLight: '#F5F0FF',
  brandBorder: '#DDD6FE',
  surface: '#FFFFFF',
  background: '#FAFCFD',
} as const

export const amasiaClasses = {
  // --- Botones (Jerarquía oficial Emil Kowalski) ---
  button: {
    base: 'inline-flex items-center justify-center gap-2 font-semibold text-xs rounded-xl min-h-[44px] px-4 py-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    primary:
      'bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] text-white shadow-xs focus-visible:ring-[#7f22fe]/40',
    soft:
      'bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200/80 focus-visible:ring-[#7f22fe]/30',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs focus-visible:ring-slate-400',
    destructive:
      'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200/80 hover:border-rose-300 focus-visible:ring-rose-400',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 min-h-[38px] px-3 py-1.5 focus-visible:ring-slate-400 active:scale-[0.95]',
  },

  // --- Tarjetas y Contenedores ---
  card: {
    base: 'bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs',
    interactive:
      'bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-violet-200/80 hover:shadow-sm transition-all',
    subtle:
      'bg-slate-50/60 rounded-xl border border-slate-200/80 p-4',
  },

  // --- Campos de Formulario ---
  input: {
    base: 'w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-[#7f22fe] focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 min-h-[44px] transition-colors',
    select:
      'w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 shadow-xs focus:border-[#7f22fe] focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 min-h-[44px] transition-colors cursor-pointer',
    label:
      'block text-xs font-semibold text-slate-700 mb-1.5',
    helper:
      'text-[11px] text-slate-500 mt-1',
  },

  // --- Badges y Estados ---
  badge: {
    base: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
    brand:
      'bg-violet-50 text-violet-900 border-violet-200/80',
    success:
      'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200/70',
    danger:
      'bg-rose-50 text-rose-800 border-rose-200/70',
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200/80',
  },

  // --- Mensajes y Banners Informativos ---
  alert: {
    base: 'rounded-xl p-4 border text-xs sm:text-sm flex items-start gap-3',
    info: 'bg-violet-50/70 border-violet-200/80 text-violet-950',
    success: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950',
    warning: 'bg-amber-50/70 border-amber-200/80 text-amber-950',
    error: 'bg-rose-50/70 border-rose-200/80 text-rose-950',
  },

  // --- Tipografía ---
  typography: {
    pageTitle: 'text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans',
    sectionTitle: 'text-base sm:text-lg font-bold text-slate-900 tracking-tight font-sans',
    cardTitle: 'text-sm sm:text-base font-bold text-slate-900 font-sans',
    body: 'text-xs sm:text-sm text-slate-600 font-sans',
    caption: 'text-xs text-slate-500 font-sans',
    kicker: 'text-xs font-bold text-[#7f22fe] uppercase tracking-wider font-sans',
  },
} as const
