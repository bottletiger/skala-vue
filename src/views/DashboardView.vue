<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { systemApi } from '@/api/systemApi.js'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import PostManager from '@/components/mock/PostManager.vue'
import ProductManager from '@/components/mock/ProductManager.vue'
import StatusBanner from '@/components/mock/StatusBanner.vue'
import { useSharedWeatherTheme } from '@/composables/useSharedWeatherTheme'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const router = useRouter()
const { weatherTheme: dashboardTheme } = useSharedWeatherTheme()

const { user } = storeToRefs(authStore)

const activeTab = ref('products')
const health = ref(null)
const isChecking = ref(false)
const isResetting = ref(false)
const isResetDialogOpen = ref(false)
const refreshKey = ref(0)
const notice = ref(null)
const labEntry = ref(null)

const dataCount = computed(() => (health.value ? health.value.productCount + health.value.postCount : '—'))

let noticeTimer

function showNotice(payload) {
  notice.value = payload
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 3500)
}

function moveToLab() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  labEntry.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

async function checkHealth() {
  isChecking.value = true

  try {
    health.value = await systemApi.getHealth()
  } catch (error) {
    health.value = null
    showNotice({ type: 'error', message: error.message })
  } finally {
    isChecking.value = false
  }
}

async function resetAllData() {
  isResetting.value = true

  try {
    const result = await systemApi.reset()
    refreshKey.value += 1
    await checkHealth()
    showNotice({ type: 'success', message: result.message })
  } catch (error) {
    showNotice({ type: 'error', message: error.message })
  } finally {
    isResetting.value = false
    isResetDialogOpen.value = false
  }
}

async function logout() {
  authStore.logout()
  await router.replace({ name: 'Login' })
}

onMounted(async () => {
  try {
    await authStore.fetchMyProfile()
    await checkHealth()
  } catch {
    await router.replace({ name: 'Login' })
  }
})

onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>

<template>
  <div class="dashboard-scene" :style="dashboardTheme.cssVariables" :data-theme="dashboardTheme.name">
    <div class="dashboard-atmosphere" aria-hidden="true"></div>

    <main class="dashboard-shell">
      <section class="session-hero" aria-labelledby="dashboard-title">
        <div class="session-status" :class="{ 'is-online': health }">
          <span aria-hidden="true"></span>
          {{ health ? 'Mock API 연결됨' : '연결 상태 확인 중' }}
        </div>

        <h1 id="dashboard-title">
          {{ user?.name || '사용자' }}님,<br />
          API 실습을 시작해 볼까요?
        </h1>
        <p class="session-description">인증 상태를 확인하고 상품과 게시글 데이터를 직접 조회·등록·수정·삭제할 수 있습니다.</p>

        <dl class="session-metrics">
          <div>
            <dt>계정</dt>
            <dd>{{ user?.email || '확인 중' }}</dd>
          </div>
          <div>
            <dt>권한</dt>
            <dd>{{ user?.role || '—' }}</dd>
          </div>
          <div>
            <dt>인증</dt>
            <dd>JWT</dd>
          </div>
          <div>
            <dt>전체 데이터</dt>
            <dd>{{ dataCount }}<span v-if="health">개</span></dd>
          </div>
        </dl>

        <div class="session-actions">
          <button class="quiet-action" type="button" @click="moveToLab">
            상품·게시글 실습 열기
            <i aria-hidden="true"></i>
          </button>
          <button class="quiet-action" type="button" @click="logout">로그아웃</button>
        </div>
      </section>

      <section ref="labEntry" class="api-section" aria-labelledby="api-lab-title">
        <header class="api-heading">
          <div>
            <p>MOCK API WORKSPACE</p>
            <h2 id="api-lab-title">데이터 실습</h2>
            <span>상품과 게시글 데이터를 자유롭게 변경하고 REST API의 흐름을 확인하세요.</span>
          </div>

          <div class="api-connection" aria-live="polite">
            <span :class="{ 'is-online': health }" aria-hidden="true"></span>
            <div>
              <strong>{{ health ? 'API 정상' : '연결 확인 필요' }}</strong>
              <small v-if="health">상품 {{ health.productCount }} · 게시글 {{ health.postCount }}</small>
              <small v-else>localhost:3001</small>
            </div>
            <button type="button" :disabled="isChecking" @click="checkHealth">{{ isChecking ? '확인 중' : '새로 확인' }}</button>
          </div>
        </header>

        <div class="lab-controls">
          <nav class="lab-tabs" aria-label="API 실습 선택">
            <button type="button" :class="{ 'is-active': activeTab === 'products' }" :aria-pressed="activeTab === 'products'" @click="activeTab = 'products'">상품 API</button>
            <button type="button" :class="{ 'is-active': activeTab === 'posts' }" :aria-pressed="activeTab === 'posts'" @click="activeTab = 'posts'">게시글 API</button>
          </nav>

          <button class="reset-button" type="button" :disabled="isResetting" @click="isResetDialogOpen = true">
            {{ isResetting ? '초기화 중' : '데이터 초기화' }}
          </button>
        </div>

        <Transition name="notice">
          <StatusBanner v-if="notice" :type="notice.type" :message="notice.message" />
        </Transition>

        <ProductManager v-if="activeTab === 'products'" :refresh-key="refreshKey" @notify="showNotice" @changed="checkHealth" />
        <PostManager v-else :refresh-key="refreshKey" @notify="showNotice" @changed="checkHealth" />
      </section>
    </main>

    <ConfirmDialog
      :open="isResetDialogOpen"
      :busy="isResetting"
      danger
      title="모든 실습 데이터를 초기화할까요?"
      message="추가하거나 수정한 상품과 게시글이 삭제되고 처음 제공된 데이터로 돌아갑니다."
      confirm-label="전체 초기화"
      @cancel="isResetDialogOpen = false"
      @confirm="resetAllData"
    />
  </div>
