import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import process from 'node:process'

import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

// 실습용 사용자 목록입니다. 실제 서버에서는 DB와 암호화된 비밀번호를 사용합니다.
const mockUsers = [
  {
    id: 1,
    email: 'student@skala.com',
    password: '1234',
    name: 'SKALA 수강생',
    role: 'STUDENT',
    department: 'Frontend Class',
  },
  {
    id: 2,
    email: 'admin@skala.com',
    password: 'admin1234',
    name: '실습 관리자',
    role: 'ADMIN',
    department: 'Training Center',
  },
]

const jwtSecret = process.env.MOCK_JWT_SECRET || 'mock-secret-for-classroom-only'
const tokenTtlSeconds = 15 * 60

function toPublicUser(user) {
  // 비밀번호는 클라이언트에 절대 응답하지 않습니다.
  const publicUser = { ...user }
  delete publicUser.password
  return publicUser
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/**
 * header.payload.signature 구조의 HMAC SHA-256 JWT를 생성합니다.
 * 외부 라이브러리 없이 JWT 흐름을 학습하기 위한 Mock 구현입니다.
 */
function createAccessToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + tokenTtlSeconds,
    iss: 'vue-pinia-jwt-mock-api',
  }

  const unsignedToken = `${encodeJson(header)}.${encodeJson(payload)}`
  const signature = crypto.createHmac('sha256', jwtSecret).update(unsignedToken).digest('base64url')

  return `${unsignedToken}.${signature}`
}

/**
 * Authorization 헤더로 받은 토큰의 형식, 서명, 만료 시간을 검사합니다.
 */
function verifyAccessToken(token) {
  const segments = token.split('.')
  if (segments.length !== 3) {
    throw createHttpError(401, '올바른 JWT 형식이 아닙니다.')
  }

  const [encodedHeader, encodedPayload, receivedSignature] = segments
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = crypto.createHmac('sha256', jwtSecret).update(unsignedToken).digest('base64url')

  const expectedBuffer = Buffer.from(expectedSignature)
  const receivedBuffer = Buffer.from(receivedSignature)
  const signatureMatches = expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer)

  if (!signatureMatches) {
    throw createHttpError(401, 'JWT 서명이 올바르지 않습니다.')
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
  } catch {
    throw createHttpError(401, 'JWT Payload를 해석할 수 없습니다.')
  }

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp <= now) {
    throw createHttpError(401, 'Access Token이 만료되었습니다.')
  }

  return payload
}

function authenticateRequest(request) {
  const authorization = request.headers.authorization ?? ''
  const [tokenType, token] = authorization.split(' ')

  if (tokenType !== 'Bearer' || !token) {
    throw createHttpError(401, 'Bearer Access Token이 필요합니다.')
  }

  const payload = verifyAccessToken(token)
  const user = mockUsers.find((item) => String(item.id) === payload.sub)

  if (!user) {
    throw createHttpError(401, '토큰의 사용자를 찾을 수 없습니다.')
  }

  return toPublicUser(user)
}

export async function handleAuthRoutes(request, response, url) {
  // 1. 로그인: 이메일/비밀번호를 받고 토큰과 프로필을 응답합니다.
  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readJsonBody(request)
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      throw createHttpError(400, '이메일과 비밀번호를 입력해주세요.')
    }

    const user = mockUsers.find((item) => item.email === email && item.password === password)

    if (!user) {
      throw createHttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    const accessToken = createAccessToken(user)

    sendJson(response, 200, {
      message: '로그인에 성공했습니다.',
      tokenType: 'Bearer',
      accessToken,
      expiresIn: tokenTtlSeconds,
      user: toPublicUser(user),
    })
    return true
  }

  // 2. 내 프로필: 올바른 Bearer Token이 있어야 접근할 수 있습니다.
  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = authenticateRequest(request)
    sendJson(response, 200, user)
    return true
  }

  // 3. 보호 API: 인증 헤더가 실제로 전송되는지 확인하는 실습 엔드포인트입니다.
  if (request.method === 'GET' && url.pathname === '/api/auth/protected-message') {
    const user = authenticateRequest(request)
    sendJson(response, 200, {
      message: `${user.name}님, JWT 인증이 필요한 API 호출에 성공했습니다.`,
      role: user.role,
      requestedAt: new Date().toISOString(),
    })
    return true
  }

  return false
}
