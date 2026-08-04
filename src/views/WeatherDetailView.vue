<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import LoadingSpinner from '@/components/weather/LoadingSpinner.vue'
import MetricCard from '@/components/weather/MetricCard.vue'
import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useTemperature } from '@/composables/useTemperature'
import { findCityConfig } from '@/data/cities'
import { fetchCityWeather, hasWeatherApiKey, MissingWeatherApiKeyError } from '@/services/weatherApi'
import { formatWeatherDateTime, formatWeatherTime, getWeatherTheme } from '@/utils/weatherTheme'

const route = useRoute()
const router = useRouter()

const MISSING_API_KEY_MESSAGE = 'VITE_OPENWEATHER_API_KEY를 설정해 주세요.'
const apiReady = hasWeatherApiKey()
const cityData = ref(null)
const isLoading = ref(apiReady)
const errorMessage = ref(apiReady ? '' : MISSING_API_KEY_MESSAGE)
const detailPageHeading = ref(null)
const cityConfig = computed(() => findCityConfig(route.params.cityId))
const { displayTemp, unitSymbol } = useTemperature(() => cityData.value?.temp)
const { displayTemp: displayFeelsLike } = useTemperature(() => cityData.value?.feelsLike)
let detailRequestId = 0

const toFiniteMetric = (value) => {
  if (value === null || value === undefined || value === '') return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

const weatherTheme = computed(() => getWeatherTheme(cityData.value))
const currentTemperature = computed(() => {
  return toFiniteMetric(cityData.value?.temp) === null ? null : displayTemp.value
})
const feelsLikeTemperature = computed(() => {
  return toFiniteMetric(cityData.value?.feelsLike) === null ? null : displayFeelsLike.value
})
const humidity = computed(() => toFiniteMetric(cityData.value?.humidity))
const pressure = computed(() => toFiniteMetric(cityData.value?.pressure))
const windSpeed = computed(() => toFiniteMetric(cityData.value?.wind))
const visibilityKm = computed(() => {
  const visibilityMeters = toFiniteMetric(cityData.value?.visibility)
  if (visibilityMeters === null) return null
  return Math.round((visibilityMeters / 1000) * 10) / 10
})
const observedAt = computed(() => {
  return formatWeatherDateTime(cityData.value?.observedAt, cityData.value?.timezoneOffset)
})
const sunriseTime = computed(() => {
  return formatWeatherTime(cityData.value?.sunrise, cityData.value?.timezoneOffset)
})
const sunsetTime = computed(() => {
  return formatWeatherTime(cityData.value?.sunset, cityData.value?.timezoneOffset)
})

const returnToWeatherList = () => {
  void router.push({ name: 'WeatherHome', query: route.query })
}

const detailStatusMessage = computed(() => {
  if (isLoading.value) return '상세 날씨를 불러오는 중입니다.'
  if (errorMessage.value) return errorMessage.value
  if (cityData.value) return `${cityData.value.name} 상세 날씨를 표시했습니다.`
  return '수신된 상세 날씨 데이터가 없습니다.'
})

const formatApiError = (error) => {
  if (error instanceof MissingWeatherApiKeyError) {
    return MISSING_API_KEY_MESSAGE
  }
  if (error.response?.status === 401) {
    return 'API 키가 유효하지 않거나 아직 활성화되지 않았습니다.'
  }
  return '상세 날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

const loadDetail = async (cityId) => {
  const requestId = ++detailRequestId
  const requestedCity = findCityConfig(cityId)

  cityData.value = null
  errorMessage.value = ''

  if (!requestedCity) {
    isLoading.value = true
    try {
      await router.replace({
        name: 'NotFound',
        query: { from: route.fullPath },
      })
    } catch {
      if (requestId !== detailRequestId) return
      errorMessage.value = '요청한 도시를 찾을 수 없고 오류 안내 화면으로 이동하지 못했습니다.'
      isLoading.value = false
    }
    return
  }

  if (!apiReady) {
    errorMessage.value = MISSING_API_KEY_MESSAGE
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    const nextCityData = await fetchCityWeather(requestedCity)
    if (requestId !== detailRequestId) return

    cityData.value = nextCityData
  } catch (error) {
    if (requestId !== detailRequestId) return

    errorMessage.value = formatApiError(error)
  } finally {
    if (requestId === detailRequestId) isLoading.value = false
  }
}

watch(
  () => route.params.cityId,
  (cityId) => {
    void loadDetail(cityId)
  },
  { immediate: true },
)

watchEffect(() => {
  const cityName = cityData.value?.name ?? cityConfig.value?.name
  document.title = cityName ? `${cityName} 상세 날씨 | Weather` : '도시 날씨 | Weather'
})

onMounted(async () => {
  await nextTick()
  detailPageHeading.value?.focus()
})

onBeforeUnmount(() => {
  detailRequestId += 1
})
</script>

<template>
  <div class="detail-scene" :style="weatherTheme.cssVariables" :data-theme="weatherTheme.name">
    <div class="scene-horizon" aria-hidden="true"></div>

    <div class="detail-shell">
      <header class="detail-topbar">
        <button type="button" class="back-button" aria-label="날씨 목록으로 돌아가기" @click="returnToWeatherList">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>

        <div class="topbar-title">
          <span>현재 날씨</span>
          <h1 id="detail-page-title" ref="detailPageHeading" tabindex="-1">{{ cityConfig?.name || '도시 확인 중' }}</h1>
        </div>
      </header>

      <section class="current-panel" :aria-busy="isLoading" :aria-labelledby="cityData ? 'detail-page-title detail-weather-title' : undefined" :aria-label="cityData ? undefined : detailStatusMessage">
        <p class="sr-only" aria-live="polite">{{ detailStatusMessage }}</p>

        <div v-if="isLoading" class="detail-loading-state">
          <LoadingSpinner class="detail-loading-spinner" />
          <el-skeleton :rows="4" animated />
        </div>
        <el-result v-else-if="errorMessage" :icon="apiReady ? 'error' : 'warning'" title="날씨를 불러올 수 없습니다" :sub-title="errorMessage" />

        <div v-else-if="cityData" class="current-content">
          <div class="current-location">
            <p>{{ cityData.fullName }}</p>
            <strong>{{ cityData.status || weatherTheme.label || '날씨 설명 없음' }}</strong>
          </div>

          <div class="current-reading" role="group" :aria-label="`현재 기온 ${currentTemperature === null ? '정보 없음' : `${currentTemperature}${unitSymbol}`}`">
            <div class="current-visual">
              <WeatherConditionIcon class="condition-icon" :category="weatherTheme.category" :is-night="weatherTheme.isNight" />
            </div>

            <div id="detail-weather-title" class="current-temperature" :class="{ missing: currentTemperature === null }" role="heading" aria-level="2">
              <span>{{ currentTemperature ?? '정보 없음' }}</span>
              <small v-if="currentTemperature !== null">{{ unitSymbol }}</small>
            </div>
          </div>
        </div>

        <el-empty v-else description="표시할 날씨 정보가 없습니다." />
      </section>

      <section v-if="cityData" class="details-section" aria-labelledby="metric-grid-title">
        <div class="details-heading">
          <h2 id="metric-grid-title">상세 정보</h2>
          <span>{{ observedAt }}</span>
        </div>

        <div class="metric-grid">
          <MetricCard label="체감 온도" :value="feelsLikeTemperature" :unit="feelsLikeTemperature === null ? '' : unitSymbol">
            <template #icon>
              <svg viewBox="0 0 24 24">
                <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
                <path d="M12 9v7" />
              </svg>
            </template>
          </MetricCard>

          <MetricCard label="습도" :value="humidity" unit="%">
            <template #icon>
              <svg viewBox="0 0 24 24">
                <path d="M12 3S6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z" />
                <path d="M9.5 15.5a3 3 0 0 0 5 1.5" />
              </svg>
            </template>
          </MetricCard>

          <MetricCard label="기압" :value="pressure" unit="hPa">
            <template #icon>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <path d="m12 12 3.5-3.5M8 17h8" />
              </svg>
            </template>
          </MetricCard>

          <MetricCard label="시정거리" :value="visibilityKm" unit="km">
            <template #icon>
              <svg viewBox="0 0 24 24">
                <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </template>
          </MetricCard>

          <MetricCard label="풍속" :value="windSpeed" unit="m/s">
            <template #icon>
              <svg viewBox="0 0 24 24"><path d="M3 8h11a2.5 2.5 0 1 0-2.3-3.5M3 12h16a2 2 0 1 1-1.8 2.8M3 16h8" /></svg>
            </template>
          </MetricCard>

          <MetricCard label="일출" :value="sunriseTime" description="현지 시각">
            <template #icon>
              <svg viewBox="0 0 24 24"><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 3v3M4.9 6.9 7 9M19.1 6.9 17 9" /></svg>
            </template>
          </MetricCard>

          <MetricCard label="일몰" :value="sunsetTime" description="현지 시각">
            <template #icon>
              <svg viewBox="0 0 24 24"><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 6V3M9.5 4.5 12 7l2.5-2.5" /></svg>
            </template>
          </MetricCard>

          <MetricCard label="관측 시각" :value="observedAt" description="현지 날짜 및 시각">
            <template #icon>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 7v5l3 2" />
              </svg>
            </template>
          </MetricCard>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.detail-scene {
  position: relative;
  min-height: 100svh;
  overflow: clip;
  background:
    radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--weather-accent) 24%, transparent) 0%, transparent 31%),
    radial-gradient(ellipse at 14% 88%, color-mix(in srgb, var(--hero-end) 72%, transparent) 0%, transparent 52%),
    linear-gradient(158deg, var(--hero-start) 0%, color-mix(in srgb, var(--hero-start) 54%, var(--hero-end)) 52%, var(--hero-end) 100%);
  color: var(--hero-text);
  isolation: isolate;
  transition:
    --hero-start 500ms ease,
    --hero-end 500ms ease,
    --weather-accent 500ms ease,
    --hero-text 500ms ease,
    --hero-muted 500ms ease;
}

