<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import LoadingSpinner from '@/components/weather/LoadingSpinner.vue'
import LocationPermissionPanel from '@/components/weather/LocationPermissionPanel.vue'
import TemperatureConditionLabel from '@/components/weather/TemperatureConditionLabel.vue'
import WeatherBackgroundVideo from '@/components/weather/WeatherBackgroundVideo.vue'
import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import WorldWeatherDrawer from '@/components/weather/WorldWeatherDrawer.vue'
import { useCurrentLocationWeather } from '@/composables/useCurrentLocationWeather'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { useHomeWeatherDashboard } from '@/composables/useHomeWeatherDashboard'
import { useTemperature } from '@/composables/useTemperature'
import { CITY_CONFIG, CITY_REGIONS } from '@/data/cities'
import { CURRENT_LOCATION_ID } from '@/services/geolocation'
import { matchesSearchQuery, normalizeSearchQuery } from '@/utils/search'
import { formatWeatherDateTime, getWeatherTheme } from '@/utils/weatherTheme'

const route = useRoute()
const router = useRouter()

const getRouteSelectedCityId = () => {
  if (typeof route.query.selected !== 'string') return ''
  return route.query.selected === CURRENT_LOCATION_ID || CITY_CONFIG.some((city) => city.id === route.query.selected) ? route.query.selected : ''
}

const syncSelectedRoute = (cityId) => {
  if (route.query.selected === cityId) return Promise.resolve()

  return router.replace({
    query: { ...route.query, selected: cityId },
  })
}

const {
  apiReady,
  errorMessage,
  failedCityCount,
  initializeWeather,
  isWorldDrawerOpen,
  isLoading,
  lastUpdated,
  loadCurrentLocation,
  loadWeather,
  selectedCityId,
  selectedCityInfo,
  selectedWeather,
  selectCity,
  weatherList,
} = useHomeWeatherDashboard(getRouteSelectedCityId)
const searchQuery = ref('')
const activeRegion = ref('all')
const promotingCityId = ref('')
const isHeroPromoting = ref(false)
const weatherHero = ref(null)
let routeCanonicalizationId = 0
let promotionRequestId = 0
let promotionTimer = 0

const { dismissLocationPrompt, locationPromptMessage, locationPromptState, requestLocationWeather, startLocationExperience } = useCurrentLocationWeather({
  initializeWeather,
  loadCurrentLocation,
  onLocationLoaded: async (currentWeather) => {
    await syncSelectedRoute(CURRENT_LOCATION_ID)
    ElMessage.success(`${currentWeather.name} 현재 위치 날씨를 표시합니다.`)
  },
})

const normalizedSearchQuery = computed(() => normalizeSearchQuery(searchQuery.value))

const worldWeatherList = computed(() => weatherList.value.filter((item) => !item.isCurrentLocation))
const currentLocationWeather = computed(() => weatherList.value.find((item) => item.isCurrentLocation) ?? null)

const filteredWeatherList = computed(() => {
  const query = normalizedSearchQuery.value
  return worldWeatherList.value.filter((item) => {
    const matchesRegion = activeRegion.value === 'all' || item.region === activeRegion.value
    if (!matchesRegion) return false
    if (!query) return true

    return matchesSearchQuery([item.name, item.displayName, item.countryName, item.countryCode].filter(Boolean).join(' '), query)
  })
})

const heroState = computed(() => {
  if (!apiReady) return 'unavailable'
  if (isLoading.value) return 'loading'
  if (errorMessage.value) return 'error'
  if (selectedWeather.value) return 'ready'
  return 'empty'
})

