import { createPost, deletePost, findPostById, listPosts, updatePost } from '../data/postStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const allowedFields = ['title', 'content', 'author']

function validatePost(input, partial = false) {
  const errors = []

  if (!partial || Object.hasOwn(input, 'title')) {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      errors.push('게시글 제목은 필수입니다.')
    }
  }

  for (const field of ['content', 'author']) {
    if (Object.hasOwn(input, field) && typeof input[field] !== 'string') {
      errors.push(`${field === 'content' ? '내용' : '작성자'}은 문자열이어야 합니다.`)
    }
  }

  return errors
}

function normalizePost(input, partial = false) {
  const normalized = {}

  for (const field of allowedFields) {
    if (Object.hasOwn(input, field)) {
      normalized[field] = input[field].trim()
    }
  }

  if (!partial) {
    normalized.content = normalized.content ?? ''
    normalized.author = normalized.author || '익명'
  }

  return normalized
}

export async function handlePostRoutes(request, response, url) {
  const postMatch = url.pathname.match(/^\/api\/posts\/(\d+)$/)

  // GET /api/posts?q=검색어
  if (request.method === 'GET' && url.pathname === '/api/posts') {
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()

    const result = listPosts()
      .filter((post) => {
        return !query || post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query) || post.author.toLowerCase().includes(query)
      })
      // 최신 게시글을 먼저 보여주기 위해 복사 후 내림차순 정렬합니다.
      .toSorted((first, second) => second.id - first.id)

    sendJson(response, 200, result)
    return true
  }

  // GET /api/posts/:id
  if (request.method === 'GET' && postMatch) {
    const post = findPostById(Number(postMatch[1]))

    if (!post) {
      throw createHttpError(404, '게시글을 찾을 수 없습니다.')
    }

    sendJson(response, 200, post)
    return true
  }

  // POST /api/posts
  if (request.method === 'POST' && url.pathname === '/api/posts') {
    const body = await readJsonBody(request)
    const errors = validatePost(body)

    if (errors.length > 0) {
      throw createHttpError(400, errors.join(' '))
    }

    const post = createPost(normalizePost(body))
    sendJson(response, 201, post)
    return true
  }

  // PATCH /api/posts/:id
  if (request.method === 'PATCH' && postMatch) {
    const postId = Number(postMatch[1])
    if (!findPostById(postId)) {
      throw createHttpError(404, '수정할 게시글을 찾을 수 없습니다.')
    }

    const body = await readJsonBody(request)
    const errors = validatePost(body, true)

    if (errors.length > 0) {
      throw createHttpError(400, errors.join(' '))
    }

    const post = updatePost(postId, normalizePost(body, true))
    sendJson(response, 200, post)
    return true
  }

  // DELETE /api/posts/:id
  if (request.method === 'DELETE' && postMatch) {
    const deletedPost = deletePost(Number(postMatch[1]))

    if (!deletedPost) {
      throw createHttpError(404, '삭제할 게시글을 찾을 수 없습니다.')
    }

    sendJson(response, 200, deletedPost)
    return true
  }

  return false
}
