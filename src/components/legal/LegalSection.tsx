import { ReactNode } from "react"

interface LegalSectionProps {
  id: string
  number: number
  title: string
  children: ReactNode
}

export function LegalSection({
  id,
  number,
  title,
  children,
}: LegalSectionProps) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className="scroll-mt-24 pt-8 first:pt-0 border-t first:border-t-0 border-slate-200/80 outline-none space-y-4"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="w-7 h-7 mt-0.5 rounded-lg bg-purple-100 text-purple-800 text-sm flex items-center justify-center font-bold flex-shrink-0"
        >
          {number}
        </span>
        <span className="leading-snug">{title}</span>
      </h2>
      <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed pl-0 sm:pl-10">
        {children}
      </div>
    </section>
  )
}
