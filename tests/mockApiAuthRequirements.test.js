import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { createProduct, deleteProduct, listProducts, resetProducts, updateProduct } from '../mock-api/data/productStore.js'
import { createPost, deletePost, listPosts, resetPosts, updatePost } from '../mock-api/data/postStore.js'

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('상품과 게시글 Mock 저장소가 CRUD 후 초기 상태로 복원된다', () => {
  resetProducts()
  const product = createProduct({
    name: '테스트 상품',
    category: '기타',
    price: 1000,
    stock: 1,
    description: '',
  })

  assert.equal(listProducts().length, 6)
  assert.equal(updateProduct(product.id, { stock: 3 }).stock, 3)
  assert.equal(deleteProduct(product.id).name, '테스트 상품')
  assert.equal(resetProducts().length, 5)

  resetPosts()
  const post = createPost({
    title: '테스트 게시글',
    content: 'CRUD 확인',
    author: '테스터',
  })

  assert.equal(listPosts().length, 4)
  assert.equal(updatePost(post.id, { title: '수정된 게시글' }).title, '수정된 게시글')
  assert.equal(deletePost(post.id).author, '테스터')
  assert.equal(resetPosts().length, 3)
})

test('단일 Mock 서버가 상품·게시글·JWT 인증 라우터를 함께 연결한다', () => {
  const serverSource = readSource('../mock-api/server.js')

  assert.match(serverSource, /handleProductRoutes/)
  assert.match(serverSource, /handlePostRoutes/)
  assert.match(serverSource, /handleAuthRoutes/)
  assert.match(serverSource, /authentication:\s*'ready'/)
})

test('Axios 요청 인터셉터가 저장된 JWT를 Bearer 헤더에 추가한다', () => {
  const httpSource = readSource('../src/api/http.js')

  assert.match(httpSource, /http\.interceptors\.request\.use/)
  assert.match(httpSource, /config\.headers\.Authorization = `Bearer \$\{accessToken\}`/)
  assert.match(httpSource, /VITE_API_BASE_URL/)
})

test('대시보드는 인증 보호 경로이며 로그인 후 상품·게시글 탭을 제공한다', () => {
  const routerSource = readSource('../src/router/index.js')
  const dashboardSource = readSource('../src/views/DashboardView.vue')

  assert.match(routerSource, /path:\s*'\/dashboard'[\s\S]*requiresAuth:\s*true/)
  assert.match(routerSource, /path:\s*'\/login'[\s\S]*LoginView\.vue/)
  assert.match(routerSource, /router\.beforeEach/)
  assert.match(routerSource, /query:\s*\{\s*redirect:\s*to\.fullPath\s*\}/)
  assert.match(dashboardSource, /<ProductManager/)
  assert.match(dashboardSource, /<PostManager/)
  assert.match(dashboardSource, /상품 API/)
  assert.match(dashboardSource, /게시글 API/)
  assert.match(dashboardSource, /user\?\.email/)
  assert.match(dashboardSource, /user\?\.role/)
  assert.match(dashboardSource, /@click="logout"/)
  assert.doesNotMatch(dashboardSource, /Decoded payload|Raw access token|Authorization header|보호 API 확인/)
})

test('하단 내비게이션은 날씨·대시보드·로그인·소개 순서다', () => {
  const appSource = readSource('../src/App.vue')
  const labels = ['<span>날씨</span>', '<span>대시보드</span>', '<span>로그인</span>', '<span>소개</span>']
  const indexes = labels.map((label) => appSource.indexOf(label))

  assert.ok(indexes.every((index) => index >= 0))
  assert.deepEqual(
    indexes,
    [...indexes].sort((first, second) => first - second),
  )
})

test('내비게이션 화면은 선택한 날씨의 동적 테마와 장면 규칙을 공유한다', () => {
  const loginSource = readSource('../src/views/LoginView.vue')
  const dashboardSource = readSource('../src/views/DashboardView.vue')
  const aboutSource = readSource('../src/views/WeatherAboutView.vue')
  const sharedThemeSource = readSource('../src/composables/useSharedWeatherTheme.js')
  const mainCssSource = readSource('../src/assets/main.css')

  for (const source of [loginSource, dashboardSource, aboutSource]) {
    assert.match(source, /useSharedWeatherTheme/)
    assert.match(source, /:data-theme="\w+Theme\.name"/)
    assert.match(source, /var\(--hero-start\)/)
    assert.match(source, /var\(--hero-end\)/)
    assert.match(source, /var\(--weather-accent\)/)
    assert.match(source, /linear-gradient\(158deg/)
    assert.match(source, /letter-spacing:\s*-0\.0(?:5|6)/)
    assert.match(source, /backdrop-filter:\s*blur\(/)
    assert.doesNotMatch(source, /#102f2b|#1b7765|#11322c|#1a5548/)
  }

  assert.match(sharedThemeSource, /weatherList\.value\.find/)
  assert.match(sharedThemeSource, /weather\.id === selectedCityId\.value/)
  assert.match(sharedThemeSource, /getWeatherTheme\(selectedWeather\.value\)/)

  for (const state of ['clouds', 'rain', 'thunderstorm', 'snow', 'mist']) {
    assert.match(mainCssSource, new RegExp(`data-theme='${state}'`))
  }
})

test('상품과 게시글 탭은 기존 샘플 패널 대신 같은 컬렉션형 화면을 사용한다', () => {
  const productSource = readSource('../src/components/mock/ProductManager.vue')
  const postSource = readSource('../src/components/mock/PostManager.vue')

  for (const source of [productSource, postSource]) {
    assert.match(source, /workspace-intro/)
    assert.match(source, /workspace-layout/)
    assert.match(source, /editor-panel/)
    assert.match(source, /collection-panel/)
    assert.match(source, /var\(--hero-muted\)/)
    assert.doesNotMatch(source, /method-badge|panel--form|panel--content/)
  }
})

test('삭제와 전체 초기화는 브라우저 기본 confirm 대신 공통 날씨 테마 확인창을 사용한다', () => {
  const dashboardSource = readSource('../src/views/DashboardView.vue')
  const productSource = readSource('../src/components/mock/ProductManager.vue')
  const postSource = readSource('../src/components/mock/PostManager.vue')
  const dialogSource = readSource('../src/components/common/ConfirmDialog.vue')

  for (const source of [dashboardSource, productSource, postSource]) {
    assert.match(source, /<ConfirmDialog/)
    assert.doesNotMatch(source, /window\.confirm/)
  }

  assert.match(dialogSource, /useSharedWeatherTheme/)
  assert.match(dialogSource, /role="alertdialog"/)
  assert.match(dialogSource, /aria-modal="true"/)
  assert.match(dialogSource, /event\.key === 'Escape'/)
  assert.match(dialogSource, /previouslyFocusedElement/)
})
