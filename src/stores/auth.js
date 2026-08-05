import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import * as authService from '@/services/authService.js'

const getErrorMessage = (error, fallback) => {
  if (error?.code === 'SERVICE_NOT_CONFIGURED') return '로그인 서비스 설정이 필요합니다.'
  if (error?.name === 'AuthServiceError' && error.message) return error.message
  return fallback
}

const resolveOAuthRedirect = (redirectPath = '/trips') => {
  const safePath = typeof redirectPath === 'string' && redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : '/trips'
  return `${window.location.origin}${window.location.pathname}#${safePath}`
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const user = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const initialized = ref(false)
  let initializationPromise = null
  let authSubscription = null

  const isConfigured = computed(() => authService.isConfigured())
  const isLoggedIn = computed(() => Boolean(session.value?.user && user.value))
  const accessToken = computed(() => session.value?.access_token || null)

  const applySession = (nextSession) => {
    session.value = nextSession || null
    user.value = nextSession?.user || null
  }

  const clearError = () => {
    errorMessage.value = ''
  }

  const initialize = async () => {
    if (initialized.value) return session.value
    if (initializationPromise) return initializationPromise

    initializationPromise = (async () => {
      if (!isConfigured.value) {
        initialized.value = true
        return null
      }

      try {
        applySession(await authService.getCurrentSession())
        authSubscription ??= authService.onAuthStateChange((_event, nextSession) => {
          applySession(nextSession)
        })?.data?.subscription
        return session.value
      } catch (error) {
        applySession(null)
        errorMessage.value = getErrorMessage(error, '로그인 상태를 확인하지 못했습니다.')
        return null
      } finally {
        initialized.value = true
        initializationPromise = null
      }
    })()

    return initializationPromise
  }

  const login = async (email, password) => {
    isLoading.value = true
    clearError()

    try {
      const result = await authService.signInWithPassword(email, password)
      applySession(result.session)
      return true
    } catch (error) {
      applySession(null)
      errorMessage.value = getErrorMessage(error, '로그인하지 못했습니다.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const signUp = async (email, password) => {
    isLoading.value = true
    clearError()

    try {
      const result = await authService.signUpWithPassword(email, password)
      applySession(result.session)
      if (!result.user) throw new Error('계정을 만들지 못했습니다.')
      return true
    } catch (error) {
      applySession(null)
      errorMessage.value = getErrorMessage(error, '계정을 만들지 못했습니다.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const signInWithGoogle = async (redirectPath) => {
    isLoading.value = true
    clearError()

    try {
      if (typeof authService.signInWithOAuth !== 'function') throw new Error('Google 로그인을 준비하지 못했습니다.')
      await authService.signInWithOAuth('google', resolveOAuthRedirect(redirectPath))
      return true
    } catch (error) {
      errorMessage.value = getErrorMessage(error, 'Google 로그인을 시작하지 못했습니다.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const fetchMyProfile = async () => {
    const currentUser = await authService.getCurrentUser()
    user.value = currentUser
    if (!currentUser) session.value = null
    return currentUser
  }

  const logout = async () => {
    isLoading.value = true
    clearError()

    try {
      if (isConfigured.value) await authService.signOut()
      applySession(null)
      return true
    } catch (error) {
      errorMessage.value = getErrorMessage(error, '로그아웃하지 못했습니다.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    accessToken,
    session,
    user,
    isLoading,
    errorMessage,
    initialized,
    isConfigured,
    isLoggedIn,
    initialize,
    login,
    signUp,
    signInWithGoogle,
    logout,
    fetchMyProfile,
    clearError,
  }
})
