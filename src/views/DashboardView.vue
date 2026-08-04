<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { systemApi } from '@/api/systemApi.js'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import WeatherScene from '@/components/common/WeatherScene.vue'
import PostManager from '@/components/mock/PostManager.vue'
import ProductManager from '@/components/mock/ProductManager.vue'
import StatusBanner from '@/components/mock/StatusBanner.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const router = useRouter()
const { user } = storeToRefs(authStore)

const activeTab = ref('products')
const health = ref(null)
const healthState = ref('checking')
const isResetting = ref(false)
const isResetDialogOpen = ref(false)
const refreshKey = ref(0)
const notice = ref(null)

const isChecking = computed(() => healthState.value === 'checking')
const userInitial = computed(() => (user.value?.name || user.value?.email || 'U').trim().charAt(0).toUpperCase())
const userRoleLabel = computed(() => {
  const role = user.value?.role?.toUpperCase()

  if (role === 'ADMIN') return '관리자'
  if (role === 'STUDENT') return '수강생'
  if (role === 'USER') return '사용자'
  return user.value?.role || '권한 확인 중'
})
const healthLabel = computed(() => {
  if (healthState.value === 'checking') return '연결 확인 중'
  if (healthState.value === 'online') return 'API 연결됨'
  return 'API 연결 실패'
})

let noticeTimer

function showNotice(payload) {
  notice.value = payload
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 3500)
}

async function checkHealth() {
  healthState.value = 'checking'

  try {
    health.value = await systemApi.getHealth()
    healthState.value = 'online'
  } catch (error) {
    health.value = null
    healthState.value = 'offline'
    showNotice({ type: 'error', message: error.message })
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
  <WeatherScene>
    <main class="dashboard-shell">
      <header class="operations-header" aria-labelledby="dashboard-title">
        <div class="operations-topbar">
          <div class="operations-heading">
            <span>콘텐츠 운영</span>
            <h1 id="dashboard-title">대시보드</h1>
          </div>

          <button
            class="connection-control"
            :class="`is-${healthState}`"
            type="button"
            :disabled="isChecking"
            :aria-label="`${healthLabel}. ${isChecking ? '응답을 확인하고 있습니다' : 'API 연결 상태 새로고침'}`"
            aria-live="polite"
            @click="checkHealth"
          >
            <span class="status-dot" aria-hidden="true"></span>
            <span>
              <strong>{{ healthLabel }}</strong>
              <small>{{ isChecking ? '응답 확인 중' : '상태 새로고침' }}</small>
            </span>
            <i aria-hidden="true"></i>
          </button>

          <div class="account-toolbar">
            <div class="account-summary">
              <span class="account-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="account-copy">
                <strong>{{ user?.name || '사용자' }}</strong>
                <small>{{ user?.email || '계정 확인 중' }}</small>
              </span>
              <span class="role-label" :data-role="user?.role">{{ userRoleLabel }}</span>
            </div>
            <button class="logout-button" type="button" @click="logout">로그아웃</button>
          </div>
        </div>

        <div class="operations-controls">
          <nav class="lab-tabs" aria-label="데이터 유형 선택">
            <button type="button" :class="{ 'is-active': activeTab === 'products' }" :aria-pressed="activeTab === 'products'" @click="activeTab = 'products'">
              <span>상품 API</span>
              <strong>{{ health?.productCount ?? '—' }}</strong>
            </button>
            <button type="button" :class="{ 'is-active': activeTab === 'posts' }" :aria-pressed="activeTab === 'posts'" @click="activeTab = 'posts'">
              <span>게시글 API</span>
              <strong>{{ health?.postCount ?? '—' }}</strong>
            </button>
          </nav>

          <button class="reset-button" type="button" :disabled="isResetting" @click="isResetDialogOpen = true">
            {{ isResetting ? '초기화 중' : '데이터 초기화' }}
          </button>
        </div>
      </header>

      <section class="api-section" aria-labelledby="dashboard-title">
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
      title="모든 데이터를 초기화할까요?"
      message="추가하거나 수정한 상품과 게시글이 삭제되고 처음 제공된 데이터로 돌아갑니다."
      confirm-label="전체 초기화"
      @cancel="isResetDialogOpen = false"
      @confirm="resetAllData"
    />
  </WeatherScene>
</template>

<style src="../assets/collection-manager.css"></style>

<style scoped>
.dashboard-shell {
  width: min(1160px, calc(100% - 40px));
  min-height: 100svh;
  margin: 0 auto;
  padding: clamp(28px, 5svh, 52px) 0 calc(132px + env(safe-area-inset-bottom));
}

.operations-header {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, white 26%, transparent);
  border-radius: 22px;
  background: linear-gradient(145deg, color-mix(in srgb, white 15%, transparent), color-mix(in srgb, white 6%, transparent));
  box-shadow: 0 18px 55px rgba(27, 42, 47, 0.06);
  backdrop-filter: blur(22px) saturate(112%);
  -webkit-backdrop-filter: blur(22px) saturate(112%);
}

.operations-topbar {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) auto auto;
  align-items: center;
  gap: clamp(18px, 3vw, 34px);
  padding: 23px 25px 21px;
}

.operations-heading > span {
  display: block;
  margin-bottom: 6px;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 820;
  letter-spacing: 0.11em;
}

.operations-heading h1 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(34px, 4.4vw, 46px);
  line-height: 1;
  letter-spacing: -0.055em;
}

.connection-control {
  display: grid;
  grid-template-columns: 8px auto 15px;
  align-items: center;
  gap: 10px;
  min-width: 154px;
  min-height: 46px;
  padding: 5px 8px;
  border: 0;
  border-radius: 10px;
  outline: none;
  background: transparent;
  color: var(--hero-text);
  cursor: pointer;
  text-align: left;
  transition:
    background-color 160ms ease,
    opacity 160ms ease;
}

