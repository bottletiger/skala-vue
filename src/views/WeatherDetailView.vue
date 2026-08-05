<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AsyncStatePanel from '@/components/common/AsyncStatePanel.vue'
import WeatherScene from '@/components/common/WeatherScene.vue'
import CurrentWeatherSummary from '@/components/weather/CurrentWeatherSummary.vue'
import DailyForecastList from '@/components/weather/DailyForecastList.vue'
import HourlyForecastStrip from '@/components/weather/HourlyForecastStrip.vue'
import LoadingSpinner from '@/components/weather/LoadingSpinner.vue'
import WeatherBackgroundVideo from '@/components/weather/WeatherBackgroundVideo.vue'
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
const detailCityName = computed(() => cityData.value?.displayName ?? cityConfig.value?.displayName ?? cityData.value?.name ?? cityConfig.value?.name)

useDocumentTitle(() => {
  return detailCityName.value ? `${detailCityName.value} 상세 날씨` : '도시 날씨'
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
  <WeatherScene :theme="weatherTheme">
    <template #backdrop>
      <WeatherBackgroundVideo :weather="cityData" />
    </template>

    <div class="detail-shell">
      <header class="detail-topbar">
        <button type="button" class="back-button" aria-label="날씨 목록으로 돌아가기" @click="returnToWeatherList">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>

        <h1 id="detail-page-title" ref="detailPageHeading" class="topbar-title" tabindex="-1">{{ detailCityName || '도시 확인 중' }}</h1>

        <button
          type="button"
          class="detail-refresh-button"
          :disabled="!cityConfig || isRefreshing"
          :aria-label="isRefreshing ? '상세 날씨 갱신 중' : `${detailCityName ?? '도시'} 상세 날씨 새로고침`"
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
          <AsyncStatePanel kind="loading" :rows="2" message="현재 날씨를 불러오고 있습니다." />
        </div>
        <AsyncStatePanel v-else-if="errorMessage" class="detail-async-state" kind="error" title="날씨를 불러올 수 없습니다" :message="errorMessage" />

        <CurrentWeatherSummary v-else-if="cityData" :weather="cityData" :theme="weatherTheme" />

        <AsyncStatePanel v-else class="detail-async-state" kind="empty" message="표시할 날씨 정보가 없습니다." />
      </section>

      <WeatherDetailsList v-if="cityData" :weather="cityData" />

      <section v-if="cityConfig" class="forecast-section" aria-labelledby="forecast-overview-title" :aria-busy="isForecastLoading">
        <h2 id="forecast-overview-title" class="sr-only">날씨 예보</h2>
        <p class="sr-only" aria-live="polite">{{ forecastStatusMessage }}</p>

        <div v-if="isForecastLoading" class="forecast-state">
          <LoadingSpinner class="forecast-loading-spinner" />
          <p>예보를 불러오는 중입니다.</p>
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
  </WeatherScene>
</template>

<style scoped>
.detail-shell {
  position: relative;
  z-index: 1;
  width: min(980px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(24px, 5vh, 58px) 0 calc(var(--floating-nav-height, 62px) + var(--floating-nav-offset, 12px) + 64px + env(safe-area-inset-bottom));
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

.topbar-title {
  margin: 0;
  color: var(--hero-text);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.025em;
  outline: none;
}

.current-panel {
  min-height: 0;
  margin: 12px auto 0;
  padding: 12px 4px 18px;
  border: 0;
  background: transparent;
  box-shadow: none;
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

.detail-loading-state :deep(.async-state-panel) {
  width: 100%;
}

.detail-async-state {
  min-height: 110px;
  padding: 16px 0;
}

.forecast-section {
  margin: 34px auto 0;
}

.forecast-content {
  display: grid;
  gap: 34px;
}

.forecast-state {
  display: flex;
  min-height: 136px;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px 4px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  background: transparent;
  color: var(--hero-muted);
  text-align: center;
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
}

@media (max-width: 560px) {
  .detail-shell {
    width: min(100% - 28px, 980px);
  }

  .current-panel {
    margin-top: 10px;
    padding: 10px 0 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .back-button,
  .detail-refresh-button {
    transition: none;
  }

  .back-button:hover,
  .detail-refresh-button:hover:not(:disabled) {
    transform: none;
  }

  .detail-refresh-button svg.is-spinning {
    animation: none;
  }
}
</style>
