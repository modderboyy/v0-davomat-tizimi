// Environment variable helper
export const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured = !!supabaseUrl && !!supabaseAnonKey

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured,
  }
}
