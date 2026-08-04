import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { authApi } from '@/api/authApi.js'
import { accessTokenKey } from '@/api/http.js'

const userStorageKey = 'skala-vue-jwt-user'

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(userStorageKey))
  } catch {
    return null
  }
}

function decodeJwtPayload(token) {
  if (!token) return null

  try {
    const encodedPayload = token.split('.')[1]
    const base64 = encodedPayload.replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))

    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem(accessTokenKey))
  const user = ref(readStoredUser())
  const isLoading = ref(false)
  const errorMessage = ref('')
  const protectedMessage = ref(null)

  const isLoggedIn = computed(() => Boolean(accessToken.value && user.value))
  const authorizationHeader = computed(() => (accessToken.value ? `Bearer ${accessToken.value}` : ''))
  const tokenPayload = computed(() => decodeJwtPayload(accessToken.value))

  function saveAuthentication(loginResponse) {
    accessToken.value = loginResponse.accessToken
    user.value = loginResponse.user

    sessionStorage.setItem(accessTokenKey, loginResponse.accessToken)
    sessionStorage.setItem(userStorageKey, JSON.stringify(loginResponse.user))
  }

  function clearAuthentication() {
    accessToken.value = null
    user.value = null
    protectedMessage.value = null

    sessionStorage.removeItem(accessTokenKey)
    sessionStorage.removeItem(userStorageKey)
  }

  async function login(email, password) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const result = await authApi.login({ email, password })
      saveAuthentication(result)
      return true
    } catch (error) {
      clearAuthentication()
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyProfile() {
    try {
      const profile = await authApi.getMyProfile()
      user.value = profile
      sessionStorage.setItem(userStorageKey, JSON.stringify(profile))
      return profile
    } catch (error) {
      if (error.status === 401) clearAuthentication()
      throw error
    }
  }

  async function fetchProtectedMessage() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      protectedMessage.value = await authApi.getProtectedMessage()
      return true
    } catch (error) {
      if (error.status === 401) clearAuthentication()
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    clearAuthentication()
    errorMessage.value = ''
  }

  return {
    accessToken,
    user,
    isLoading,
    errorMessage,
    protectedMessage,
    isLoggedIn,
    authorizationHeader,
    tokenPayload,
    login,
    logout,
    fetchMyProfile,
    fetchProtectedMessage,
  }
})
