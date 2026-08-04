import { Buffer } from 'node:buffer'

// 모든 JSON 응답에 공통으로 포함할 CORS 헤더입니다.
const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Lab-Client',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
}

/**
 * JavaScript 객체를 JSON 문자열로 변환하여 응답합니다.
 * 204 응답은 본문을 가질 수 없으므로 바로 종료합니다.
 */
export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, corsHeaders)

  if (statusCode === 204) {
    response.end()
    return
  }

  response.end(JSON.stringify(payload))
}

/**
 * 상태 코드를 가진 Error를 만들 때 사용하는 편의 함수입니다.
 */
export function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

/**
 * POST/PATCH 요청의 JSON 본문을 읽습니다.
 * Node의 요청 본문은 여러 chunk로 들어오므로 모두 합친 뒤 JSON으로 변환합니다.
 */
export function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let receivedBytes = 0
    let isTooLarge = false

    request.on('data', (chunk) => {
      receivedBytes += chunk.length

      // 실습 서버가 지나치게 큰 요청을 처리하지 않도록 1MB로 제한합니다.
      if (receivedBytes > 1_000_000) {
        isTooLarge = true
        return
      }

      chunks.push(chunk)
    })

    request.on('end', () => {
      if (isTooLarge) {
        reject(createHttpError(413, '요청 본문은 1MB를 넘을 수 없습니다.'))
        return
      }

      if (chunks.length === 0) {
        resolve({})
        return
      }

      try {
        const rawBody = Buffer.concat(chunks).toString('utf8')
        const parsedBody = JSON.parse(rawBody)

        if (!parsedBody || Array.isArray(parsedBody) || typeof parsedBody !== 'object') {
          reject(createHttpError(400, '요청 본문은 JSON 객체여야 합니다.'))
          return
        }

        resolve(parsedBody)
      } catch (error) {
        if (error.statusCode) {
          reject(error)
          return
        }
        reject(createHttpError(400, '올바른 JSON 형식이 아닙니다.'))
      }
    })

    request.on('error', reject)
  })
}

/**
 * 에러의 statusCode가 있으면 그 값을 사용하고, 예상 밖의 오류는 500으로 응답합니다.
 */
export function sendError(response, error) {
  const statusCode = Number(error.statusCode) || 500
  const message = statusCode === 500 ? '서버 내부 오류가 발생했습니다.' : error.message

  // 사용자가 잘못 입력해 발생한 4xx 오류는 정상적인 API 응답이므로
  // 서버 장애에 해당하는 5xx 오류만 콘솔에 자세히 출력합니다.
  if (statusCode >= 500) {
    console.error(error)
  }
  sendJson(response, statusCode, { message })
}

/**
 * 쿼리스트링의 delay 값을 읽어 0~3000ms 사이에서 응답을 지연합니다.
 */
export async function waitForRequestedDelay(url) {
  const requestedDelay = Number(url.searchParams.get('delay') ?? 0)
  const delay = Number.isFinite(requestedDelay) ? Math.min(Math.max(requestedDelay, 0), 3000) : 0

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}
