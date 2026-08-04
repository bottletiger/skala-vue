<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import WeatherScene from '@/components/common/WeatherScene.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const credentials = reactive({
  email: 'student@skala.com',
  password: '1234',
})

const selectedAccount = computed(() => {
  if (credentials.email === 'student@skala.com') return 'student'
  if (credentials.email === 'admin@skala.com') return 'admin'
  return null
})

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
  <WeatherScene>
    <main class="login-shell">
      <section class="login-panel" aria-labelledby="login-title">
        <header class="login-intro">
          <span>콘텐츠 운영</span>
          <h1 id="login-title">로그인</h1>
        </header>

        <form class="login-form" :aria-busy="authStore.isLoading" @submit.prevent="submitLogin">
          <fieldset class="account-picker">
            <legend>테스트 계정</legend>
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
              <input v-model.trim="credentials.email" name="email" type="email" autocomplete="username" required />
            </label>
            <label>
              <span>비밀번호</span>
              <input v-model="credentials.password" name="password" type="password" autocomplete="current-password" required />
            </label>
          </div>

          <p v-if="authStore.errorMessage" class="error-message" role="alert">
            {{ authStore.errorMessage }}
          </p>

          <button class="login-button" type="submit" :disabled="authStore.isLoading">
            <span v-if="authStore.isLoading" class="login-spinner" aria-hidden="true"></span>
            {{ authStore.isLoading ? '로그인 확인 중' : '로그인' }}
            <i v-if="!authStore.isLoading" aria-hidden="true"></i>
          </button>

          <p class="security-note">테스트 계정 전용 · 실제 비밀번호는 입력하지 마세요.</p>
        </form>
      </section>
    </main>
  </WeatherScene>
</template>

<style scoped>
.login-shell {
  display: grid;
  width: min(470px, calc(100% - 32px));
  min-height: 100svh;
  place-items: center;
  margin: 0 auto;
  padding: clamp(42px, 8svh, 76px) 0 calc(112px + env(safe-area-inset-bottom));
}

.login-panel {
  width: 100%;
  padding: clamp(22px, 4vw, 30px);
  border: 1px solid color-mix(in srgb, white 26%, transparent);
  border-radius: 22px;
  background: linear-gradient(145deg, color-mix(in srgb, white 15%, transparent), color-mix(in srgb, white 6%, transparent));
  box-shadow: 0 18px 55px rgba(27, 42, 47, 0.06);
  backdrop-filter: blur(22px) saturate(112%);
  -webkit-backdrop-filter: blur(22px) saturate(112%);
}

.login-intro {
  display: grid;
  justify-items: start;
  text-align: left;
}

.login-intro > span {
  display: block;
  margin-bottom: 7px;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 820;
  letter-spacing: 0.11em;
}

.login-intro h1 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(32px, 8vw, 43px);
  line-height: 1;
  letter-spacing: -0.055em;
}

.login-form {
  display: grid;
  gap: 18px;
  margin-top: 25px;
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
  gap: 8px;
}

.account-picker button {
  display: grid;
  min-width: 0;
  min-height: 56px;
  align-content: center;
  justify-items: start;
  gap: 1px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, white 7%, transparent);
  color: var(--hero-muted);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;
}

.account-picker button.is-selected {
  border-color: color-mix(in srgb, var(--weather-accent) 42%, transparent);
  background: color-mix(in srgb, var(--weather-accent) 8%, transparent);
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
  opacity: 0.72;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credential-fields {
  display: grid;
  gap: 12px;
}

.credential-fields input {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
  border-radius: 9px;
  outline: none;
  background: color-mix(in srgb, white 14%, transparent);
  color: var(--hero-text);
  font-size: 13px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.credential-fields input:focus {
  border-color: color-mix(in srgb, var(--weather-accent) 62%, transparent);
  background: color-mix(in srgb, white 30%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 13%, transparent);
}

.error-message {
  margin: -3px 0 0;
  color: color-mix(in srgb, #a34f48 82%, var(--hero-text));
  font-size: 12px;
  font-weight: 760;
  text-align: center;
}

.login-button {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid var(--hero-text);
  border-radius: 9px;
  background: var(--hero-text);
  color: var(--hero-start);
  cursor: pointer;
  font-size: 13px;
  font-weight: 840;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.login-button:disabled {
  cursor: wait;
  opacity: 0.58;
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
  border: 2px solid color-mix(in srgb, currentcolor 32%, transparent);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: login-spin 720ms linear infinite;
}

@keyframes login-spin {
  to {
    transform: rotate(1turn);
  }
}

.security-note {
  margin: -7px 0 0;
  color: color-mix(in srgb, var(--hero-muted) 84%, transparent);
  font-size: 10px;
  line-height: 1.5;
  text-align: center;
}

@media (hover: hover) and (pointer: fine) {
  .account-picker button:hover {
    color: var(--hero-text);
  }

  .login-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
}

@media (max-width: 420px) {
  .login-shell {
    width: min(100% - 24px, 470px);
    align-items: start;
    padding-top: clamp(34px, 7svh, 58px);
  }

  .login-panel {
    padding: 20px 17px;
    border-radius: 18px;
  }

  .account-picker button {
    padding-right: 9px;
    padding-left: 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
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