.connection-control > span:not(.status-dot) {
  display: grid;
  gap: 1px;
}

.connection-control strong {
  font-size: 11px;
  font-weight: 820;
}

.connection-control small {
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 680;
}

.connection-control i {
  position: relative;
  width: 13px;
  height: 13px;
  border: 1.5px solid currentcolor;
  border-left-color: transparent;
  border-radius: 50%;
  opacity: 0.52;
}

.connection-control i::after {
  position: absolute;
  top: -2px;
  left: -1px;
  width: 4px;
  height: 4px;
  border-top: 1.5px solid currentcolor;
  border-left: 1.5px solid currentcolor;
  content: '';
  transform: rotate(-18deg);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--hero-muted) 46%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--hero-muted) 8%, transparent);
}

.connection-control.is-online .status-dot {
  background: #3f6f5d;
  box-shadow: 0 0 0 4px rgba(63, 111, 93, 0.12);
}

.connection-control.is-offline .status-dot {
  background: #a34f48;
  box-shadow: 0 0 0 4px rgba(163, 79, 72, 0.12);
}

.connection-control.is-checking .status-dot {
  animation: status-pulse 900ms ease-in-out infinite alternate;
}

.connection-control:disabled {
  cursor: wait;
}

@keyframes status-pulse {
  to {
    opacity: 0.36;
  }
}

.account-toolbar,
.account-summary {
  display: flex;
  align-items: center;
}

.account-toolbar {
  gap: 12px;
  padding-left: clamp(18px, 2.5vw, 30px);
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.account-summary {
  min-width: 0;
  gap: 10px;
}

.account-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid color-mix(in srgb, white 28%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--hero-text) 9%, transparent);
  color: var(--hero-text);
  font-size: 11px;
  font-weight: 850;
}

.account-copy {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.account-copy strong {
  overflow: hidden;
  max-width: 130px;
  font-size: 11px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-copy small {
  overflow: hidden;
  max-width: 150px;
  color: var(--hero-muted);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-label {
  padding-left: 10px;
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 780;
  white-space: nowrap;
}

.logout-button {
  min-height: 34px;
  padding: 0 6px;
  border: 0;
  border-radius: 8px;
  outline: none;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 10px;
  font-weight: 780;
}

.operations-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 55px;
  padding: 0 17px 0 14px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 11%, transparent);
  background: color-mix(in srgb, var(--hero-text) 3%, transparent);
}

.lab-tabs {
  display: flex;
  align-self: stretch;
  gap: 3px;
}

.lab-tabs button {
  position: relative;
  display: flex;
  min-width: 118px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 17px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 780;
  transition: color 180ms ease;
}

.lab-tabs button.is-active {
  color: var(--hero-text);
}

.lab-tabs button.is-active::after {
  position: absolute;
  right: 14px;
  bottom: 0;
  left: 14px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--hero-text);
  content: '';
}

.lab-tabs strong {
  min-width: 19px;
  padding: 2px 5px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--hero-text) 7%, transparent);
  color: inherit;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.reset-button {
  min-height: 35px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, #98524b 34%, transparent);
  border-radius: 9px;
  outline: none;
  background: color-mix(in srgb, #98524b 9%, transparent);
  color: color-mix(in srgb, #bd5d55 62%, var(--hero-text));
  cursor: pointer;
  font-size: 10px;
  font-weight: 820;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.reset-button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.api-section {
  min-width: 0;
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
  .connection-control:hover:not(:disabled),
  .logout-button:hover {
    background: color-mix(in srgb, white 10%, transparent);
    color: var(--hero-text);
  }

  .lab-tabs button:hover {
    color: var(--hero-text);
  }

  .reset-button:hover:not(:disabled) {
    border-color: color-mix(in srgb, #98524b 52%, transparent);
    background: color-mix(in srgb, #98524b 16%, transparent);
    color: color-mix(in srgb, #b6534b 72%, var(--hero-text));
  }
}

@media (max-width: 940px) {
  .operations-topbar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .account-toolbar {
    grid-column: 1 / -1;
    justify-content: space-between;
    padding-top: 16px;
    padding-left: 0;
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
    border-left: 0;
  }
}

@media (max-width: 720px) {
  .dashboard-shell {
    width: min(100% - 28px, 1160px);
  }

  .operations-topbar {
    padding: 20px;
  }

  .operations-controls {
    padding-right: 12px;
    padding-left: 7px;
  }
}

@media (max-width: 520px) {
  .dashboard-shell {
    padding-top: 20px;
  }

  .operations-topbar {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }

  .connection-control {
    justify-self: start;
    margin-left: -8px;
  }

  .account-toolbar {
    grid-column: auto;
  }

  .account-copy small {
    max-width: 132px;
  }

  .lab-tabs {
    min-width: 0;
    flex: 1;
  }

  .lab-tabs button {
    min-width: 0;
    flex: 1;
    padding: 0 8px;
  }

  .lab-tabs button strong,
  .role-label {
    display: none;
  }

  .reset-button {
    flex: 0 0 auto;
    padding: 0 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .connection-control.is-checking .status-dot {
    animation: none;
  }

  .connection-control,
  .lab-tabs button,
  .reset-button,
  .notice-enter-active,
  .notice-leave-active {
    transition: none;
  }
}

.connection-control:focus-visible,
.logout-button:focus-visible,
.lab-tabs button:focus-visible,
.reset-button:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 24%, transparent);
}

.reset-button:focus-visible {
  border-color: color-mix(in srgb, #98524b 65%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, #98524b 18%, transparent);
}
</style>