const heroWeather = computed(() => (heroState.value === 'ready' ? selectedWeather.value : null))
const heroTheme = computed(() => getWeatherTheme(heroWeather.value))
const heroCityName = computed(() => (heroWeather.value?.displayName || heroWeather.value?.name)?.toLocaleUpperCase('en-US') ?? '')
const heroCountryName = computed(() => heroWeather.value?.countryName || heroWeather.value?.countryCode || '위치 정보 없음')
const { displayTemp: heroTemp, unitSymbol } = useTemperature(() => heroWeather.value?.temp)
const { displayTemp: heroFeelsLike } = useTemperature(() => heroWeather.value?.feelsLike)
const hasHeroTemperature = computed(() => Number.isFinite(heroWeather.value?.temp))
const hasHeroFeelsLike = computed(() => Number.isFinite(heroWeather.value?.feelsLike))
const heroTemperatureText = computed(() => (hasHeroTemperature.value ? `${heroTemp.value}${unitSymbol.value}` : '정보 없음'))
const heroFeelsLikeText = computed(() => (hasHeroFeelsLike.value ? `${heroFeelsLike.value}${unitSymbol.value}` : '정보 없음'))
const heroHumidityText = computed(() => (Number.isFinite(heroWeather.value?.humidity) ? `${heroWeather.value.humidity}%` : '정보 없음'))
const heroWindText = computed(() => (Number.isFinite(heroWeather.value?.wind) ? `${heroWeather.value.wind} m/s` : '정보 없음'))

const heroStateTitle = computed(() => {
  if (heroState.value === 'loading') return '도시 날씨를 불러오는 중입니다'
  if (heroState.value === 'error') return '날씨 정보를 표시할 수 없습니다'
  if (heroState.value === 'unavailable') return '실시간 날씨를 준비할 수 없습니다'
  return '표시할 도시가 없습니다'
})

const heroStateCopy = computed(() => {
  if (heroState.value === 'loading') return '최신 관측값을 확인하고 있습니다. 잠시만 기다려 주세요.'
  if (heroState.value === 'empty') return '날씨 데이터를 수신하면 선택한 도시의 요약을 표시합니다.'
  return errorMessage.value
})

const heroObservedMeta = computed(() => {
  if (!heroWeather.value) return { label: '관측 시각', value: '정보 없음' }

  const observedAt = formatWeatherDateTime(heroWeather.value.observedAt, heroWeather.value.timezoneOffset)

  if (observedAt !== '정보 없음') return { label: '관측 시각', value: observedAt }
  return { label: '갱신 시각', value: lastUpdated.value || '정보 없음' }
})

const heroAnnouncement = computed(() => {
  if (!heroWeather.value) return heroStateTitle.value
  return `${heroWeather.value.fullName}, ${heroWeather.value.status || '날씨 설명 없음'}, ${heroTemperatureText.value}`
})

const emptyStateDescription = computed(() => {
  if (normalizedSearchQuery.value && filteredWeatherList.value.length === 0) {
    return `'${normalizedSearchQuery.value}' 검색 결과가 없습니다.`
  }
  if (activeRegion.value !== 'all' && filteredWeatherList.value.length === 0) {
    const region = CITY_REGIONS.find((item) => item.id === activeRegion.value)
    return `${region?.label ?? '선택한 지역'}에 표시할 도시가 없습니다.`
  }
  return worldWeatherList.value.length ? '표시할 도시가 없습니다.' : '수신된 세계 날씨 데이터가 없습니다.'
})

useDocumentTitle(() => (selectedWeather.value ? `${selectedWeather.value.name} 현재 날씨` : '오늘의 날씨'))

const refreshWeather = () => {
  void loadWeather({
    onSuccess: () => ElMessage.success('실시간 날씨를 갱신했습니다.'),
    onError: () => ElMessage.error('날씨 데이터 요청에 실패했습니다.'),
  })
}

const applySelection = (city) => {
  selectCity(city)
  void syncSelectedRoute(city.id)
}

const showCitySelectionMessage = (city) => {
  ElMessage({
    message: `${city.name}이 선택되었습니다.`,
    type: 'primary',
    plain: true,
    duration: 1500,
    grouping: true,
    showClose: false,
    customClass: 'weather-selection-message',
  })
}

