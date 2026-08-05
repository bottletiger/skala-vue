import {
  getSupabaseClient,
  isSupabaseConfigured,
  requireSupabaseClient,
  ServiceNotConfiguredError,
} from '@/lib/supabaseClient.js'

const AUTH_ERROR_MESSAGES = Object.freeze({
  email_address_invalid: '이메일 주소 형식을 확인해 주세요.',
  email_not_confirmed: '이메일 인증을 완료한 뒤 로그인해 주세요.',
  invalid_credentials: '이메일 또는 비밀번호가 맞지 않습니다.',
  over_request_rate_limit: '로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  session_expired: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  signup_disabled: '현재 새 계정을 만들 수 없습니다.',
  user_already_exists: '이미 가입된 이메일입니다.',
  user_not_found: '계정을 찾을 수 없습니다.',
  weak_password: '더 안전한 비밀번호를 입력해 주세요.',
})

function serviceError(error, fallbackMessage) {
  if (error instanceof ServiceNotConfiguredError) return error

  const code = error?.code || 'AUTH_ERROR'
  const message = AUTH_ERROR_MESSAGES[code] || (error?.status === 429 ? AUTH_ERROR_MESSAGES.over_request_rate_limit : fallbackMessage)
  const normalized = new Error(message)
  normalized.name = 'AuthServiceError'
  normalized.code = code
  normalized.status = error?.status
  return normalized
}

function credentialsFrom(emailOrCredentials, password) {
  if (typeof emailOrCredentials === 'object' && emailOrCredentials) {
    return {
      email: String(emailOrCredentials.email || '').trim(),
      password: String(emailOrCredentials.password || ''),
    }
  }

  return {
    email: String(emailOrCredentials || '').trim(),
    password: String(password || ''),
  }
}

export const isAuthConfigured = () => isSupabaseConfigured
export const isConfigured = isAuthConfigured

export async function getCurrentSession() {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client.auth.getSession()
  if (error) throw serviceError(error, '로그인 세션을 확인하지 못했습니다.')
  return data.session
}

export async function getCurrentUser() {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client.auth.getUser()
  if (error) {
    if (error.status === 401 || error.name === 'AuthSessionMissingError') return null
    throw serviceError(error, '사용자 정보를 확인하지 못했습니다.')
  }
  return data.user
}

export const user = getCurrentUser

export async function isLoggedIn() {
  const session = await getCurrentSession()
  return Boolean(session?.user)
}

export async function signInWithPassword(emailOrCredentials, password) {
  const client = requireSupabaseClient()
  const credentials = credentialsFrom(emailOrCredentials, password)

  try {
    const { data, error } = await client.auth.signInWithPassword(credentials)
    if (error) throw error
    return data
  } catch (error) {
    throw serviceError(error, '로그인하지 못했습니다.')
  }
}

export const signIn = signInWithPassword

export async function signUpWithPassword(emailOrCredentials, password) {
  const client = requireSupabaseClient()
  const credentials = credentialsFrom(emailOrCredentials, password)

  try {
    const { data, error } = await client.auth.signUp(credentials)
    if (error) throw error
    return data
  } catch (error) {
    throw serviceError(error, '회원가입을 완료하지 못했습니다.')
  }
}

export const signUp = signUpWithPassword

export async function signInWithOAuth(providerOrConfig, redirectTo) {
  const client = requireSupabaseClient()
  const config =
    typeof providerOrConfig === 'string'
      ? {
          provider: providerOrConfig,
          options: redirectTo ? { redirectTo } : undefined,
        }
      : providerOrConfig || {}

  try {
    const { data, error } = await client.auth.signInWithOAuth(config)
    if (error) throw error
    return data
  } catch (error) {
    throw serviceError(error, '소셜 로그인을 시작하지 못했습니다.')
  }
}

export async function signOut() {
  const client = requireSupabaseClient()

  try {
    const { error } = await client.auth.signOut()
    if (error) throw error
  } catch (error) {
    throw serviceError(error, '로그아웃하지 못했습니다.')
  }
}

export function onAuthStateChange(callback) {
  const client = getSupabaseClient()

  if (!client) {
    queueMicrotask(() => callback?.('SIGNED_OUT', null))
    return {
      data: {
        subscription: {
          unsubscribe() {},
        },
      },
    }
  }

  return client.auth.onAuthStateChange(callback)
}

export const authService = {
  isConfigured,
  isLoggedIn,
  user,
  getCurrentUser,
  getCurrentSession,
  signIn,
  signInWithPassword,
  signUp,
  signUpWithPassword,
  signInWithOAuth,
  signOut,
  onAuthStateChange,
}

export default authService
