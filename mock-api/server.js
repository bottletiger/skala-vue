import http from 'node:http'
import process from 'node:process'

import { getPostCount, resetPosts } from './data/postStore.js'
import { getProductCount, resetProducts } from './data/productStore.js'
import { handleAuthRoutes } from './routes/authRoutes.js'
import { handlePostRoutes } from './routes/postRoutes.js'
import { handleProductRoutes } from './routes/productRoutes.js'
import { sendError, sendJson, waitForRequestedDelay } from './utils/httpUtils.js'

const port = Number(process.env.API_PORT ?? 3001)

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204)
    return
  }

  const host = request.headers.host ?? `localhost:${port}`
  const url = new URL(request.url ?? '/', `http://${host}`)

  try {
    await waitForRequestedDelay(url)

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, {
        status: 'ok',
        service: 'SKALA Vue Mock API',
        productCount: getProductCount(),
        postCount: getPostCount(),
        authentication: 'ready',
      })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/reset') {
      const products = resetProducts()
      const posts = resetPosts()

      sendJson(response, 200, {
        message: '상품과 게시글 Mock 데이터가 초기화되었습니다.',
        productCount: products.length,
        postCount: posts.length,
      })
      return
    }

    if (await handleAuthRoutes(request, response, url)) return
    if (await handleProductRoutes(request, response, url)) return
    if (await handlePostRoutes(request, response, url)) return

    sendJson(response, 404, {
      message: '존재하지 않는 API 경로입니다.',
    })
  } catch (error) {
    sendError(response, error)
  }
})

server.listen(port, () => {
  console.log(`Mock API: http://localhost:${port}/api`)
  console.log('상품·게시글 CRUD와 JWT 인증 API를 사용할 수 있습니다.')
})
