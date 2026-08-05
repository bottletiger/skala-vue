import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

const hasValidUrl = (() => {
  if (!supabaseUrl) return false

  try {
    const parsed = new URL(supabaseUrl)
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  } catch {
    return false
  }
})()

export const isSupabaseConfigured = Boolean(hasValidUrl && supabasePublishableKey)

export const supabaseConfig = Object.freeze({
  url: supabaseUrl,
  isConfigured: isSupabaseConfigured,
})

export class ServiceNotConfiguredError extends Error {
  constructor(message = 'Supabase 환경 변수가 설정되지 않았습니다.') {
    super(message)
    this.name = 'ServiceNotConfiguredError'
    this.code = 'SERVICE_NOT_CONFIGURED'
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'skala-weather-auth',
      },
    })
  : null

export function getSupabaseClient() {
  return supabase
}

export function requireSupabaseClient() {
  if (!supabase) throw new ServiceNotConfiguredError()
  return supabase
}