</template>

<style scoped>
.dashboard-scene {
  position: relative;
  min-height: 100svh;
  overflow: clip;
  isolation: isolate;
  background:
    radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--weather-accent) 24%, transparent) 0%, transparent 31%),
    radial-gradient(ellipse at 14% 88%, color-mix(in srgb, var(--hero-end) 72%, transparent) 0%, transparent 52%),
    linear-gradient(158deg, var(--hero-start) 0%, color-mix(in srgb, var(--hero-start) 54%, var(--hero-end)) 52%, var(--hero-end) 100%);
  color: var(--hero-text);
}

.dashboard-scene::before,
.dashboard-scene::after,
.dashboard-atmosphere {
  position: absolute;
  pointer-events: none;
  content: '';
}

.dashboard-scene::before {
  z-index: -2;
  inset: -18% -14% -8%;
  background:
    radial-gradient(ellipse at 12% 28%, rgba(255, 255, 255, 0.34) 0 6%, transparent 28%), radial-gradient(ellipse at 52% 20%, rgba(255, 255, 255, 0.2) 0 8%, transparent 31%),
    radial-gradient(ellipse at 88% 38%, color-mix(in srgb, var(--weather-accent) 22%, transparent) 0 7%, transparent 30%);
  filter: blur(34px);
  opacity: 0.82;
  animation: dashboard-atmosphere-drift 22s ease-in-out infinite alternate;
}

.dashboard-scene::after {
  z-index: -1;
  right: -22%;
  bottom: -14%;
  left: -22%;
  height: 56%;
  background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--weather-accent) 26%, transparent) 0%, transparent 62%), linear-gradient(to top, rgba(255, 255, 255, 0.13), transparent 72%);
  filter: blur(58px);
  opacity: 0.72;
}

.dashboard-atmosphere {
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, 0.22), transparent 48%), linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 48%, rgba(255, 255, 255, 0.07));
}

@keyframes dashboard-atmosphere-drift {
  from {
    transform: translate3d(-1.5%, -0.5%, 0) scale(1);
  }

  to {
    transform: translate3d(1.5%, 0.8%, 0) scale(1.035);
  }
}

.dashboard-shell {
  width: min(1040px, calc(100% - 40px));
  margin: 0 auto;
  padding-bottom: calc(130px + env(safe-area-inset-bottom));
}

.session-hero {
  display: grid;
  min-height: 100svh;
  place-items: center;
  align-content: center;
  padding: clamp(48px, 8svh, 86px) 0 var(--floating-nav-clearance, 120px);
  text-align: center;
}

.session-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 820;
  letter-spacing: 0.03em;
}

.session-status > span,
.api-connection > span {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: color-mix(in srgb, var(--hero-muted) 44%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--hero-muted) 8%, transparent);
}

.session-status.is-online > span,
.api-connection > span.is-online {
  background: #3f6f5d;
  box-shadow: 0 0 0 4px rgba(63, 111, 93, 0.12);
}

