<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import WeatherScene from '@/components/common/WeatherScene.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const mode = ref('login')
const notice = ref('')
const credentials = reactive({ email: '', password: '' })

const isSignUp = computed(() => mode.value === 'signup')
const isGoogleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true'
const submitLabel = computed(() => {
  if (authStore.isLoading) return isSignUp.value ? '계정을 만드는 중' : '로그인하는 중'
  return isSignUp.value ? '계정 만들기' : '로그인'
})

function resolveRedirect() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/trips'
}

async function submit() {
  notice.value = ''

  if (isSignUp.value) {
    const result = await authStore.signUp(credentials.email, credentials.password)
    if (!result) return

    if (authStore.isLoggedIn) {
      await router.replace(resolveRedirect())
      return
    }

    notice.value = '확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.'
    mode.value = 'login'
    return
  }

  const succeeded = await authStore.login(credentials.email, credentials.password)
  if (succeeded) await router.replace(resolveRedirect())
}

async function continueWithGoogle() {
  await authStore.signInWithGoogle(resolveRedirect())
}

function switchMode() {
  mode.value = isSignUp.value ? 'login' : 'signup'
  notice.value = ''
  authStore.clearError()
}
</script>

<template>
  <WeatherScene>
    <div class="login-shell">
      <section class="login-panel" aria-labelledby="login-title">
        <header class="login-intro">
          <h1 id="login-title">{{ isSignUp ? '계정 만들기' : '로그인' }}</h1>
          <p>저장한 여행과 날씨 준비를 이어서 확인하세요.</p>
        </header>

        <div v-if="!authStore.isConfigured" class="configuration-notice" role="status">로그인 서비스 설정이 필요합니다.</div>

        <form class="login-form" :aria-busy="authStore.isLoading" @submit.prevent="submit">
          <div class="credential-fields">
            <label>
              <span>이메일</span>
              <input v-model.trim="credentials.email" name="email" type="email" inputmode="email" autocomplete="email" required />
            </label>
            <label>
              <span>비밀번호</span>
              <input v-model="credentials.password" name="password" type="password" :autocomplete="isSignUp ? 'new-password' : 'current-password'" minlength="6" required />
            </label>
          </div>

          <p v-if="authStore.errorMessage" class="form-message is-error" role="alert">{{ authStore.errorMessage }}</p>
          <p v-if="notice" class="form-message" role="status">{{ notice }}</p>

          <button class="login-button" type="submit" :disabled="authStore.isLoading || !authStore.isConfigured">
            <span v-if="authStore.isLoading" class="login-spinner" aria-hidden="true"></span>
            {{ submitLabel }}
          </button>
        </form>

        <template v-if="isGoogleAuthEnabled">
          <div class="login-divider"><span>또는</span></div>

          <button class="google-button" type="button" :disabled="authStore.isLoading || !authStore.isConfigured" @click="continueWithGoogle">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.35 12.2c0-.64-.06-1.25-.16-1.84H12v3.48h5.25a4.48 4.48 0 0 1-1.95 2.94v2.26h3.16c1.85-1.7 2.89-4.22 2.89-6.84Z" />
              <path d="M12 21.75c2.64 0 4.86-.87 6.48-2.37l-3.16-2.45c-.88.59-2 .94-3.32.94-2.55 0-4.71-1.72-5.49-4.04H3.25v2.52A9.79 9.79 0 0 0 12 21.75Z" />
              <path d="M6.51 13.83A5.9 5.9 0 0 1 6.2 12c0-.64.11-1.25.31-1.83V7.65H3.25A9.8 9.8 0 0 0 2.2 12c0 1.57.38 3.05 1.05 4.35l3.26-2.52Z" />
              <path d="M12 6.13c1.44 0 2.73.49 3.74 1.46l2.81-2.81A9.43 9.43 0 0 0 12 2.25a9.79 9.79 0 0 0-8.75 5.4l3.26 2.52C7.29 7.85 9.45 6.13 12 6.13Z" />
            </svg>
            Google로 계속하기
          </button>
        </template>

        <button class="mode-button" type="button" @click="switchMode">
          {{ isSignUp ? '이미 계정이 있나요? 로그인' : '처음이신가요? 계정 만들기' }}
        </button>
      </section>
    </div>
  </WeatherScene>
