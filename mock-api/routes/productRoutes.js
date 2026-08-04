import { createProduct, deleteProduct, findProductById, listProducts, updateProduct } from '../data/productStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

const allowedFields = ['name', 'category', 'price', 'stock', 'description']

/**
 * 상품 데이터의 필수 값과 자료형을 검사합니다.
 * partial=true인 PATCH 요청은 실제로 전달된 필드만 검사합니다.
 */
function validateProduct(input, partial = false) {
  const errors = []

  if (!partial || Object.hasOwn(input, 'name')) {
    if (typeof input.name !== 'string' || !input.name.trim()) {
      errors.push('상품명은 필수입니다.')
    }
  }

  if (!partial || Object.hasOwn(input, 'price')) {
    // 빈 문자열이 Number('')에서 0이 되는 것을 방지하기 위해 먼저 검사합니다.
    if (input.price === '' || !Number.isFinite(Number(input.price)) || Number(input.price) < 0) {
      errors.push('가격은 0 이상의 숫자여야 합니다.')
    }
  }

  if (!partial || Object.hasOwn(input, 'stock')) {
    if (input.stock === '' || !Number.isInteger(Number(input.stock)) || Number(input.stock) < 0) {
      errors.push('재고는 0 이상의 정수여야 합니다.')
    }
  }

  if (Object.hasOwn(input, 'category')) {
    if (typeof input.category !== 'string') {
      errors.push('카테고리는 문자열이어야 합니다.')
    }
  }

  if (Object.hasOwn(input, 'description')) {
    if (typeof input.description !== 'string') {
      errors.push('상품 설명은 문자열이어야 합니다.')
    }
  }

  return errors
}

/**
 * API 입력값을 저장하기 좋은 형태로 변환합니다.
 * 허용된 필드만 골라내므로 id 같은 서버 관리 값은 변경되지 않습니다.
 */
function normalizeProduct(input, partial = false) {
  const normalized = {}

  for (const field of allowedFields) {
    if (!Object.hasOwn(input, field)) continue

    if (field === 'price' || field === 'stock') {
      normalized[field] = Number(input[field])
    } else if (field === 'name') {
      normalized[field] = input[field].trim()
    } else {
      normalized[field] = input[field]
    }
  }

  // POST 등록에서는 선택 항목의 기본값을 채웁니다.
  if (!partial) {
    normalized.category = normalized.category?.trim() || '기타'
    normalized.description = normalized.description ?? ''
  }

  return normalized
}

export async function handleProductRoutes(request, response, url) {
  const productMatch = url.pathname.match(/^\/api\/products\/(\d+)$/)

  // GET /api/products?q=vue&category=도서&available=true
  if (request.method === 'GET' && url.pathname === '/api/products') {
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const category = url.searchParams.get('category') ?? '전체'
    const onlyAvailable = url.searchParams.get('available') === 'true'

    const result = listProducts().filter((product) => {
      const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
      const matchesCategory = category === '전체' || product.category === category
      const matchesAvailability = !onlyAvailable || product.stock > 0

      return matchesQuery && matchesCategory && matchesAvailability
    })

    sendJson(response, 200, result)
    return true
  }

  // GET /api/products/:id
  if (request.method === 'GET' && productMatch) {
    const product = findProductById(Number(productMatch[1]))

    if (!product) {
      throw createHttpError(404, '상품을 찾을 수 없습니다.')
    }

    sendJson(response, 200, product)
    return true
  }

  // POST /api/products
  if (request.method === 'POST' && url.pathname === '/api/products') {
    const body = await readJsonBody(request)
    const errors = validateProduct(body)

    if (errors.length > 0) {
      throw createHttpError(400, errors.join(' '))
    }

    const product = createProduct(normalizeProduct(body))
    sendJson(response, 201, product)
    return true
  }

  // PATCH /api/products/:id
  if (request.method === 'PATCH' && productMatch) {
    const productId = Number(productMatch[1])
    if (!findProductById(productId)) {
      throw createHttpError(404, '수정할 상품을 찾을 수 없습니다.')
    }

    const body = await readJsonBody(request)
    const errors = validateProduct(body, true)

    if (errors.length > 0) {
      throw createHttpError(400, errors.join(' '))
    }

    const product = updateProduct(productId, normalizeProduct(body, true))
    sendJson(response, 200, product)
    return true
  }

  // DELETE /api/products/:id
  if (request.method === 'DELETE' && productMatch) {
    const deletedProduct = deleteProduct(Number(productMatch[1]))

    if (!deletedProduct) {
      throw createHttpError(404, '삭제할 상품을 찾을 수 없습니다.')
    }

    sendJson(response, 200, deletedProduct)
    return true
  }

  // 이 라우터가 처리할 상품 요청이 아니면 server.js로 제어권을 돌려줍니다.
  return false
}
