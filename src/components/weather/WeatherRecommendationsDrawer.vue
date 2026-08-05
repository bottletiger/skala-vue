<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import WeatherAdvicePanel from '@/components/weather/WeatherAdvicePanel.vue'
import WeatherPlaylistPanel from '@/components/weather/WeatherPlaylistPanel.vue'
import { getWeatherAdvice } from '@/services/tripsService'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  weather: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const drawerHeading = ref(null)
const weatherAdvice = ref(null)
const isAdviceLoading = ref(false)
const adviceErrorMessage = ref('')
let adviceRequestId = 0

const weatherName = computed(() => props.weather?.displayName || props.weather?.name || '선택한 도시')

const syncDocumentState = (open) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('recommendation-drawer-open', open)
}

const resetAdvice = () => {
  adviceRequestId += 1
  weatherAdvice.value = null
  isAdviceLoading.value = false
  adviceErrorMessage.value = ''
}

const requestWeatherAdvice = async () => {
  if (!authStore.isLoggedIn) {
    await router.push({ name: 'Login', query: { redirect: route.fullPath } })
    emit('close')
    return
  }
  if (!props.weather || isAdviceLoading.value) return

  isAdviceLoading.value = true
  adviceErrorMessage.value = ''
  const requestId = ++adviceRequestId

  try {
    const response = await getWeatherAdvice({
      location: {
        name: weatherName.value,
        countryName: props.weather.countryName,
      },
      weather: props.weather,
      forecast: [],
    })
    if (requestId === adviceRequestId) weatherAdvice.value = response?.advice ?? response
  } catch (error) {
    if (requestId === adviceRequestId) adviceErrorMessage.value = error?.message || '맞춤 날씨 안내를 만들지 못했습니다.'
  } finally {
    if (requestId === adviceRequestId) isAdviceLoading.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    syncDocumentState(open)
    if (!open) return
    await nextTick()
    drawerHeading.value?.focus({ preventScroll: true })
  },
  { immediate: true },
)

watch(
  () => props.weather?.id,
  () => resetAdvice(),
)

onBeforeUnmount(() => {
  syncDocumentState(false)
  resetAdvice()
})
</script>

<template>
  <Transition name="recommendation-drawer">
    <div v-if="open" class="recommendation-drawer-layer">
      <button class="recommendation-drawer-backdrop" type="button" aria-label="오늘의 추천 서랍 닫기" @click="emit('close')"></button>

      <section id="weather-recommendation-drawer" class="recommendation-drawer" aria-labelledby="weather-recommendation-title" @keydown.esc="emit('close')">
        <header class="recommendation-drawer-header">
          <div>
            <span>FOR TODAY</span>
            <h2 id="weather-recommendation-title" ref="drawerHeading" tabindex="-1">오늘의 추천</h2>
            <p>{{ weather ? `${weatherName} 기준으로 준비했어요.` : '선택한 도시의 날씨를 불러오는 중입니다.' }}</p>
          </div>
          <button type="button" class="recommendation-close-button" aria-label="오늘의 추천 서랍 닫기" @click="emit('close')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        </header>

        <div class="recommendation-drawer-rail">
          <div v-if="weather" class="recommendation-panels">
            <WeatherAdvicePanel :weather="weather" :advice="weatherAdvice" :is-loading="isAdviceLoading" :error-message="adviceErrorMessage" @request="requestWeatherAdvice" />
            <WeatherPlaylistPanel :weather="weather" />
          </div>
          <div v-else class="recommendation-empty" role="status">
            <strong>추천을 준비하고 있습니다.</strong>
            <p>날씨 정보가 표시되면 옷차림과 음악을 함께 보여드릴게요.</p>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
:global(html.recommendation-drawer-open),
:global(html.recommendation-drawer-open body) {
  overflow: hidden;
}

.recommendation-drawer-layer {
  position: fixed;
  z-index: 42;
  inset: 0;
  pointer-events: none;
}

