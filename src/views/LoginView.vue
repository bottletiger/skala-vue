<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import FlowSteps from '@/components/auth/FlowSteps.vue'
import { useSharedWeatherTheme } from '@/composables/useSharedWeatherTheme'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { weatherTheme: loginTheme } = useSharedWeatherTheme()

const credentials = reactive({
  email: 'student@skala.com',
  password: '1234',
})

const selectedAccount = computed(() => (credentials.email === 'admin@skala.com' ? 'admin' : 'student'))

async function submitLogin() {
  const succeeded = await authStore.login(credentials.email, credentials.password)
  if (!succeeded) return

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
  await router.replace(redirect)
}

function useAccount(type) {
  if (type === 'admin') {
    credentials.email = 'admin@skala.com'
    credentials.password = 'admin1234'
    return
  }

  credentials.email = 'student@skala.com'
  credentials.password = '1234'
}
</script>

<template>
  <div class="login-scene" :style="loginTheme.cssVariables" :data-theme="loginTheme.name">
    <div class="login-atmosphere" aria-hidden="true"></div>

    <main class="login-shell">
      <section class="login-stage" aria-labelledby="login-title">
        <header class="login-intro">
          <p class="eyebrow">WEATHER · API LAB</p>
          <h1 id="login-title">실습을 시작합니다</h1>
          <p>수업용 계정으로 로그인하면 상품과 게시글 API를 직접 조회하고 변경할 수 있습니다.</p>
        </header>

        <form class="login-form" @submit.prevent="submitLogin">
          <fieldset class="account-picker">
            <legend>사용할 계정</legend>
            <div>
              <button type="button" :class="{ 'is-selected': selectedAccount === 'student' }" :aria-pressed="selectedAccount === 'student'" @click="useAccount('student')">
                <span>수강생</span>
                <small>student@skala.com</small>
              </button>
              <button type="button" :class="{ 'is-selected': selectedAccount === 'admin' }" :aria-pressed="selectedAccount === 'admin'" @click="useAccount('admin')">
                <span>관리자</span>
                <small>admin@skala.com</small>
              </button>
            </div>
          </fieldset>

          <div class="credential-fields">
            <label>
              <span>이메일</span>
              <input v-model.trim="credentials.email" type="email" autocomplete="username" required />
            </label>
            <label>
              <span>비밀번호</span>
              <input v-model="credentials.password" type="password" autocomplete="current-password" required />
            </label>
          </div>

          <p v-if="authStore.errorMessage" class="error-message" role="alert">
            {{ authStore.errorMessage }}
          </p>

          <button class="login-button" :disabled="authStore.isLoading">
            <span v-if="authStore.isLoading" class="login-spinner" aria-hidden="true"></span>
            {{ authStore.isLoading ? '로그인 확인 중' : '대시보드로 이동' }}
            <i v-if="!authStore.isLoading" aria-hidden="true"></i>
          </button>
        </form>

        <FlowSteps class="login-journey" />
        <p class="security-note">수업용 Mock 인증 환경입니다. 실제 사용하는 계정 정보는 입력하지 마세요.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.login-scene {
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

.login-scene::before,
.login-scene::after,
.login-atmosphere {
  position: absolute;
  pointer-events: none;
  content: '';
}

.login-scene::before {
  z-index: -2;
  inset: -18% -14% -8%;
  background:
    radial-gradient(ellipse at 12% 28%, rgba(255, 255, 255, 0.34) 0 6%, transparent 28%), radial-gradient(ellipse at 52% 20%, rgba(255, 255, 255, 0.2) 0 8%, transparent 31%),
    radial-gradient(ellipse at 88% 38%, color-mix(in srgb, var(--weather-accent) 22%, transparent) 0 7%, transparent 30%);
  filter: blur(34px);
  opacity: 0.82;
  animation: login-atmosphere-drift 22s ease-in-out infinite alternate;
}

.login-scene::after {
  z-index: -1;
  right: -22%;
  bottom: -20%;
  left: -22%;
  height: 62%;
  background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--weather-accent) 26%, transparent) 0%, transparent 62%), linear-gradient(to top, rgba(255, 255, 255, 0.13), transparent 72%);
  filter: blur(58px);
  opacity: 0.72;
}

.login-atmosphere {
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, 0.22), transparent 48%), linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 48%, rgba(255, 255, 255, 0.07));
}

@keyframes login-atmosphere-drift {
  from {
    transform: translate3d(-1.5%, -0.5%, 0) scale(1);
  }

  to {
    transform: translate3d(1.5%, 0.8%, 0) scale(1.035);
  }
}

