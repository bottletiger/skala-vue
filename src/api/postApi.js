import { http } from './http.js'

export const postApi = {
  async getAll(params = {}) {
    const response = await http.get('/posts', { params })
    return response.data
  },

  async getById(postId) {
    const response = await http.get(`/posts/${postId}`)
    return response.data
  },

  async create(post) {
    const response = await http.post('/posts', post)
    return response.data
  },

  async update(postId, patch) {
    const response = await http.patch(`/posts/${postId}`, patch)
    return response.data
  },

  async remove(postId) {
    const response = await http.delete(`/posts/${postId}`)
    return response.data
  },
}
