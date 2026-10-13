"use client"

import { useFormStatus } from "react-dom"

export function SubmitButton({ 
  children, 
  pendingText = "Cargando..." 
}: { 
  children: React.ReactNode
  pendingText?: string 
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm mt-3 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-h-[46px] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {pendingText}
        </span>
      ) : children}
    </button>
  )
}