const handleSelect = async (city) => {
  isWorldDrawerOpen.value = false
  if (city.id === selectedCityId.value) return

  showCitySelectionMessage(city)

  const requestId = ++promotionRequestId
  window.clearTimeout(promotionTimer)
  promotingCityId.value = city.id
  isHeroPromoting.value = false
  await nextTick()

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const updateHero = async () => {
    applySelection(city)
    await nextTick()
    if (requestId !== promotionRequestId) return

    isHeroPromoting.value = true
    weatherHero.value?.focus({ preventScroll: true })
    weatherHero.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }

  if (!reduceMotion && typeof document.startViewTransition === 'function') {
    try {
      const transition = document.startViewTransition(updateHero)
      await transition.finished
    } catch {
      await updateHero()
    }
  } else {
    await updateHero()
  }

  if (requestId !== promotionRequestId) return
  promotionTimer = window.setTimeout(() => {
    if (requestId !== promotionRequestId) return
    promotingCityId.value = ''
    isHeroPromoting.value = false
  }, 560)
}

const openWeatherDetail = (cityId) => {
  const city = weatherList.value.find((item) => item.id === cityId)
  if (!city) return

  selectedCityInfo.value = `${city.name} 상세 날씨 페이지로 이동합니다.`
  void router.push({
    name: 'WeatherDetail',
    params: { cityId },
    query: { ...route.query, selected: cityId },
  })
}

const closeWorldDrawer = () => {
  isWorldDrawerOpen.value = false
  selectedCityInfo.value = '세계 날씨 서랍을 닫았습니다.'
}

onMounted(() => {
  startLocationExperience()
})

onBeforeUnmount(() => {
  promotionRequestId += 1
  window.clearTimeout(promotionTimer)
  document.documentElement.classList.remove('world-drawer-open')
})

watch(
  () => route.query.search,
  (routeSearch) => {
    const normalizedQuery = normalizeSearchQuery(routeSearch)

    if (normalizeSearchQuery(searchQuery.value) !== normalizedQuery) {
      searchQuery.value = normalizedQuery
    }

    const isCanonical = normalizedQuery ? routeSearch === normalizedQuery : routeSearch === undefined

    if (!isCanonical) {
      const canonicalizationId = ++routeCanonicalizationId
      void router
        .replace({
          query: { ...route.query, search: normalizedQuery || undefined },
        })
        .finally(() => {
          if (canonicalizationId === routeCanonicalizationId) routeCanonicalizationId = 0
        })
    }
  },
  { immediate: true },
)

watch(searchQuery, (newQuery, oldQuery) => {
  const normalizedQuery = normalizeSearchQuery(newQuery)

  if (newQuery !== oldQuery && !isLoading.value && !errorMessage.value) {
    selectedCityInfo.value = selectedWeather.value ? `${selectedWeather.value.name} 선택을 유지하며 검색 결과를 필터링했습니다.` : '검색 결과에서 도시 카드를 선택해 보세요.'
  }

  const routeSearch = normalizeSearchQuery(route.query.search)
  const isCanonical = normalizedQuery ? route.query.search === normalizedQuery : route.query.search === undefined

  if (routeCanonicalizationId && routeSearch === normalizedQuery) return
  if (routeSearch === normalizedQuery && isCanonical) return

  void router.replace({
    query: { ...route.query, search: normalizedQuery || undefined },
  })
})

watch(
  isWorldDrawerOpen,
  (isOpen) => {
    document.documentElement.classList.toggle('world-drawer-open', isOpen)
  },
  { immediate: true },
)

if (import.meta.env.DEV) {
  watch(selectedCityInfo, (message) => {
    console.log(`[watch] 선택 상태 변경: ${message}`)
  })

  watchEffect(() => {
    console.log(`[watchEffect] 검색어 변경: ${searchQuery.value}`)
  })
}
</script>

