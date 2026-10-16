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