</template>

<style scoped>
.login-shell {
  display: grid;
  width: min(440px, calc(100% - 32px));
  min-height: 100svh;
  place-items: center;
  margin: 0 auto;
  padding: clamp(42px, 8svh, 76px) 0 calc(112px + env(safe-area-inset-bottom));
}

.login-panel {
  width: 100%;
  padding: clamp(24px, 5vw, 32px);
  border: 1px solid color-mix(in srgb, white 26%, transparent);
  border-radius: 24px;
  background: linear-gradient(145deg, color-mix(in srgb, white 15%, transparent), color-mix(in srgb, white 6%, transparent));
  box-shadow: 0 18px 55px rgba(27, 42, 47, 0.08);
  color: var(--hero-text);
  backdrop-filter: blur(24px) saturate(112%);
  -webkit-backdrop-filter: blur(24px) saturate(112%);
}

.login-intro h1 {
  margin: 0;
  font-size: clamp(32px, 8vw, 43px);
  line-height: 1;
  letter-spacing: -0.055em;
}

.login-intro p {
  margin: 12px 0 0;
  color: var(--hero-muted);
  font-size: 13px;
}

.configuration-notice {
  margin-top: 22px;
  padding: 11px 13px;
  border: 1px solid color-mix(in srgb, var(--weather-accent) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--weather-accent) 8%, transparent);
  color: var(--hero-text);
  font-size: 12px;
  font-weight: 760;
}

.login-form {
  display: grid;
  gap: 16px;
  margin-top: 26px;
}

.credential-fields {
  display: grid;
  gap: 13px;
}

.credential-fields label > span {
  display: block;
  margin-bottom: 7px;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 800;
}

.credential-fields input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
  border-radius: 10px;
  outline: none;
  background: color-mix(in srgb, white 14%, transparent);
  color: var(--hero-text);
  font-size: 14px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.credential-fields input:focus {
  border-color: color-mix(in srgb, var(--weather-accent) 62%, transparent);
  background: color-mix(in srgb, white 28%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 13%, transparent);
}

.form-message {
  margin: -2px 0 0;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 720;
}

.form-message.is-error {
  color: color-mix(in srgb, #a33f39 78%, var(--hero-text));
}

.login-button,
.google-button,
.mode-button {
  width: 100%;
  cursor: pointer;
}

.login-button {
  display: flex;
  min-height: 49px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid var(--hero-text);
  border-radius: 10px;
  background: var(--hero-text);
  color: var(--hero-start);
  font-size: 13px;
  font-weight: 840;
}

.login-button:disabled,
.google-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.login-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, currentcolor 32%, transparent);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: login-spin 720ms linear infinite;
}

.login-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin: 20px 0 14px;
  color: color-mix(in srgb, var(--hero-muted) 68%, transparent);
  font-size: 10px;
}

.login-divider::before,
.login-divider::after {
  height: 1px;
  background: color-mix(in srgb, var(--hero-text) 12%, transparent);
  content: '';
}

.google-button {
  display: flex;
  min-height: 47px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, white 13%, transparent);
  color: var(--hero-text);
  font-size: 13px;
  font-weight: 800;
}

.google-button svg {
  width: 17px;
  height: 17px;
}

.google-button svg path:nth-child(1) {
  fill: #4285f4;
}
.google-button svg path:nth-child(2) {
  fill: #34a853;
}
.google-button svg path:nth-child(3) {
  fill: #fbbc05;
}
.google-button svg path:nth-child(4) {
  fill: #ea4335;
}

.mode-button {
  margin-top: 17px;
  padding: 5px;
  border: 0;
  background: transparent;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 760;
}

@keyframes login-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 520px) {
  .login-shell {
    align-items: start;
    padding-top: max(32px, 8svh);
  }

  .login-panel {
    border-radius: 20px;
  }
}
</style>
