<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import DailyForecastList from '@/components/weather/DailyForecastList.vue'
import HourlyForecastStrip from '@/components/weather/HourlyForecastStrip.vue'
import LoadingSpinner from '@/components/weather/LoadingSpinner.vue'
import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useTemperature } from '@/composables/useTemperature'
import { findCityConfig } from '@/data/cities'
import { fetchCityForecast, fetchCityWeather, hasWeatherApiKey, MissingWeatherApiKeyError } from '@/services/weatherApi'
import { formatWeatherDateTime, formatWeatherTime, getWeatherTheme } from '@/utils/weatherTheme'

const route = useRoute()
const router = useRouter()

const MISSING_API_KEY_MESSAGE = 'VITE_OPENWEATHER_API_KEY를 설정해 주세요.'
const apiReady = hasWeatherApiKey()
const cityData = ref(null)
const forecastData = ref(null)
const isLoading = ref(apiReady)
const isForecastLoading = ref(apiReady)
const errorMessage = ref(apiReady ? '' : MISSING_API_KEY_MESSAGE)
const forecastErrorMessage = ref('')
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

const weatherTheme = computed(() => {
  const firstForecast = forecastData.value?.hourly?.[0]
  return getWeatherTheme(
    cityData.value ?? {
      condition: firstForecast?.weatherMain,
      conditionId: firstForecast?.weatherId,
      iconCode: firstForecast?.icon,
    },
  )
})
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
const forecastTimezoneOffset = computed(() => {
  return forecastData.value?.timezoneOffset ?? cityData.value?.timezoneOffset ?? 0
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

const forecastStatusMessage = computed(() => {
  if (isForecastLoading.value) return '시간대별 및 5일 예보를 불러오는 중입니다.'
  if (forecastErrorMessage.value) return forecastErrorMessage.value
  if (forecastData.value?.hourly?.length || forecastData.value?.daily?.length) {
    return '시간대별 및 5일 예보를 표시했습니다.'
  }
  return '수신된 예보 데이터가 없습니다.'
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

const formatForecastError = (error) => {
  if (error instanceof MissingWeatherApiKeyError) {
    return MISSING_API_KEY_MESSAGE
  }
  if (error.response?.status === 401) {
    return 'API 키가 유효하지 않거나 아직 활성화되지 않았습니다.'
  }
  return '예보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

const loadDetail = async (cityId) => {
  const requestId = ++detailRequestId
  const requestedCity = findCityConfig(cityId)

  cityData.value = null
  forecastData.value = null
  errorMessage.value = ''
  forecastErrorMessage.value = ''

  if (!requestedCity) {
    isLoading.value = true
    isForecastLoading.value = false
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
    isForecastLoading.value = false
    return
  }

  isLoading.value = true
  isForecastLoading.value = true

  const currentWeatherRequest = fetchCityWeather(requestedCity)
    .then((nextCityData) => {
      if (requestId === detailRequestId) cityData.value = nextCityData
    })
    .catch((error) => {
      if (requestId === detailRequestId) errorMessage.value = formatApiError(error)
    })
    .finally(() => {
      if (requestId === detailRequestId) isLoading.value = false
    })

  const forecastRequest = fetchCityForecast(requestedCity)
    .then((nextForecastData) => {
      if (requestId === detailRequestId) forecastData.value = nextForecastData
    })
    .catch((error) => {
      if (requestId === detailRequestId) forecastErrorMessage.value = formatForecastError(error)
    })
    .finally(() => {
      if (requestId === detailRequestId) isForecastLoading.value = false
    })

  await Promise.allSettled([currentWeatherRequest, forecastRequest])
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
          <el-skeleton :rows="2" animated />
        </div>
        <el-result v-else-if="errorMessage" :icon="apiReady ? 'error' : 'warning'" title="날씨를 불러올 수 없습니다" :sub-title="errorMessage" />

        <div v-else-if="cityData" class="current-content">
          <div class="current-visual">
            <WeatherConditionIcon class="condition-icon" :category="weatherTheme.category" :is-night="weatherTheme.isNight" />
          </div>

          <div class="current-location">
            <p>{{ cityData.name }}</p>
            <strong>{{ cityData.status || weatherTheme.label || '날씨 설명 없음' }}</strong>
            <span>관측 {{ observedAt }}</span>
          </div>

          <div class="current-reading">
            <div id="detail-weather-title" class="current-temperature" :class="{ missing: currentTemperature === null }" role="heading" aria-level="2">
              <span>{{ currentTemperature ?? '정보 없음' }}</span>
              <small v-if="currentTemperature !== null">{{ unitSymbol }}</small>
            </div>
          </div>
        </div>

        <el-empty v-else description="표시할 날씨 정보가 없습니다." />
      </section>

      <section v-if="cityData" class="details-section" aria-labelledby="details-list-title">
        <div class="details-heading">
          <h2 id="details-list-title">상세 정보</h2>
          <span>현재 관측값</span>
        </div>

        <dl class="details-list">
          <div class="detail-row">
            <dt class="detail-label">
              <span class="detail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
                  <path d="M12 9v7" />
                </svg>
              </span>
              <span class="detail-copy"><strong>체감 온도</strong><small>몸이 느끼는 온도</small></span>
            </dt>
            <dd class="detail-value" :class="{ missing: feelsLikeTemperature === null }">
              <strong>{{ feelsLikeTemperature ?? '정보 없음' }}</strong>
              <small v-if="feelsLikeTemperature !== null">{{ unitSymbol }}</small>
            </dd>
          </div>

          <div class="detail-row">
            <dt class="detail-label">
              <span class="detail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3S6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z" />
                  <path d="M9.5 15.5a3 3 0 0 0 5 1.5" />
                </svg>
              </span>
              <span class="detail-copy"><strong>습도</strong><small>공기 중 수증기 비율</small></span>
            </dt>
            <dd class="detail-value" :class="{ missing: humidity === null }">
              <strong>{{ humidity ?? '정보 없음' }}</strong>
              <small v-if="humidity !== null">%</small>
            </dd>
          </div>

          <div class="detail-row">
            <dt class="detail-label">
              <span class="detail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M3 8h11a2.5 2.5 0 1 0-2.3-3.5M3 12h16a2 2 0 1 1-1.8 2.8M3 16h8" /></svg>
              </span>
              <span class="detail-copy"><strong>풍속</strong><small>지상 바람 속도</small></span>
            </dt>
            <dd class="detail-value" :class="{ missing: windSpeed === null }">
              <strong>{{ windSpeed ?? '정보 없음' }}</strong>
              <small v-if="windSpeed !== null">m/s</small>
            </dd>
          </div>

          <div class="detail-row">
            <dt class="detail-label">
              <span class="detail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                  <path d="m12 12 3.5-3.5M8 17h8" />
                </svg>
              </span>
              <span class="detail-copy"><strong>기압</strong><small>현재 대기압</small></span>
            </dt>
            <dd class="detail-value" :class="{ missing: pressure === null }">
              <strong>{{ pressure ?? '정보 없음' }}</strong>
              <small v-if="pressure !== null">hPa</small>
            </dd>
          </div>

          <div class="detail-row">
            <dt class="detail-label">
              <span class="detail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </span>
              <span class="detail-copy"><strong>시정거리</strong><small>육안으로 볼 수 있는 거리</small></span>
            </dt>
            <dd class="detail-value" :class="{ missing: visibilityKm === null }">
              <strong>{{ visibilityKm ?? '정보 없음' }}</strong>
              <small v-if="visibilityKm !== null">km</small>
            </dd>
          </div>

          <div class="detail-row detail-row--solar">
            <dt class="detail-label">
              <span class="detail-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 3v3M4.9 6.9 7 9M19.1 6.9 17 9" />
                </svg>
              </span>
              <span class="detail-copy"><strong>일출 · 일몰</strong><small>도시 현지 시각</small></span>
            </dt>
            <dd class="detail-value detail-value--pair">
              <span
                ><small>일출</small><strong>{{ sunriseTime }}</strong></span
              >
              <i aria-hidden="true"></i>
              <span
                ><small>일몰</small><strong>{{ sunsetTime }}</strong></span
              >
            </dd>
          </div>
        </dl>
      </section>

      <section v-if="cityConfig && apiReady" class="forecast-section" aria-labelledby="forecast-overview-title" :aria-busy="isForecastLoading">
        <h2 id="forecast-overview-title" class="sr-only">날씨 예보</h2>
        <p class="sr-only" aria-live="polite">{{ forecastStatusMessage }}</p>

        <div v-if="isForecastLoading" class="forecast-state">
          <LoadingSpinner class="forecast-loading-spinner" />
          <p>시간대별 및 5일 예보를 불러오고 있습니다.</p>
        </div>

        <div v-else-if="forecastErrorMessage" class="forecast-state forecast-state--error">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 17h.01" />
          </svg>
          <div>
            <strong>예보를 표시하지 못했습니다.</strong>
            <p>{{ forecastErrorMessage }}</p>
          </div>
        </div>

        <div v-else-if="forecastData?.hourly?.length || forecastData?.daily?.length" class="forecast-content">
          <HourlyForecastStrip v-if="forecastData.hourly.length" :items="forecastData.hourly" :timezone-offset="forecastTimezoneOffset" />
          <DailyForecastList v-if="forecastData.daily.length" :items="forecastData.daily" :timezone-offset="forecastTimezoneOffset" />
        </div>

        <div v-else class="forecast-state">
          <p>표시할 예보 정보가 없습니다.</p>
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
  min-height: 0;
  width: min(980px, 100%);
  margin: 12px auto 0;
  padding: 16px 4px 20px;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.current-panel :deep(.el-skeleton__item) {
  background: rgba(255, 255, 255, 0.36);
}

.detail-loading-state {
  display: grid;
  min-height: 110px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 20px;
  padding: 0 18px;
}

.detail-loading-spinner {
  --loading-spinner-size: 38px;
}

.current-panel :deep(.el-result) {
  --el-text-color-primary: var(--hero-text);
  --el-text-color-regular: var(--hero-muted);

  padding: 16px 0;
}

.current-content {
  display: grid;
  min-height: 110px;
  grid-template-columns: 82px minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 0 8px;
}

.current-location {
  display: grid;
  min-width: 0;
  justify-items: start;
}

.current-location > p {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(20px, 2.6vw, 28px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.current-location > strong {
  display: block;
  width: 100%;
  margin-top: 4px;
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-location > span {
  margin-top: 6px;
  color: color-mix(in srgb, var(--hero-muted) 82%, transparent);
  font-size: 10px;
  font-weight: 700;
}

.current-reading {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.current-temperature {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  font-size: clamp(44px, 6.4vw, 64px);
  font-weight: 760;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.045em;
  line-height: 0.92;
  white-space: nowrap;
}

.current-temperature small {
  margin-top: 1px;
  font-size: 17px;
  font-weight: 750;
  letter-spacing: -0.02em;
  vertical-align: top;
}

.current-temperature.missing {
  font-size: clamp(18px, 3vw, 24px);
  letter-spacing: -0.03em;
}

.current-visual {
  display: grid;
  width: 82px;
  height: 82px;
  padding: 7px;
  justify-items: center;
  color: var(--weather-accent);
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.condition-icon {
  width: 100%;
  height: 100%;
}

.details-section {
  width: min(980px, 100%);
  margin: 18px auto 0;
}

.forecast-section {
  width: min(980px, 100%);
  margin: 28px auto 0;
}

.forecast-content {
  display: grid;
  gap: 28px;
}

.forecast-state {
  display: flex;
  min-height: 136px;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  color: var(--hero-muted);
  text-align: center;
  backdrop-filter: blur(14px) saturate(108%);
}

.forecast-state p {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.forecast-state--error {
  justify-content: flex-start;
  text-align: left;
}

.forecast-state--error > svg {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  fill: none;
  stroke: var(--weather-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.forecast-state--error strong {
  display: block;
  margin-bottom: 4px;
  color: var(--hero-text);
  font-size: 14px;
}

.forecast-loading-spinner {
  --loading-spinner-size: 34px;
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

.details-list {
  margin: 0;
  padding: 0 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  backdrop-filter: blur(14px) saturate(108%);
}

.detail-row {
  display: grid;
  min-height: 72px;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 12px 2px;
  transition: background-color 180ms ease;
}

.detail-row + .detail-row {
  border-top: 1px solid rgba(255, 255, 255, 0.19);
}

.detail-label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
}

.detail-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  color: var(--weather-accent);
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.detail-icon svg {
  width: 27px;
  height: 27px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.75;
}

.detail-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.detail-copy strong {
  color: var(--hero-text);
  font-size: 13px;
  font-weight: 800;
}

.detail-copy small {
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-value {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 5px;
  margin: 0;
  color: var(--hero-text);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.detail-value > strong {
  font-size: 19px;
  font-weight: 820;
  letter-spacing: -0.025em;
}

.detail-value > small {
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
}

.detail-value.missing > strong {
  color: var(--hero-muted);
  font-size: 13px;
  letter-spacing: 0;
}

.detail-value--pair {
  align-items: center;
  gap: 14px;
}

.detail-value--pair > span {
  display: grid;
  grid-template-columns: auto auto;
  align-items: baseline;
  gap: 6px;
}

.detail-value--pair > span > small {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 700;
}

.detail-value--pair > span > strong {
  font-size: 17px;
  font-weight: 820;
}

.detail-value--pair > i {
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.24);
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .back-button:hover {
    background: rgba(255, 255, 255, 0.14);
    color: var(--hero-text);
    transform: translateY(-1px);
  }

  .current-panel:hover .current-visual {
    transform: translateY(-3px) scale(1.04);
  }

  .detail-row:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .detail-row:hover .detail-icon {
    transform: translateY(-2px) scale(1.05);
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
    margin-top: 10px;
    padding: 10px 0 16px;
  }

  .current-content {
    min-height: 92px;
    grid-template-columns: 60px minmax(0, 1fr) auto;
    gap: 11px;
    padding: 0 2px;
  }

  .current-location > p {
    font-size: 19px;
  }

  .current-location > strong {
    font-size: 11px;
  }

  .current-location > span {
    width: 100%;
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .current-temperature {
    gap: 4px;
    font-size: clamp(36px, 12vw, 48px);
    letter-spacing: -0.04em;
  }

  .current-temperature small {
    font-size: 14px;
  }

  .current-visual {
    width: 60px;
    height: 60px;
    padding: 5px;
  }

  .details-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .details-list {
    padding: 0 14px;
    border-radius: 22px;
  }

  .detail-row {
    min-height: 66px;
    gap: 12px;
    padding-block: 10px;
  }

  .detail-label {
    gap: 10px;
  }

  .detail-icon {
    width: 34px;
    height: 34px;
  }

  .detail-icon svg {
    width: 24px;
    height: 24px;
  }

  .detail-copy strong {
    font-size: 12px;
  }

  .detail-copy small {
    font-size: 10px;
  }

  .detail-value > strong {
    font-size: 16px;
  }

  .detail-value--pair {
    gap: 9px;
  }

  .detail-value--pair > span {
    gap: 4px;
  }

  .detail-value--pair > span > strong {
    font-size: 14px;
  }
}

@media (max-width: 360px) {
  .current-content {
    grid-template-columns: 54px minmax(0, 1fr) auto;
    gap: 8px;
  }

  .current-visual {
    width: 54px;
    height: 54px;
  }

  .current-temperature {
    font-size: 34px;
  }

  .detail-copy small {
    display: none;
  }

  .detail-value--pair > span {
    grid-template-columns: 1fr;
    justify-items: end;
    gap: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-scene,
  .detail-scene::before {
    animation: none;
    transition: none;
  }

  .back-button,
  .current-visual,
  .detail-row,
  .detail-icon {
    transition: none;
  }

  .back-button:hover,
  .current-panel:hover .current-visual,
  .detail-row:hover .detail-icon {
    transform: none;
  }
}
</style>