.login-shell {
  width: min(820px, calc(100% - 40px));
  min-height: 100svh;
  margin: 0 auto;
}

.login-stage {
  display: grid;
  min-height: 100svh;
  align-content: center;
  padding: clamp(42px, 7svh, 78px) 0 calc(126px + env(safe-area-inset-bottom));
}

.login-intro {
  max-width: 660px;
  margin: 0 auto;
  text-align: center;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.login-intro h1 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(38px, 6vw, 64px);
  line-height: 1.04;
  letter-spacing: -0.055em;
}

.login-intro > p:last-child {
  max-width: 520px;
  margin: 16px auto 0;
  color: var(--hero-muted);
  font-size: 14px;
  line-height: 1.75;
}

.login-form {
  width: min(520px, 100%);
  margin: clamp(26px, 4.5svh, 42px) auto 0;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.09));
  box-shadow:
    0 18px 50px rgba(27, 42, 47, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(18px) saturate(112%);
  -webkit-backdrop-filter: blur(18px) saturate(112%);
}

.account-picker {
  margin: 0;
  padding: 0;
  border: 0;
}

.account-picker legend,
.credential-fields label > span {
  display: block;
  margin: 0 0 7px;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 800;
}

.account-picker > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 4px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--hero-text) 5%, transparent);
}

.account-picker button {
  display: grid;
  min-width: 0;
  min-height: 58px;
  align-content: center;
  justify-items: start;
  gap: 1px;
  padding: 8px 13px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  text-align: left;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.account-picker button.is-selected {
  background: color-mix(in srgb, white 60%, transparent);
  box-shadow: 0 5px 16px rgba(27, 42, 47, 0.06);
  color: var(--hero-text);
}

.account-picker button span {
  font-size: 13px;
  font-weight: 820;
}

.account-picker button small {
  max-width: 100%;
  overflow: hidden;
  font-size: 10px;
  opacity: 0.7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credential-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.credential-fields label {
  min-width: 0;
}

.credential-fields input {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 13px;
  outline: none;
  background: rgba(255, 255, 255, 0.2);
  color: var(--hero-text);
  font-size: 13px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.credential-fields input:focus {
  border-color: color-mix(in srgb, var(--weather-accent) 58%, transparent);
  background: rgba(255, 255, 255, 0.34);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 12%, transparent);
}

.error-message {
  margin: 14px 0 0;
  color: #823e38;
  font-size: 12px;
  font-weight: 750;
  text-align: center;
}

.login-button {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 18px;
  border: 0;
  border-radius: 14px;
  background: color-mix(in srgb, var(--hero-text) 78%, transparent);
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 820;
  transition:
    transform 180ms ease,
    background-color 180ms ease;
}

.login-button:disabled {
  cursor: wait;
  opacity: 0.64;
}

.login-button i {
  width: 7px;
  height: 7px;
  border-top: 1.5px solid currentcolor;
  border-right: 1.5px solid currentcolor;
  transform: rotate(45deg);
}

.login-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.34);
  border-top-color: white;
  border-radius: 50%;
  animation: login-spin 720ms linear infinite;
}

@keyframes login-spin {
  to {
    transform: rotate(1turn);
  }
}

.login-journey {
  margin-top: clamp(26px, 4.5svh, 42px);
}

.security-note {
  margin: 19px 0 0;
  color: color-mix(in srgb, var(--hero-muted) 82%, transparent);
  font-size: 10px;
  text-align: center;
}

@media (hover: hover) and (pointer: fine) {
  .account-picker button:hover {
    color: var(--hero-text);
    transform: translateY(-1px);
  }

  .login-button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--hero-text) 88%, transparent);
    transform: translateY(-1px);
  }
}

@media (max-width: 620px) {
  .login-shell {
    width: min(100% - 28px, 820px);
  }

  .login-stage {
    align-content: start;
    padding-top: clamp(48px, 8svh, 74px);
  }

  .login-form {
    padding: 18px;
    border-radius: 21px;
  }

  .credential-fields {
    grid-template-columns: 1fr;
  }

  .login-intro > p:last-child {
    font-size: 13px;
  }
}

@media (max-width: 380px) {
  .account-picker button {
    padding-right: 9px;
    padding-left: 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-scene::before,
  .login-spinner {
    animation: none;
  }

  .account-picker button,
  .login-button,
  .credential-fields input {
    transition: none;
  }
}
</style>
