'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard } from 'lucide-react'

interface AccountNavProps {
  isPro?: boolean
}

export function AccountNav({ isPro }: AccountNavProps) {
  const pathname = usePathname()

  const tabs = [
    {
      label: 'Mi Perfil',
      href: '/cuenta',
      active: pathname === '/cuenta',
      icon: User,
    },
    {
      label: 'Suscripción y Pagos',
      href: '/cuenta/suscripcion',
      active: pathname === '/cuenta/suscripcion',
      icon: CreditCard,
    },
  ]

  return (
    <nav className="flex items-center justify-between border-b border-slate-200/80 mb-8 pb-3">
      <div className="flex items-center gap-1 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                tab.active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="hidden sm:flex items-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isPro
              ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPro ? 'bg-purple-600' : 'bg-slate-400'
            }`}
          />
          {isPro ? 'Plan Pro Activo' : 'Plan Gratuito'}
        </span>
      </div>
    </nav>
  )
}
