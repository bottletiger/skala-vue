import { http } from './http.js'

export const systemApi = {
  async getHealth() {
    const response = await http.get('/health')
    return response.data
  },

  async reset() {
    const response = await http.post('/reset')
    return response.data
  },
}
