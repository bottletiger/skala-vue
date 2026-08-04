// Node.js에 내장된 HTTP 모듈을 가져온다.
// 별도의 Express 설치 없이 HTTP 서버를 만들 수 있다.
import http from 'node:http'

// | Vue 실습     | API 요청                         |
// | ---------- | ------------------------------ |
// | 상품 목록 출력   | `GET /api/products`            |
// | 상품 상세 조회   | `GET /api/products/1`          |
// | 상품 등록      | `POST /api/products`           |
// | 상품 수정      | `PATCH /api/products/1`        |
// | 상품 삭제      | `DELETE /api/products/1`       |
// | 검색 및 필터링   | `GET /api/products?q=Vue`      |
// | 로딩 화면 확인   | `GET /api/products?delay=2000` |
// | 오류 처리      | 존재하지 않는 상품 조회                  |
// | Axios 인터셉터 | API 요청·응답 공통 처리                |
// | Pinia 상태관리 | API에서 받은 상품 목록 저장              |


// Mock API 서버가 사용할 포트 번호
// Vue의 Vite 개발 서버는 보통 5173 포트를 사용하므로 서로 충돌하지 않는다.
// 한 번에 실행하기 위해 package.json에 dev:all이라는 명령을 정의한 것입니다. 보통 concurrently 패키지를 이용합니다.
// {
//   "scripts": {
//     "dev": "vite",
//     "api": "node server.js",
//     "dev:all": "concurrently \"npm run dev\" \"npm run api\""
//   }
// }
// ## 실행

// 한 터미널에서 Vue와 로컬 API를 함께 실행합니다.

// ```bash
// npm install
// npm run dev:all
// ```

// 또는 터미널을 두 개 사용합니다.

// ```bash
// # 터미널 1
// npm run api

// # 터미널 2
// npm run dev
// ```
const port = 3001

// 서버 시작 시 사용할 초기 상품 데이터
const initialProducts = [
  {
    id: 1,
    name: 'Vue 3 실전 가이드',
    category: '도서',
    price: 32000,
    stock: 8,
    description: 'Composition API와 컴포넌트 설계를 다루는 실습서',
  },
  {
    id: 2,
    name: '무선 키보드',
    category: '장비',
    price: 49000,
    stock: 5,
    description: '프런트엔드 개발자를 위한 저소음 무선 키보드',
  },
  {
    id: 3,
    name: '버티컬 마우스',
    category: '장비',
    price: 39000,
    stock: 0,
    description: '손목 부담을 줄이는 인체공학 마우스',
  },
  {
    id: 4,
    name: 'USB-C 허브',
    category: '장비',
    price: 59000,
    stock: 4,
    description: 'HDMI와 USB 포트를 지원하는 7-in-1 허브',
  },
  {
    id: 5,
    name: '웹 접근성 체크리스트',
    category: '도서',
    price: 18000,
    stock: 12,
    description: '실무 UI 접근성 점검 항목을 정리한 핸드북',
  },
]

// initialProducts를 직접 변경하지 않도록 깊은 복사한다.
// products 배열은 서버가 실행되는 동안 실제 데이터 저장소 역할을 한다.
let products = structuredClone(initialProducts)

// 새로운 상품을 등록할 때 사용할 다음 상품 번호
// 현재 가장 큰 상품 ID에 1을 더한다.
let nextProductId = Math.max(...products.map((product) => product.id)) + 1

/**
 * 클라이언트에 JSON 형식의 응답을 전송하는 함수
 *
 * @param {http.ServerResponse} response 응답 객체
 * @param {number} statusCode HTTP 상태 코드
 * @param {object|array} payload 응답으로 전달할 데이터
 */
function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    // 다른 포트에서 실행되는 Vue 애플리케이션의 요청을 허용한다.
    // Vue: localhost:5173
    // API: localhost:3001
    'Access-Control-Allow-Origin': '*',

    // 클라이언트가 전송할 수 있는 요청 헤더
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Lab-Client',

    // 서버가 허용하는 HTTP 메서드
    'Access-Control-Allow-Methods':
      'GET, POST, PATCH, DELETE, OPTIONS',

    // 응답 데이터가 JSON이며 UTF-8 인코딩임을 알린다.
    'Content-Type': 'application/json; charset=utf-8',
  })

  // JavaScript 객체를 JSON 문자열로 변환하여 전송한다.
  response.end(JSON.stringify(payload))
}

/**
 * POST나 PATCH 요청의 JSON 본문을 읽는 함수
 *
 * Node.js의 request 객체는 요청 데이터를 한 번에 주지 않고
 * 여러 개의 chunk로 나누어 전달할 수 있다.
 */
function readBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = ''

    // 요청 데이터가 들어올 때마다 실행된다.
    request.on('data', (chunk) => {
      rawBody += chunk

      // 지나치게 큰 요청을 방지하기 위해 약 1MB로 제한한다.
      if (rawBody.length > 1_000_000) {
        reject(new Error('요청 본문이 너무 큽니다.'))
        request.destroy()
      }
    })

    // 요청 데이터 수신이 완료되면 실행된다.
    request.on('end', () => {
      // 요청 본문이 없으면 빈 객체를 반환한다.
      if (!rawBody) {
        resolve({})
        return
      }

      try {
        // JSON 문자열을 JavaScript 객체로 변환한다.
        resolve(JSON.parse(rawBody))
      } catch {
        reject(new Error('올바른 JSON 형식이 아닙니다.'))
      }
    })

    // 요청 처리 중 네트워크 오류 등이 발생한 경우
    request.on('error', reject)
  })
}

/**
 * 상품 등록 또는 수정 데이터의 유효성을 검사한다.
 *
 * @param {object} input 검사할 상품 데이터
 * @param {boolean} partial
 *   false: POST 등록 검사 — 필수 필드를 모두 검사
 *   true: PATCH 수정 검사 — 전달된 필드만 검사
 *
 * @returns {string[]} 오류 메시지 배열
 */
function validateProduct(input, partial = false) {
  const errors = []

  // 상품명 검사
  if (!partial || Object.hasOwn(input, 'name')) {
    if (typeof input.name !== 'string' || !input.name.trim()) {
      errors.push('상품명은 필수입니다.')
    }
  }

  // 가격 검사
  if (!partial || Object.hasOwn(input, 'price')) {
    if (!Number.isFinite(Number(input.price)) || Number(input.price) < 0) {
      errors.push('가격은 0 이상의 숫자여야 합니다.')
    }
  }

  // 재고 검사
  if (!partial || Object.hasOwn(input, 'stock')) {
    if (
      !Number.isInteger(Number(input.stock)) ||
      Number(input.stock) < 0
    ) {
      errors.push('재고는 0 이상의 정수여야 합니다.')
    }
  }

  return errors
}

