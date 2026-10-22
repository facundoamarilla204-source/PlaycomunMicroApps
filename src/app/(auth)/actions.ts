'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

function getSafeRedirectUrl(target: string | null | undefined, fallback = '/cuenta'): string {
  if (!target || typeof target !== 'string') return fallback
  const trimmed = target.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed
  }
  return fallback
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const redirectTo = formData.get('redirectTo') as string | null

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const params = new URLSearchParams()
    params.set('error', error.message)
    if (redirectTo) {
      params.set('redirect', redirectTo)
    }
    redirect(`/ingresar?${params.toString()}`)
  }

  revalidatePath('/', 'layout')
  const destination = getSafeRedirectUrl(redirectTo, '/cuenta')
  redirect(destination)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const terms = formData.get('terms') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const buildErrorRedirect = (msg: string) => {
    const params = new URLSearchParams()
    params.set('error', msg)
    if (redirectTo) params.set('redirect', redirectTo)
    return `/registro?${params.toString()}`
  }

  if (password !== confirmPassword) {
    redirect(buildErrorRedirect('Las contraseñas no coinciden'))
  }

  if (terms !== 'on') {
    redirect(buildErrorRedirect('Debés aceptar los términos y condiciones'))
  }

  if (password.length < 6) {
    redirect(buildErrorRedirect('La contraseña debe tener al menos 6 caracteres'))
  }

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(buildErrorRedirect(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/verificar-email')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback?next=/recuperar/nueva`,
  })

  if (error) {
    redirect('/recuperar?error=Error+al+enviar+enlace')
  }

  redirect('/verificar-email?type=reset')
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const callbackUrl = new URL('/api/auth/callback', siteUrl)
  if (redirectTo) {
    const safeNext = getSafeRedirectUrl(redirectTo, '/cuenta')
    callbackUrl.searchParams.set('next', safeNext)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  })

  if (data?.url) {
    redirect(data.url)
  }
}

export async function logout(formData?: FormData) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')

  let rawTarget = (formData?.get('redirectTo') as string) || null

  if (!rawTarget) {
    try {
      const headerList = await headers()
      const referer = headerList.get('referer')
      if (referer) {
        const url = new URL(referer)
        rawTarget = url.pathname + url.search
      }
    } catch {
      // ignore
    }
  }

  const destination = getSafeRedirectUrl(rawTarget, '/')
  const isExcluded =
    destination.startsWith('/cuenta') ||
    destination.startsWith('/favoritas') ||
    destination.startsWith('/ingresar') ||
    destination.startsWith('/registro')

  const finalUrl = isExcluded ? '/' : destination
  redirect(finalUrl)
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    redirect('/cuenta?error=El+nombre+es+requerido')
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: name.trim() }
  })

  if (error) {
    redirect(`/cuenta?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/cuenta?success=Perfil+actualizado+correctamente')
}