<template>
  <div class="weather-scene" :class="`hero-state-${heroState}`" :style="heroTheme.cssVariables" :data-theme="heroTheme.name">
    <WeatherBackgroundVideo :category="heroTheme.category" :theme-name="heroTheme.name" />
    <div class="scene-atmosphere" aria-hidden="true"></div>

    <div class="weather-shell">
      <div class="hero-stage">
        <section
          ref="weatherHero"
          class="weather-hero"
          :class="{ 'is-promoting': isHeroPromoting }"
          :style="{ viewTransitionName: promotingCityId && heroWeather?.id === promotingCityId ? 'weather-promotion' : undefined }"
          :aria-busy="isLoading || locationPromptState === 'requesting'"
          :aria-labelledby="locationPromptState ? 'location-consent-title' : 'weather-hero-title'"
          tabindex="-1"
        >
          <p class="sr-only" aria-live="polite">{{ heroAnnouncement }}</p>
          <LocationPermissionPanel v-if="locationPromptState" :state="locationPromptState" :message="locationPromptMessage" @accept="requestLocationWeather" @dismiss="dismissLocationPrompt" />

          <template v-else>
            <button class="refresh-button" type="button" :disabled="!apiReady || isLoading" :aria-label="isLoading ? '날씨 갱신 중' : '날씨 새로고침'" @click="refreshWeather">
              <svg viewBox="0 0 24 24" :class="{ 'is-spinning': isLoading }" aria-hidden="true">
                <path d="M20 6v5h-5" />
                <path d="M18.2 15a7 7 0 1 1-.7-7.1L20 11" />
              </svg>
            </button>

            <div v-if="heroWeather" class="hero-face hero-face-front">
              <div class="hero-location">
                <h1 id="weather-hero-title">{{ heroCityName }}</h1>
                <div class="hero-country-line">
                  <span>{{ heroCountryName }}</span>
                  <span v-if="heroWeather.isCurrentLocation" class="current-location-label">내 위치</span>
                  <button v-else-if="currentLocationWeather" class="return-location-button" type="button" @click="handleSelect(currentLocationWeather)">내 위치로</button>
                </div>
              </div>

              <div class="hero-weather-lockup" role="group" :aria-label="`현재 기온 ${heroTemperatureText}`">
                <div class="hero-condition-summary">
                  <span>{{ heroWeather.status || heroTheme.label || '날씨 설명 없음' }}</span>
                  <TemperatureConditionLabel v-if="hasHeroTemperature" class="hero-temperature-condition" :temperature="heroWeather.temp" />
                </div>
                <div class="hero-temperature" :class="{ missing: !hasHeroTemperature }">
                  <strong>{{ hasHeroTemperature ? heroTemp : '정보 없음' }}</strong>
                  <span v-if="hasHeroTemperature">{{ unitSymbol }}</span>
                </div>
                <div class="hero-icon">
                  <WeatherConditionIcon :category="heroTheme.category" :is-night="heroTheme.isNight" />
                </div>
              </div>

              <dl class="hero-metrics">
                <div>
                  <dt>체감</dt>
                  <dd>{{ heroFeelsLikeText }}</dd>
                </div>
                <div>
                  <dt>습도</dt>
                  <dd>{{ heroHumidityText }}</dd>
                </div>
                <div>
                  <dt>풍속</dt>
                  <dd>{{ heroWindText }}</dd>
                </div>
                <div>
                  <dt>{{ heroObservedMeta.label }}</dt>
                  <dd>{{ heroObservedMeta.value }}</dd>
                </div>
              </dl>

              <button class="hero-detail-button" type="button" :disabled="isHeroPromoting" :aria-label="`${heroWeather.name} 상세 날씨 페이지로 이동`" @click="openWeatherDetail(heroWeather.id)">
                <span>상세 보기</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M14 7l5 5-5 5" />
                </svg>
              </button>
            </div>

            <div v-else class="hero-placeholder">
              <LoadingSpinner v-if="heroState === 'loading'" class="hero-loading-spinner" />
              <div v-else class="hero-placeholder-icon">
                <WeatherConditionIcon category="neutral" :is-night="false" />
              </div>
              <h1 id="weather-hero-title">{{ heroStateTitle }}</h1>
              <p>{{ heroStateCopy }}</p>
            </div>
          </template>
        </section>
      </div>

      <p class="sr-only" aria-live="polite">{{ selectedCityInfo }}</p>
    </div>

    <WorldWeatherDrawer
      :open="isWorldDrawerOpen"
      :regions="CITY_REGIONS"
      :active-region="activeRegion"
      :current-query="searchQuery"
      :items="filteredWeatherList"
      :selected-city-id="selectedCityId"
      :promoting-city-id="promotingCityId"
      :is-loading="isLoading"
      :api-ready="apiReady"
      :error-message="errorMessage"
      :failed-city-count="failedCityCount"
      :empty-description="emptyStateDescription"
      @close="closeWorldDrawer"
      @update-query="(value) => (searchQuery = value)"
      @update-region="(value) => (activeRegion = value)"
      @select-city="handleSelect"
      @open-detail="openWeatherDetail"
    />
  </div>