.detail-scene::before {
  position: absolute;
  z-index: -2;
  inset: -18% -14% -8%;
  background:
    radial-gradient(ellipse at 12% 28%, rgba(255, 255, 255, 0.34) 0 6%, transparent 28%), radial-gradient(ellipse at 52% 20%, rgba(255, 255, 255, 0.2) 0 8%, transparent 31%),
    radial-gradient(ellipse at 88% 34%, color-mix(in srgb, var(--weather-accent) 22%, transparent) 0 7%, transparent 30%);
  content: '';
  filter: blur(34px);
  opacity: 0.82;
  animation: detail-atmosphere-drift 22s ease-in-out infinite alternate;
}

.detail-scene::after {
  position: absolute;
  z-index: -1;
  right: -22%;
  bottom: -20%;
  left: -22%;
  height: 62%;
  background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--weather-accent) 26%, transparent) 0%, transparent 62%), linear-gradient(to top, rgba(255, 255, 255, 0.13), transparent 72%);
  content: '';
  filter: blur(58px);
  opacity: 0.72;
}

.scene-horizon {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, 0.22), transparent 48%), linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 48%, rgba(255, 255, 255, 0.07));
  opacity: 0.78;
}

@keyframes detail-atmosphere-drift {
  from {
    transform: translate3d(-1.4%, -0.4%, 0) scale(1);
  }

  to {
    transform: translate3d(1.4%, 0.8%, 0) scale(1.035);
  }
}

