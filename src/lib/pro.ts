import { createClient } from '@/utils/supabase/server'

export async function isProUser(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('is_pro_user', { check_user_id: userId })
  
  if (error) {
    console.error('Error checking pro status:', error)
    return false
  }
  
  return !!data
}

export async function getCurrentUserProStatusServer(): Promise<{
  isAuthenticated: boolean
  isPro: boolean
  userId: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { isAuthenticated: false, isPro: false, userId: null }
  }
  const isPro = await isProUser(user.id)
  return { isAuthenticated: true, isPro, userId: user.id }
}

export async function isFeaturePremium(toolSlug: string, featureCode: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('is_feature_premium', { 
    p_tool_slug: toolSlug, 
    p_feature_code: featureCode 
  })
  
  if (error) {
    console.error('Error checking feature premium status:', error)
    return false // Fallback
  }
  
  return !!data
}

export async function canAccessFeature(userId: string | null, toolSlug: string, featureCode: string): Promise<boolean> {
  const supabase = await createClient()
  
  if (!userId) {
    const isPremium = await isFeaturePremium(toolSlug, featureCode)
    return !isPremium // Unauthenticated users can only access free features
  }
  
  const { data, error } = await supabase.rpc('can_access_feature', { 
    check_user_id: userId,
    p_tool_slug: toolSlug,
    p_feature_code: featureCode
  })
  
  if (error) {
    console.error('Error checking feature access:', error)
    return false
  }
  
  return !!data
}

export type ToolFeatureAccess = {
  feature_code: string;
  feature_name: string;
  is_premium: boolean;
  has_access: boolean;
}

export interface EffectiveSubscription {
  id: string
  status: 'active' | 'trialing' | 'past_due' | 'paused' | 'cancelled' | 'expired'
  provider: string | null
  provider_status: string | null
  provider_subscription_id: string | null
  started_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_start_at: string | null
  trial_end_at: string | null
  cancelled_at: string | null
  created_at: string
  plans: {
    id: string
    name: string
    code: string
    price: number | string
    currency: string
    billing_interval: string
  } | null
}

/**
 * Obtiene la suscripción Pro efectiva del usuario respetando el ciclo de facturación real,
 * períodos de gracia y exclusión de registros foráneos o archivados.
 * Si el usuario es gratuito o sus suscripciones finalizaron, devuelve null.
 */
export async function getUserEffectiveSubscription(
  supabase: any,
  userId: string
): Promise<EffectiveSubscription | null> {
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      provider,
      provider_status,
      provider_subscription_id,
      started_at,
      current_period_start,
      current_period_end,
      trial_start_at,
      trial_end_at,
      cancelled_at,
      created_at,
      is_archived,
      plans(
        id,
        name,
        code,
        price,
        currency,
        billing_interval
      )
    `)
    .eq('user_id', userId)
    .eq('is_archived', false)

  if (error || !subs || subs.length === 0) {
    return null
  }

  // Filtrar exclusivamente planes pertenecientes a PlayComun Pro
  const proSubs = subs.filter(
    (s: any) =>
      s.plans?.code === 'pro_monthly' || s.plans?.code === 'pro_yearly'
  )

  if (proSubs.length === 0) return null

  const now = Date.now()

  // 1. Suscripción activa y vigente con renovación confirmada (o sin límite fijado)
  const activeSub = proSubs.find(
    (s: any) =>
      s.status === 'active' &&
      !['refunded', 'charged_back'].includes(s.provider_status || '') &&
      (!s.current_period_end || new Date(s.current_period_end).getTime() > now)
  )
  if (activeSub) return activeSub

  // 2. Renovación cancelada pero con período pagado aún en curso
  const cancelledWithAccess = proSubs.find(
    (s: any) =>
      s.status === 'cancelled' &&
      !['refunded', 'charged_back'].includes(s.provider_status || '') &&
      s.current_period_end &&
      new Date(s.current_period_end).getTime() > now
  )
  if (cancelledWithAccess) return cancelledWithAccess

  // 3. Período de gracia por pago fallido (past_due 3 días)
  const pastDueGraceSub = proSubs.find((s: any) => {
    if (s.status !== 'past_due') return false
    if (['refunded', 'charged_back'].includes(s.provider_status || '')) return false
    const referenceDate = s.current_period_end || s.updated_at || s.created_at
    if (!referenceDate) return false
    const graceExpiry = new Date(referenceDate).getTime() + 3 * 24 * 60 * 60 * 1000
    return graceExpiry > now
  })
  if (pastDueGraceSub) return pastDueGraceSub

  // 4. Período de prueba promocional vigente
  const trialingSub = proSubs.find(
    (s: any) =>
      s.status === 'trialing' &&
      !['refunded', 'charged_back'].includes(s.provider_status || '') &&
      (s.trial_end_at || s.current_period_end) &&
      new Date(s.trial_end_at || s.current_period_end).getTime() > now
  )
  if (trialingSub) return trialingSub

  // 5. Suscripción reciente pendiente de confirmación (< 24 horas desde su creación)
  const pendingRecentSub = proSubs.find(
    (s: any) =>
      ['pending', 'trialing'].includes(s.status) &&
      ['pending', 'in_process'].includes(s.provider_status || 'pending') &&
      s.created_at &&
      now - new Date(s.created_at).getTime() < 24 * 60 * 60 * 1000
  )
  if (pendingRecentSub) return pendingRecentSub

  // Si todas las suscripciones están vencidas, canceladas pasadas o pendientes sin cobro:
  // El usuario está en el plan gratuito.
  return null
}

export async function getToolFeaturesWithAccess(userId: string | null, toolSlug: string): Promise<ToolFeatureAccess[]> {
  const supabase = await createClient()
  
  // Use a dummy UUID for unauthenticated users so the RPC function doesn't fail
  // The RPC will correctly evaluate is_pro_user to false for this UUID
  const actualUserId = userId || '00000000-0000-0000-0000-000000000000' 
  
  const { data, error } = await supabase.rpc('get_tool_features_with_access', { 
    check_user_id: actualUserId,
    p_tool_slug: toolSlug
  })
  
  if (error) {
    console.error('Error getting tool features:', error)
    return []
  }
  
  return data as ToolFeatureAccess[]
}

