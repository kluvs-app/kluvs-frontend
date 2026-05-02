import { createClient } from '@supabase/supabase-js'

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

export function getAvatarUrl(avatarPath: string): string {
  const { data } = supabase.storage.from('member-avatars').getPublicUrl(avatarPath)
  return data.publicUrl
}
