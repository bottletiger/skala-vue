import axios from 'axios'

export const accessTokenKey = 'skala-vue-jwt-access-token'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const http = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Lab-Client': 'skala-vue',
  },
})

http.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem(accessTokenKey)

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'API 응답 시간이 초과되었습니다.' : 'Mock API에 연결할 수 없습니다. npm run dev:all 실행 여부를 확인하세요.')

    const normalizedError = new Error(message)
    normalizedError.status = error.response?.status

    return Promise.reject(normalizedError)
  },
)