// HTTP 서버를 생성한다.
// 클라이언트 요청이 들어올 때마다 콜백 함수가 실행된다.
const server = http.createServer(async (request, response) => {
  // CORS 사전 요청(Preflight Request)을 처리한다.
  // 브라우저가 실제 POST, PATCH, DELETE 요청 전에
  // 서버가 해당 요청을 허용하는지 확인할 때 사용한다.
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  // 요청 URL을 분석한다.
  // 예: http://localhost:3001/api/products?q=키보드
  const url = new URL(
    request.url,
    `http://${request.headers.host}`,
  )

  // /api/products/숫자 형태인지 검사한다.
  // 예: /api/products/3
  //
  // 일치하면 productMatch[1]에 "3"이 저장된다.
  const productMatch = url.pathname.match(
    /^\/api\/products\/(\d+)$/,
  )

  try {
    // API 응답 지연을 테스트하기 위한 옵션
    // 예: /api/products?delay=2000
    //
    // 최소 0ms, 최대 3000ms까지만 허용한다.
    const requestedDelay = Number(
      url.searchParams.get('delay') ?? 0,
    )

    const delay = Number.isFinite(requestedDelay)
      ? Math.min(Math.max(requestedDelay, 0), 3000)
      : 0

    if (delay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, delay),
      )
    }

    // ---------------------------------------------------------
    // 1. 서버 상태 확인
    // GET /api/health
    // ---------------------------------------------------------
    if (
      request.method === 'GET' &&
      url.pathname === '/api/health'
    ) {
      sendJson(response, 200, {
        status: 'ok',
        productCount: products.length,
      })
      return
    }

    // ---------------------------------------------------------
    // 2. 상품 데이터 초기화
    // POST /api/reset
    // ---------------------------------------------------------
    if (
      request.method === 'POST' &&
      url.pathname === '/api/reset'
    ) {
      products = structuredClone(initialProducts)

      nextProductId =
        Math.max(
          ...products.map((product) => product.id),
        ) + 1

      sendJson(response, 200, {
        message: '데이터가 초기화되었습니다.',
        products,
      })
      return
    }

    // ---------------------------------------------------------
    // 3. 상품 목록 조회
    // GET /api/products
    //
    // 검색:
    // GET /api/products?q=Vue
    //
    // 카테고리:
    // GET /api/products?category=도서
    //
    // 재고가 있는 상품:
    // GET /api/products?available=true
    // ---------------------------------------------------------
    if (
      request.method === 'GET' &&
      url.pathname === '/api/products'
    ) {
      // 상품명 또는 설명 검색어
      const query = (
        url.searchParams.get('q') ?? ''
      )
        .trim()
        .toLowerCase()

      // 카테고리 필터
      const category =
        url.searchParams.get('category') ?? '전체'

      // 재고 보유 상품만 조회할지 여부
      const onlyAvailable =
        url.searchParams.get('available') === 'true'

      const result = products.filter((product) => {
        // 상품명 또는 설명에 검색어가 포함되는지 검사한다.
        const matchesQuery =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.description
            .toLowerCase()
            .includes(query)

        // 전체 카테고리이거나 선택한 카테고리가 일치하는지 검사한다.
        const matchesCategory =
          category === '전체' ||
          product.category === category

        // available=true이면 재고가 1개 이상인지 검사한다.
        const matchesAvailability =
          !onlyAvailable || product.stock > 0

        return (
          matchesQuery &&
          matchesCategory &&
          matchesAvailability
        )
      })

      sendJson(response, 200, result)
      return
    }

    // ---------------------------------------------------------
    // 4. 상품 한 건 조회
    // GET /api/products/1
    // ---------------------------------------------------------
    if (request.method === 'GET' && productMatch) {
      const product = products.find(
        (item) =>
          item.id === Number(productMatch[1]),
      )

      if (!product) {
        sendJson(response, 404, {
          message: '상품을 찾을 수 없습니다.',
        })
        return
      }

      sendJson(response, 200, product)
      return
    }

    // ---------------------------------------------------------
    // 5. 상품 등록
    // POST /api/products
    // ---------------------------------------------------------
    if (
      request.method === 'POST' &&
      url.pathname === '/api/products'
    ) {
      // JSON 요청 본문을 읽는다.
      const body = await readBody(request)

      // 필수 데이터와 자료형을 검사한다.
      const errors = validateProduct(body)

      if (errors.length > 0) {
        sendJson(response, 400, {
          message: errors.join(' '),
        })
        return
      }

      // 새로운 상품 객체 생성
      const product = {
        id: nextProductId++,
        name: body.name.trim(),
        category: body.category || '기타',
        price: Number(body.price),
        stock: Number(body.stock),
        description: body.description || '',
      }

      // 메모리 배열에 상품을 추가한다.
      products.push(product)

      // 201 Created 상태 코드로 등록 결과를 반환한다.
      sendJson(response, 201, product)
      return
    }

    // ---------------------------------------------------------
    // 6. 상품 일부 수정
    // PATCH /api/products/1
    // ---------------------------------------------------------
    if (request.method === 'PATCH' && productMatch) {
      const product = products.find(
        (item) =>
          item.id === Number(productMatch[1]),
      )

      if (!product) {
        sendJson(response, 404, {
          message: '수정할 상품을 찾을 수 없습니다.',
        })
        return
      }

      const body = await readBody(request)

      // PATCH이므로 전달된 필드만 검사한다.
      const errors = validateProduct(body, true)

      if (errors.length > 0) {
        sendJson(response, 400, {
          message: errors.join(' '),
        })
        return
      }

      // 클라이언트가 수정할 수 있는 필드를 제한한다.
      // id는 수정할 수 없다.
      const allowedFields = [
        'name',
        'category',
        'price',
        'stock',
        'description',
      ]

      for (const field of allowedFields) {
        // 요청 본문에 해당 속성이 실제로 존재할 때만 수정한다.
        if (Object.hasOwn(body, field)) {
          // 가격과 재고는 숫자로 변환한다.
          product[field] = ['price', 'stock'].includes(
            field,
          )
            ? Number(body[field])
            : body[field]
        }
      }

      sendJson(response, 200, product)
      return
    }

    // ---------------------------------------------------------
    // 7. 상품 삭제
    // DELETE /api/products/1
    // ---------------------------------------------------------
    if (
      request.method === 'DELETE' &&
      productMatch
    ) {
      const index = products.findIndex(
        (item) =>
          item.id === Number(productMatch[1]),
      )

      if (index === -1) {
        sendJson(response, 404, {
          message: '삭제할 상품을 찾을 수 없습니다.',
        })
        return
      }

      // 배열에서 상품 한 건을 삭제한다.
      // splice()는 삭제된 요소를 배열로 반환한다.
      const [deletedProduct] = products.splice(
        index,
        1,
      )

      sendJson(response, 200, deletedProduct)
      return
    }

    // 위 조건에 해당하지 않는 API 주소
    sendJson(response, 404, {
      message: '존재하지 않는 API 경로입니다.',
    })
  } catch (error) {
    // JSON 변환 실패, 요청 본문 오류 등 예외 처리
    sendJson(response, 400, {
      message: error.message,
    })
  }
})

// 3001 포트에서 API 서버를 실행한다.
server.listen(port, () => {
  console.log(
    `Mock API: http://localhost:${port}/api`,
  )
})