.detail-shell {
  position: relative;
  z-index: 1;
  width: min(980px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(24px, 5vh, 58px) 0 calc(116px + env(safe-area-inset-bottom));
  perspective: 1800px;
  perspective-origin: 50% 28%;
}

.detail-topbar {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
}

.back-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: color-mix(in srgb, var(--hero-text) 68%, transparent);
  cursor: pointer;
  transition:
    color 180ms ease,
    background-color 180ms ease,
    transform 180ms ease;
}

.back-button svg {
  width: 20px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.back-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: 2px;
}

.topbar-title span,
.topbar-title h1 {
  display: block;
}

.topbar-title span {
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
}

.topbar-title h1 {
  margin: 0;
  font-size: 16px;
}

.current-panel {
  min-height: 300px;
  width: min(820px, 100%);
  margin: clamp(18px, 3svh, 30px) auto 0;
  padding: clamp(24px, 4.8vw, 48px) 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.current-panel :deep(.el-skeleton__item) {
  background: rgba(255, 255, 255, 0.36);
}

.detail-loading-state {
  display: grid;
  gap: 22px;
}

.detail-loading-spinner {
  --loading-spinner-size: 58px;

  margin: 0 auto;
}

.current-panel :deep(.el-result) {
  --el-text-color-primary: var(--hero-text);
  --el-text-color-regular: var(--hero-muted);
}

.current-content {
  display: grid;
  min-height: 196px;
  align-content: center;
  justify-items: center;
  gap: 26px;
  text-align: center;
}

.current-location {
  display: grid;
  justify-items: center;
}

.current-location > p {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(24px, 4.2vw, 42px);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 1.14;
}

.current-location > strong {
  display: block;
  margin-top: 8px;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 800;
}

.current-reading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 2.4vw, 26px);
}

