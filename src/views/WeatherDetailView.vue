<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CurrentWeatherSummary from '@/components/weather/CurrentWeatherSummary.vue'
import DailyForecastList from '@/components/weather/DailyForecastList.vue'
import HourlyForecastStrip from '@/components/weather/HourlyForecastStrip.vue'
import LoadingSpinner from '@/components/weather/LoadingSpinner.vue'
import WeatherDetailsList from '@/components/weather/WeatherDetailsList.vue'
import { useCityWeatherDetail } from '@/composables/useCityWeatherDetail'
import { useDocumentTitle } from '@/composables/useDocumentTitle'

const route = useRoute()
const router = useRouter()
const detailPageHeading = ref(null)
const cityId = computed(() => route.params.cityId)
const redirectUnknownCity = () =>
  router.replace({
    name: 'NotFound',
    query: { from: route.fullPath },
  })

const {
  apiReady,
  cityConfig,
  cityData,
  detailStatusMessage,
  errorMessage,
  forecastData,
  forecastErrorMessage,
  forecastStatusMessage,
  forecastTimezoneOffset,
  isForecastLoading,
  isLoading,
  refreshDetail,
  weatherTheme,
} = useCityWeatherDetail(cityId, redirectUnknownCity)

const isRefreshing = computed(() => isLoading.value || isForecastLoading.value)

useDocumentTitle(() => {
  const cityName = cityData.value?.name ?? cityConfig.value?.name
  return cityName ? `${cityName} 상세 날씨` : '도시 날씨'
})

const returnToWeatherList = () => {
  void router.push({ name: 'WeatherHome', query: route.query })
}

onMounted(async () => {
  await nextTick()
  detailPageHeading.value?.focus()
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

        <button
          type="button"
          class="detail-refresh-button"
          :disabled="!cityConfig || !apiReady || isRefreshing"
          :aria-label="isRefreshing ? '상세 날씨 갱신 중' : `${cityConfig?.name ?? '도시'} 상세 날씨 새로고침`"
          @click="refreshDetail"
        >
          <svg viewBox="0 0 24 24" :class="{ 'is-spinning': isRefreshing }" aria-hidden="true">
            <path d="M20 6v5h-5" />
            <path d="M18.2 15a7 7 0 1 1-.7-7.1L20 11" />
          </svg>
        </button>
      </header>

      <section class="current-panel" :aria-busy="isLoading" :aria-labelledby="cityData ? 'detail-page-title detail-weather-title' : undefined" :aria-label="cityData ? undefined : detailStatusMessage">
        <p class="sr-only" aria-live="polite">{{ detailStatusMessage }}</p>

        <div v-if="isLoading" class="detail-loading-state">
          <LoadingSpinner class="detail-loading-spinner" />
          <el-skeleton :rows="2" animated />
        </div>
        <el-result v-else-if="errorMessage" :icon="apiReady ? 'error' : 'warning'" title="날씨를 불러올 수 없습니다" :sub-title="errorMessage" />

        <CurrentWeatherSummary v-else-if="cityData" :weather="cityData" :theme="weatherTheme" />

        <el-empty v-else description="표시할 날씨 정보가 없습니다." />
      </section>

      <WeatherDetailsList v-if="cityData" :weather="cityData" />

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
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
}

.back-button,
.detail-refresh-button {
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

.back-button svg,
.detail-refresh-button svg {
  width: 20px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.detail-refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.back-button:focus-visible,
.detail-refresh-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: 2px;
}

.detail-refresh-button svg.is-spinning {
  animation: detail-refresh-spin 900ms linear infinite;
}

@keyframes detail-refresh-spin {
  to {
    transform: rotate(1turn);
  }
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

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .back-button:hover,
  .detail-refresh-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
    color: var(--hero-text);
    transform: translateY(-1px);
  }

  .current-panel:hover :deep(.current-visual) {
    transform: translateY(-3px) scale(1.04);
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
}

@media (prefers-reduced-motion: reduce) {
  .detail-scene,
  .detail-scene::before {
    animation: none;
    transition: none;
  }

  .back-button,
  .detail-refresh-button {
    transition: none;
  }

  .back-button:hover,
  .detail-refresh-button:hover:not(:disabled),
  .current-panel:hover :deep(.current-visual) {
    transform: none;
  }

  .detail-refresh-button svg.is-spinning {
    animation: none;
  }
}
</style>
