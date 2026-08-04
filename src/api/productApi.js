import { http } from './http.js'

export const productApi = {
  async getAll(params = {}) {
    const response = await http.get('/products', { params })
    return response.data
  },

  async getById(productId) {
    const response = await http.get(`/products/${productId}`)
    return response.data
  },

  async create(product) {
    const response = await http.post('/products', product)
    return response.data
  },

  async update(productId, patch) {
    const response = await http.patch(`/products/${productId}`, patch)
    return response.data
  },

  async remove(productId) {
    const response = await http.delete(`/products/${productId}`)
    return response.data
  },
}
