'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/ingresar?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/cuenta')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const terms = formData.get('terms') as string

  if (password !== confirmPassword) {
    redirect('/registro?error=Las+contraseñas+no+coinciden')
  }

  if (terms !== 'on') {
    redirect('/registro?error=Debés+aceptar+los+términos+y+condiciones')
  }

  if (password.length < 6) {
    redirect('/registro?error=La+contraseña+debe+tener+al+menos+6+caracteres')
  }

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/registro?error=${encodeURIComponent(error.message)}`)
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

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/ingresar')
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
