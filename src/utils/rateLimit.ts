import { SupabaseClient } from "@supabase/supabase-js";

export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  action: string,
  limit: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const { count, error } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if (error) throw error;

  const currentCount = count || 0;
  
  if (currentCount >= limit) {
    // Determine wait time roughly
    const { data: oldest } = await supabase
      .from("rate_limits")
      .select("created_at")
      .eq("identifier", identifier)
      .eq("action", action)
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: true })
      .limit(1);
      
    let retryAfter = windowMinutes * 60;
    if (oldest && oldest.length > 0) {
      const oldestTime = new Date(oldest[0].created_at).getTime();
      const resetTime = oldestTime + windowMinutes * 60 * 1000;
      retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    }
    
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
  }

  // Record action
  await supabase.from("rate_limits").insert({ identifier, action });

  return { allowed: true, remaining: limit - currentCount - 1 };
}