.current-temperature {
  display: flex;
  align-items: flex-start;
  gap: clamp(8px, 1.2vw, 14px);
  margin: 0;
  font-size: clamp(72px, 11vw, 112px);
  font-weight: 720;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.05em;
  line-height: 0.86;
  white-space: nowrap;
}

.current-temperature small {
  margin-top: 2px;
  font-size: 24px;
  font-weight: 750;
  letter-spacing: -0.02em;
  vertical-align: top;
}

.current-temperature.missing {
  font-size: clamp(28px, 5vw, 42px);
  letter-spacing: -0.03em;
}

.current-visual {
  display: grid;
  width: clamp(118px, 16vw, 172px);
  height: clamp(118px, 16vw, 172px);
  padding: 12px;
  justify-items: center;
  color: var(--weather-accent);
  transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
}

.condition-icon {
  width: 100%;
  height: 100%;
}

.details-section {
  width: min(980px, 100%);
  margin: 24px auto 0;
}

.details-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 15px;
  padding: 0 4px;
}

.details-heading h2 {
  margin: 0;
  font-size: 18px;
}

.details-heading span {
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 700;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .back-button:hover {
    background: rgba(255, 255, 255, 0.14);
    color: var(--hero-text);
    transform: translateY(-1px);
  }

  .current-panel:hover .current-visual {
    transform: translateY(-8px) scale(1.045);
  }
}

@media (max-width: 860px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .detail-shell {
    width: min(100% - 28px, 980px);
  }

  .topbar-title span {
    display: none;
  }

  .current-panel {
    min-height: 0;
    margin-top: 18px;
    padding: 28px 0 20px;
  }

  .current-content {
    min-height: 0;
    gap: 22px;
  }

  .current-location > p {
    font-size: clamp(24px, 8vw, 34px);
  }

  .current-reading {
    gap: 10px;
  }

  .current-temperature {
    gap: 8px;
    font-size: clamp(60px, 20vw, 82px);
    letter-spacing: -0.04em;
  }

  .current-temperature small {
    font-size: 20px;
  }

  .current-visual {
    width: clamp(96px, 28vw, 126px);
    height: clamp(96px, 28vw, 126px);
    padding: 8px;
  }

  .details-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }
}

@media (max-width: 430px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-scene,
  .detail-scene::before {
    animation: none;
    transition: none;
  }

  .back-button,
  .current-visual {
    transition: none;
  }

  .back-button:hover,
  .current-panel:hover .current-visual {
    transform: none;
  }
}
</style>