.session-hero h1 {
  max-width: 820px;
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(42px, 6.8vw, 72px);
  line-height: 1.02;
  letter-spacing: -0.06em;
}

.session-description {
  max-width: 560px;
  margin: 20px auto 0;
  color: var(--hero-muted);
  font-size: 14px;
  line-height: 1.75;
}

.session-metrics {
  display: grid;
  width: min(860px, 100%);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: clamp(32px, 5svh, 52px) 0 0;
  padding: 14px 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 17%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 17%, transparent);
}

.session-metrics > div {
  position: relative;
  min-width: 0;
  padding: 7px 18px;
}

.session-metrics > div + div::before {
  position: absolute;
  top: 10%;
  bottom: 10%;
  left: 0;
  width: 1px;
  background: color-mix(in srgb, var(--hero-text) 15%, transparent);
  content: '';
}

.session-metrics dt {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 780;
}

.session-metrics dd {
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--hero-text);
  font-size: 14px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-metrics dd span {
  margin-left: 2px;
  font-size: 10px;
}

.session-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

.quiet-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 7px;
  padding: 0 9px;
  border: 0;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 820;
}

.quiet-action i {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentcolor;
  border-bottom: 1.5px solid currentcolor;
  transform: rotate(45deg) translateY(-2px);
}

.api-section {
  scroll-margin-top: 36px;
  padding-top: clamp(38px, 7svh, 76px);
}

.api-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
  padding: 0 4px;
}

.api-heading p {
  margin: 0 0 4px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.api-heading h2 {
  margin: 0;
  font-size: clamp(25px, 3.5vw, 38px);
  line-height: 1.1;
  letter-spacing: -0.045em;
}

.api-heading > div:first-child {
  max-width: 600px;
}

.api-heading > div > span {
  display: block;
  margin-top: 8px;
  line-height: 1.6;
}

.api-connection {
  display: grid;
  min-width: 280px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.17), rgba(255, 255, 255, 0.075));
  box-shadow: 0 10px 30px rgba(27, 42, 47, 0.045);
  backdrop-filter: blur(16px) saturate(110%);
  -webkit-backdrop-filter: blur(16px) saturate(110%);
}

.api-connection div {
  display: grid;
}

.api-connection strong {
  font-size: 11px;
}

.api-connection small {
  color: var(--hero-muted);
  font-size: 10px;
}

.api-connection button {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 10px;
  background: transparent;
  color: var(--hero-text);
  cursor: pointer;
  font-size: 11px;
  font-weight: 820;
}

.api-connection button:disabled,
.reset-button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.lab-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 28px;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
}

.lab-tabs {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border-radius: 15px;
  background: color-mix(in srgb, var(--hero-text) 5%, transparent);
}

.lab-tabs button {
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 820;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.lab-tabs button.is-active {
  background: color-mix(in srgb, var(--hero-text) 78%, transparent);
  color: white;
}

.reset-button {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: color-mix(in srgb, #823e38 86%, var(--hero-text));
  cursor: pointer;
  font-size: 11px;
  font-weight: 820;
}

.notice-enter-active,
.notice-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (hover: hover) and (pointer: fine) {
  .quiet-action:hover,
  .reset-button:hover {
    color: var(--hero-text);
  }

  .api-connection button:hover:not(:disabled) {
    background: color-mix(in srgb, white 34%, transparent);
  }
}

@media (max-width: 700px) {
  .dashboard-shell {
    width: min(100% - 28px, 1040px);
  }

  .session-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .session-metrics > div:nth-child(3)::before {
    display: none;
  }

  .session-metrics > div:nth-child(n + 3) {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  }

  .api-heading {
    align-items: flex-start;
  }

  .api-heading {
    flex-direction: column;
  }

  .api-connection {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 520px) {
  .session-hero {
    align-content: start;
    padding-top: clamp(58px, 10svh, 88px);
  }

  .session-hero h1 {
    font-size: clamp(38px, 12vw, 54px);
  }

  .session-metrics > div {
    padding: 10px;
  }

  .session-metrics dd {
    font-size: 12px;
  }

  .session-actions {
    flex-wrap: wrap;
  }

  .lab-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .lab-tabs {
    width: 100%;
  }

  .reset-button {
    align-self: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-scene::before {
    animation: none;
  }

  .lab-tabs button,
  .notice-enter-active,
  .notice-leave-active {
    transition: none;
  }
}
</style>