</template>

<style scoped>
.weather-scene {
  position: relative;
  min-height: 100svh;
  isolation: isolate;
  overflow: clip;
  background:
    radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--weather-accent) 24%, transparent) 0%, transparent 31%),
    radial-gradient(ellipse at 14% 88%, color-mix(in srgb, var(--hero-end) 72%, transparent) 0%, transparent 52%),
    linear-gradient(158deg, var(--hero-start) 0%, color-mix(in srgb, var(--hero-start) 54%, var(--hero-end)) 52%, var(--hero-end) 100%);
  color: var(--hero-text);
  transition:
    --hero-start 500ms ease,
    --hero-end 500ms ease,
    --weather-accent 500ms ease,
    --hero-text 500ms ease,
    --hero-muted 500ms ease,
    color 500ms ease;
}

.weather-scene::before,
.weather-scene::after,
.scene-atmosphere {
  position: absolute;
  pointer-events: none;
  content: '';
}

.weather-scene::before {
  z-index: -2;
  inset: -18% -14% -8%;
  background:
    radial-gradient(ellipse at 12% 28%, rgba(255, 255, 255, 0.34) 0 6%, transparent 28%), radial-gradient(ellipse at 52% 20%, rgba(255, 255, 255, 0.2) 0 8%, transparent 31%),
    radial-gradient(ellipse at 88% 38%, color-mix(in srgb, var(--weather-accent) 22%, transparent) 0 7%, transparent 30%);
  filter: blur(34px);
  opacity: 0.82;
  animation: atmosphere-drift 22s ease-in-out infinite alternate;
}

.weather-scene::after {
  z-index: -1;
  right: -22%;
  bottom: -20%;
  left: -22%;
  height: 62%;
  background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--weather-accent) 26%, transparent) 0%, transparent 62%), linear-gradient(to top, rgba(255, 255, 255, 0.13), transparent 72%);
  filter: blur(58px);
  opacity: 0.72;
}

.scene-atmosphere {
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, 0.22), transparent 48%), linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 48%, rgba(255, 255, 255, 0.07));
}

.weather-scene[data-theme='clouds'] .scene-atmosphere {
  background:
    radial-gradient(ellipse at 14% 20%, rgba(255, 255, 255, 0.31) 0 7%, transparent 26%), radial-gradient(ellipse at 43% 11%, rgba(255, 255, 255, 0.19) 0 9%, transparent 30%),
    radial-gradient(ellipse at 82% 31%, rgba(255, 255, 255, 0.24) 0 8%, transparent 28%);
  filter: blur(18px);
}

.weather-scene[data-theme='rain'] .scene-atmosphere,
.weather-scene[data-theme='thunderstorm'] .scene-atmosphere {
  background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(255, 255, 255, 0.09) 19px, transparent 21px 34px);
  opacity: 0.48;
}

.weather-scene[data-theme='snow'] .scene-atmosphere {
  background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.72) 0 2px, transparent 3px), radial-gradient(circle at 70% 34%, rgba(255, 255, 255, 0.62) 0 3px, transparent 4px),
    radial-gradient(circle at 43% 55%, rgba(255, 255, 255, 0.58) 0 2px, transparent 3px);
  background-size:
    88px 88px,
    122px 122px,
    148px 148px;
}