.recommendation-drawer-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 27, 34, 0.1);
  cursor: default;
  pointer-events: auto;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.recommendation-drawer {
  position: absolute;
  display: flex;
  right: 0;
  bottom: var(--world-drawer-bottom);
  left: 0;
  width: var(--floating-nav-width);
  height: var(--world-drawer-height);
  flex-direction: column;
  margin: 0 auto;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 0;
  border-radius: 27px 27px 0 0;
  outline: none;
  background: color-mix(in srgb, var(--hero-start) 18%, transparent);
  box-shadow:
    0 -10px 34px rgba(15, 27, 34, 0.12),
    inset 0 1px 0 color-mix(in srgb, white 20%, transparent);
  color: var(--hero-text);
  overflow: hidden;
  overscroll-behavior: contain;
  pointer-events: auto;
  backdrop-filter: blur(34px) saturate(125%);
  -webkit-backdrop-filter: blur(34px) saturate(125%);
}

.recommendation-drawer-header {
  display: flex;
  position: relative;
  z-index: 1;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  background: color-mix(in srgb, var(--hero-start) 10%, transparent);
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
}

.recommendation-drawer-header span {
  display: block;
  margin-bottom: 3px;
  color: var(--weather-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.14em;
}

.recommendation-drawer-header h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(22px, 4vw, 30px);
  letter-spacing: -0.055em;
  line-height: 1.1;
  outline: none;
}

.recommendation-drawer-header p {
  margin: 7px 0 0;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 700;
}

.recommendation-close-button {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, white 8%, transparent);
  color: var(--hero-text);
  cursor: pointer;
}

.recommendation-close-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.recommendation-close-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: 2px;
}

.recommendation-drawer-rail {
  min-height: 0;
  flex: 1 1 auto;
  padding: 0 16px 24px;
  overflow-y: auto;
  scrollbar-width: none;
}

.recommendation-drawer-rail::-webkit-scrollbar {
  display: none;
}

.recommendation-panels {
  display: grid;
  gap: 0;
}

.recommendation-panels :deep(.advice-panel),
.recommendation-panels :deep(.playlist-panel) {
  margin: 0;
  border-right: 0;
  border-left: 0;
  border-radius: 0;
  box-shadow: none;
}

.recommendation-panels :deep(.advice-panel) {
  padding: 22px 6px 24px;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.recommendation-panels :deep(.playlist-panel) {
  padding: 22px 6px;
}

.recommendation-empty {
  display: grid;
  min-height: 240px;
  align-content: center;
  justify-items: center;
  padding: 28px;
  color: var(--hero-muted);
  text-align: center;
}

.recommendation-empty strong {
  color: var(--hero-text);
  font-size: 15px;
}

.recommendation-empty p {
  margin: 6px 0 0;
  font-size: 11px;
  font-weight: 650;
}

.recommendation-drawer-enter-active,
.recommendation-drawer-leave-active {
  transition: opacity 340ms ease;
}

.recommendation-drawer-enter-active .recommendation-drawer,
.recommendation-drawer-leave-active .recommendation-drawer {
  transition: transform 440ms cubic-bezier(0.22, 1, 0.36, 1);
}

.recommendation-drawer-enter-from,
.recommendation-drawer-leave-to {
  opacity: 0;
}

.recommendation-drawer-enter-from .recommendation-drawer,
.recommendation-drawer-leave-to .recommendation-drawer {
  transform: translateY(calc(100% + 28px));
}

@media (max-width: 560px) {
  .recommendation-drawer {
    border-radius: 26px 26px 0 0;
  }

  .recommendation-drawer-header {
    padding: 18px 16px 14px;
  }

  .recommendation-drawer-rail {
    padding-right: 12px;
    padding-left: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recommendation-drawer-enter-active,
  .recommendation-drawer-leave-active,
  .recommendation-drawer-enter-active .recommendation-drawer,
  .recommendation-drawer-leave-active .recommendation-drawer {
    transition: none;
  }
}
</style>
