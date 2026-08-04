import { http } from './http.js'

export const authApi = {
  async login(credentials) {
    const response = await http.post('/auth/login', credentials)
    return response.data
  },

  async getMyProfile() {
    const response = await http.get('/auth/me')
    return response.data
  },
}