.weather-scene[data-theme='mist'] .scene-atmosphere {
  background: radial-gradient(ellipse at 18% 30%, rgba(255, 255, 255, 0.28), transparent 48%), radial-gradient(ellipse at 78% 58%, rgba(255, 255, 255, 0.22), transparent 52%);
  filter: blur(28px);
}

@keyframes atmosphere-drift {
  from {
    transform: translate3d(-1.5%, -0.5%, 0) scale(1);
  }

  to {
    transform: translate3d(1.5%, 0.8%, 0) scale(1.035);
  }
}

.weather-shell {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 0;
  perspective: 1800px;
  perspective-origin: 50% 24%;
}

.hero-stage {
  box-sizing: border-box;
  display: grid;
  min-height: 100vh;
  min-height: 100svh;
  place-items: center;
  padding: clamp(72px, 10svh, 104px) 0 calc(var(--floating-nav-height, 54px) + var(--floating-nav-offset, 12px) + 42px + env(safe-area-inset-bottom));
}

.refresh-button {
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
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

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.refresh-button svg {
  width: 18px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.refresh-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: 2px;
}

.refresh-button svg.is-spinning {
  animation: refresh-spin 900ms linear infinite;
}

@keyframes refresh-spin {
  to {
    transform: rotate(1turn);
  }
}

.weather-hero {
  position: relative;
  width: min(820px, 100%);
  margin: 0 auto;
  outline: none;
  perspective: 1600px;
  text-align: center;
}

.hero-face,
.hero-placeholder {
  box-sizing: border-box;
  padding: clamp(28px, 4.8vw, 54px);
  border: 0;
  background: transparent;
  box-shadow: none;
}

.hero-face {
  overflow: visible;
}

.hero-face-front {
  position: relative;
}

.weather-hero.is-promoting {
  animation: hero-promote 520ms cubic-bezier(0.2, 0.85, 0.25, 1);
}

@keyframes hero-promote {
  0% {
    opacity: 0.72;
    transform: translateY(22px) scale(0.975);
  }

  64% {
    transform: translateY(-3px) scale(1.006);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

:global(::view-transition-group(weather-promotion)) {
  z-index: 20;
  animation-duration: 560ms;
  animation-timing-function: cubic-bezier(0.2, 0.85, 0.25, 1);
}

:global(::view-transition-old(weather-promotion)),
:global(::view-transition-new(weather-promotion)) {
  mix-blend-mode: normal;
}

.hero-location {
  display: grid;
  justify-items: center;
  gap: 9px;
}

.hero-country-line {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--hero-muted);
  font-size: clamp(12px, 1.4vw, 15px);
  font-weight: 780;
  letter-spacing: 0.08em;
}

.current-location-label,
.return-location-button {
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 820;
  letter-spacing: 0;
}

.current-location-label {
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  background: color-mix(in srgb, white 16%, transparent);
}

.return-location-button {
  border: 0;
  background: color-mix(in srgb, var(--hero-text) 8%, transparent);
  cursor: pointer;
}

.hero-location h1,
.hero-placeholder h1 {
  margin: 0;
  color: inherit;
  font-size: clamp(58px, 10.5vw, 112px);
  font-weight: 760;
  line-height: 0.88;
  letter-spacing: -0.065em;
}

.hero-location h1 {
  max-width: 100%;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.hero-placeholder h1 {
  font-size: clamp(24px, 4.2vw, 42px);
  line-height: 1.14;
  letter-spacing: -0.045em;
}

.hero-placeholder p {
  margin: 7px 0 0;
  color: var(--hero-muted);
}

.hero-weather-lockup {
  display: grid;
  width: min(620px, 100%);
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(10px, 1.9vw, 22px);
  margin: clamp(25px, 4.5vw, 42px) auto clamp(30px, 4.8vw, 44px);
}

.hero-condition-summary {
  display: grid;
  width: 100%;
  justify-items: end;
  gap: 8px;
  color: var(--hero-muted);
  font-size: clamp(11px, 1.25vw, 14px);
  font-weight: 820;
  line-height: 1.3;
  text-align: right;
}

.hero-icon {
  width: clamp(94px, 13vw, 142px);
  height: clamp(94px, 13vw, 142px);
  justify-self: start;
  padding: 8px;
  color: var(--weather-accent);
}

.hero-temperature {
  position: relative;
  display: block;
  justify-self: center;
  min-width: 0;
  white-space: nowrap;
}

.hero-temperature-condition {
  --temperature-condition-font-size: inherit;
  --temperature-condition-icon-size: 13px;
}

.hero-temperature strong {
  display: block;
  font-size: clamp(78px, 11.5vw, 122px);
  font-weight: 720;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.055em;
  line-height: 0.86;
}

.hero-temperature span {
  position: absolute;
  top: 4px;
  left: 100%;
  margin-left: clamp(8px, 1vw, 14px);
  font-size: 21px;
  font-weight: 800;
  line-height: 1;
}

.hero-temperature.missing strong {
  font-size: clamp(24px, 4vw, 34px);
  letter-spacing: -0.03em;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
}

.hero-metrics > div {
  position: relative;
  min-width: 0;
  padding: 13px 16px;
  border: 0;
  background: transparent;
}

.hero-metrics > div + div::before {
  position: absolute;
  top: 20%;
  bottom: 20%;
  left: 0;
  width: 1px;
  background: color-mix(in srgb, var(--hero-text) 18%, transparent);
  content: '';
}

.hero-metrics dt {
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
}

.hero-metrics dd {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 820;
  overflow-wrap: anywhere;
}

.hero-detail-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  padding: 0 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 820;
  transition: color 180ms ease;
}

.hero-detail-button:hover:not(:disabled) {
  color: inherit;
}

.hero-detail-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.hero-detail-button svg {
  width: 17px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.hero-detail-button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--weather-accent) 66%, white);
  outline-offset: 2px;
}

