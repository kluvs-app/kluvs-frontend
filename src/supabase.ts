import { createClient, type FunctionInvokeOptions } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Persist session in localStorage (default, but explicit is better)
    storage: window.localStorage,
    // Auto refresh tokens before they expire
    autoRefreshToken: true,
    // Persist the session across browser sessions
    persistSession: true,
    // Detect session in URL and store it
    detectSessionInUrl: true,
  }
})

// Always refresh the session before invoking an edge function.
// Supabase's auto-refresh timer can miss its window when the tab is
// backgrounded, leaving an expired JWT in memory. getSession() silently
// exchanges the refresh token for a new one before every call.
export async function invokeFunction<T = unknown>(
  name: string,
  options?: FunctionInvokeOptions
): Promise<{ data: T | null; error: Error | null }> {
  await supabase.auth.getSession()
  return supabase.functions.invoke<T>(name, options)
}

export function getAvatarUrl(avatarPath: string): string {
  const { data } = supabase.storage.from('member-avatars').getPublicUrl(avatarPath)
  return data.publicUrl
}
