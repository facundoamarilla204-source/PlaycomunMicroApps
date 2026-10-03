'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFavorite(toolSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  // Check if it's already a favorite
  const { data: existing } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .eq('tool_slug', toolSlug)
    .single()

  let opError = null

  if (existing) {
    // Remove it
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    opError = error
  } else {
    // Add it
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, tool_slug: toolSlug })
    opError = error
  }

  if (opError) {
    return { error: 'Error al guardar favorita. Verifique que la tabla exista.' }
  }

  // Revalidate pages that might show favorites
  revalidatePath('/')
  revalidatePath('/favoritas')
  revalidatePath('/cuenta')
  revalidatePath('/herramientas')
  revalidatePath(`/herramientas/${toolSlug}`)
  
  return { success: true }
}
