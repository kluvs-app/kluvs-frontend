import { createClient, type FunctionInvokeOptions, FunctionsHttpError } from '@supabase/supabase-js'

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
  const result = await supabase.functions.invoke<T>(name, options)

  // On 401, force a fresh token and retry once. Handles the brief window
  // between tab focus and the background session refresh completing.
  if (result.error instanceof FunctionsHttpError && result.error.context?.status === 401) {
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (!refreshError) {
      return supabase.functions.invoke<T>(name, options)
    }
  }

  // Supabase wraps all non-2xx responses as FunctionsHttpError with the generic
  // message "Edge Function returned a non2xx status code". Unwrap the actual
  // backend error body ({ success: false, error: "..." }) so callers see the
  // real message (e.g. "Already a member", "Invalid or expired invite").
  if (result.error instanceof FunctionsHttpError) {
    try {
      const body = await result.error.context.json()
      if (body?.error) {
        return { data: null, error: new Error(body.error) }
      }
    } catch { /* parse failed — fall through and return the original error */ }
  }

  return result
}

export function getAvatarUrl(avatarPath: string): string {
  const { data } = supabase.storage.from('member-avatars').getPublicUrl(avatarPath)
  return data.publicUrl
}