.hero-placeholder {
  display: grid;
  min-height: 300px;
  place-items: center;
  align-content: center;
}

.hero-placeholder-icon {
  width: 82px;
  height: 82px;
  margin-bottom: 18px;
  padding: 12px;
  color: var(--weather-accent);
}

.hero-loading-spinner {
  --loading-spinner-size: 92px;

  margin-bottom: 22px;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .refresh-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
    color: inherit;
    transform: translateY(-1px);
  }
}

@media (max-width: 560px) {
  .weather-shell {
    width: min(100% - 28px, 1120px);
  }

  .hero-face,
  .hero-placeholder {
    padding: 26px 0 18px;
  }

  .hero-stage {
    padding: 64px 0 calc(var(--floating-nav-height, 54px) + var(--floating-nav-offset, 9px) + 34px + env(safe-area-inset-bottom));
  }

  .hero-weather-lockup {
    gap: 7px;
    margin: 25px auto 28px;
  }

  .hero-condition-summary {
    gap: 4px;
    font-size: 10px;
  }

  .hero-icon {
    width: clamp(76px, 23vw, 104px);
    height: clamp(76px, 23vw, 104px);
    padding: 5px;
  }

  .hero-temperature strong {
    font-size: clamp(58px, 19vw, 82px);
    letter-spacing: -0.045em;
  }

  .hero-temperature span {
    margin-left: 7px;
    font-size: 17px;
  }

  .hero-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
  }

  .hero-metrics > div {
    padding: 12px 10px;
  }

  .hero-metrics > div + div::before {
    display: none;
  }

  .hero-metrics > div:nth-child(even)::before {
    display: block;
  }

  .hero-metrics dd {
    font-size: 13px;
  }

  .hero-detail-button {
    width: auto;
  }
}

@media (max-width: 360px) {
  .hero-location h1 {
    font-size: 50px;
  }

  .hero-temperature strong {
    font-size: 50px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-scene,
  .weather-scene::before,
  .weather-hero.is-promoting {
    animation: none;
    transition: none;
  }

  .hero-detail-button {
    transition: none;
  }

  .refresh-button svg.is-spinning {
    animation: none;
  }

  .refresh-button {
    transition: none;
  }

  .refresh-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
