<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import LoadingSpinner from '@/components/weather/LoadingSpinner.vue'
import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useTemperature } from '@/composables/useTemperature'
import { CITY_CONFIG } from '@/data/cities'
import { fetchWeatherList, hasWeatherApiKey, MissingWeatherApiKeyError } from '@/services/weatherApi'
import { matchesSearchQuery, normalizeSearchQuery } from '@/utils/search'
import { formatWeatherDateTime, getWeatherTheme } from '@/utils/weatherTheme'

const route = useRoute()
const router = useRouter()

const MISSING_API_KEY_MESSAGE = '프로젝트 루트의 .env.local 파일에 VITE_OPENWEATHER_API_KEY를 설정해 주세요.'
const apiReady = hasWeatherApiKey()
const weatherList = ref([])
const searchQuery = ref('')
const selectedCityId = ref('')
const selectedCityInfo = ref(apiReady ? '도시 카드를 선택해 보세요.' : '날씨 데이터를 표시할 수 없습니다.')
const isLoading = ref(apiReady)
const errorMessage = ref(apiReady ? '' : MISSING_API_KEY_MESSAGE)
const failedCityCount = ref(0)
const lastUpdated = ref('')
const promotingCityId = ref('')
const isHeroPromoting = ref(false)
const isCityListOpen = ref(false)
const weatherHero = ref(null)
const cityListEntry = ref(null)
let weatherRequestId = 0
let routeCanonicalizationId = 0
let promotionRequestId = 0
let promotionTimer = 0

const filteredWeatherList = computed(() => {
  const query = normalizeSearchQuery(searchQuery.value)
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => matchesSearchQuery(item.name, query))
})

const otherWeatherList = computed(() => {
  return filteredWeatherList.value.filter((item) => item.id !== selectedCityId.value)
})

const selectedWeather = computed(() => {
  return weatherList.value.find((item) => item.id === selectedCityId.value) ?? null
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
  if (normalizeSearchQuery(searchQuery.value) && filteredWeatherList.value.length === 0) {
    return `'${normalizeSearchQuery(searchQuery.value)}' 검색 결과가 없습니다.`
  }
  if (filteredWeatherList.value.length === 1 && selectedWeather.value?.id === filteredWeatherList.value[0]?.id) {
    return '현재 선택한 도시 외에 표시할 도시가 없습니다.'
  }
  return weatherList.value.length ? '표시할 도시가 없습니다.' : '수신된 날씨 데이터가 없습니다.'
})

const formatApiError = (error) => {
  if (error instanceof MissingWeatherApiKeyError) {
    return MISSING_API_KEY_MESSAGE
  }
  if (error.response?.status === 401) {
    return 'API 키가 유효하지 않거나 아직 활성화되지 않았습니다.'
  }
  return '날씨 데이터를 불러오지 못했습니다. 네트워크와 API 사용량을 확인해 주세요.'
}

const loadWeather = async (notify = false) => {
  const requestId = ++weatherRequestId
  const routeSelectedCityId = typeof route.query.selected === 'string' && CITY_CONFIG.some((city) => city.id === route.query.selected) ? route.query.selected : ''
  const previousSelectedCityId = selectedCityId.value || routeSelectedCityId

  if (!apiReady) {
    weatherList.value = []
    failedCityCount.value = 0
    selectedCityId.value = ''
    lastUpdated.value = ''
    errorMessage.value = MISSING_API_KEY_MESSAGE
    selectedCityInfo.value = '날씨 데이터를 표시할 수 없습니다.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  failedCityCount.value = 0
  selectedCityInfo.value = '날씨 데이터를 갱신하는 중입니다.'

  try {
    const nextWeatherList = await fetchWeatherList(CITY_CONFIG, undefined, ({ failedCount }) => {
      if (requestId === weatherRequestId) failedCityCount.value = failedCount
    })
    if (requestId !== weatherRequestId) return

    weatherList.value = nextWeatherList
    const nextSelectedWeather = nextWeatherList.find((item) => item.id === previousSelectedCityId) ?? nextWeatherList[0] ?? null
    selectedCityId.value = nextSelectedWeather?.id ?? ''
    selectedCityInfo.value = nextSelectedWeather ? `${nextSelectedWeather.name} 날씨를 표시하고 있습니다.` : '표시할 도시가 없습니다.'
    lastUpdated.value = new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())
    if (notify) ElMessage.success('실시간 날씨를 갱신했습니다.')
  } catch (error) {
    if (requestId !== weatherRequestId) return

    weatherList.value = []
    failedCityCount.value = 0
    lastUpdated.value = ''
    errorMessage.value = formatApiError(error)
    selectedCityInfo.value = '날씨 데이터를 표시할 수 없습니다.'
    if (notify) ElMessage.error('날씨 데이터 요청에 실패했습니다.')
  } finally {
    if (requestId === weatherRequestId) isLoading.value = false
  }
}

const syncSelectedRoute = (cityId) => {
  if (route.query.selected === cityId) return Promise.resolve()

  return router.replace({
    query: { ...route.query, selected: cityId },
  })
}

const applySelection = (city) => {
  selectedCityId.value = city.id
  selectedCityInfo.value = city.name + '이 선택되었습니다.'
  void syncSelectedRoute(city.id)
}

const handleSelect = async (city) => {
  if (city.id === selectedCityId.value) return

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

const scrollToOpenedCityList = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  cityListEntry.value?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })
}

const toggleCityList = () => {
  const shouldOpen = !isCityListOpen.value
  isCityListOpen.value = shouldOpen

  selectedCityInfo.value = shouldOpen ? '도시별 날씨 목록을 펼쳤습니다.' : '도시별 날씨 목록을 닫았습니다.'
}

onMounted(() => {
  void loadWeather()
})

onBeforeUnmount(() => {
  weatherRequestId += 1
  promotionRequestId += 1
  window.clearTimeout(promotionTimer)
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

watchEffect(() => {
  document.title = selectedWeather.value ? `${selectedWeather.value.name} 현재 날씨 | Weather` : '오늘의 날씨 | Weather'
})
</script>

<template>
  <div class="weather-scene" :class="`hero-state-${heroState}`" :style="heroTheme.cssVariables" :data-theme="heroTheme.name">
    <div class="scene-atmosphere" aria-hidden="true"></div>

    <div class="weather-shell">
      <div class="hero-stage">
        <section
          ref="weatherHero"
          class="weather-hero"
          :class="{ 'is-promoting': isHeroPromoting }"
          :style="{ viewTransitionName: promotingCityId && heroWeather?.id === promotingCityId ? 'weather-promotion' : undefined }"
          :aria-busy="isLoading"
          aria-labelledby="weather-hero-title"
          tabindex="-1"
        >
          <p class="sr-only" aria-live="polite">{{ heroAnnouncement }}</p>
          <button class="refresh-button" type="button" :disabled="!apiReady || isLoading" :aria-label="isLoading ? '날씨 갱신 중' : '날씨 새로고침'" @click="loadWeather(true)">
            <svg viewBox="0 0 24 24" :class="{ 'is-spinning': isLoading }" aria-hidden="true">
              <path d="M20 6v5h-5" />
              <path d="M18.2 15a7 7 0 1 1-.7-7.1L20 11" />
            </svg>
          </button>

          <div v-if="heroWeather" class="hero-face hero-face-front">
            <div class="hero-location">
              <h1 id="weather-hero-title">{{ heroWeather.fullName }}</h1>
              <p class="condition-label">{{ heroWeather.status || heroTheme.label || '날씨 설명 없음' }}</p>
            </div>

            <div class="hero-current" role="group" :aria-label="`현재 기온 ${heroTemperatureText}`">
              <div class="hero-icon">
                <WeatherConditionIcon :category="heroTheme.category" :is-night="heroTheme.isNight" />
              </div>
              <div class="hero-temperature" :class="{ missing: !hasHeroTemperature }">
                <strong>{{ hasHeroTemperature ? heroTemp : '정보 없음' }}</strong>
                <span v-if="hasHeroTemperature">{{ unitSymbol }}</span>
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
        </section>

        <div ref="cityListEntry" class="hero-search-stack">
          <BaseDashboardCard class="hero-search">
            <SearchBar :current-query="searchQuery" @update-query="(value) => (searchQuery = value)" />
          </BaseDashboardCard>

          <button
            class="list-jump-button"
            type="button"
            aria-controls="city-weather-region"
            :aria-expanded="isCityListOpen"
            :aria-label="isCityListOpen ? '도시 목록 닫기' : '도시 목록 열기'"
            @click="toggleCityList"
          >
            <span>도시 목록</span>
            <svg viewBox="0 0 20 20" :class="{ 'is-open': isCityListOpen }" aria-hidden="true">
              <path d="m5 7 5 5 5-5" />
            </svg>
          </button>
        </div>
      </div>

      <Transition name="city-list" @after-enter="scrollToOpenedCityList">
        <div v-show="isCityListOpen" class="city-list-reveal">
          <section id="city-weather-region" class="city-section" aria-label="도시별 날씨 목록">
            <p v-if="failedCityCount" class="partial-warning" role="status">{{ failedCityCount }}개 도시는 잠시 불러오지 못했습니다.</p>
            <BaseDashboardCard class="weather-content" :aria-busy="isLoading">
              <div v-if="isLoading" class="state-panel loading-state">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="errorMessage" class="state-panel">
                <el-result :icon="apiReady ? 'error' : 'warning'" title="날씨 정보를 표시할 수 없습니다" :sub-title="errorMessage" />
              </div>
              <div v-else-if="otherWeatherList.length" class="weather-results">
                <div id="city-weather-list" class="weather-list">
                  <WeatherCard
                    v-for="item in otherWeatherList"
                    :key="item.id"
                    :city-item="item"
                    :selected="item.id === selectedCityId"
                    :promoting="item.id === promotingCityId"
                    :style="getWeatherTheme(item).cssVariables"
                    @select-card="handleSelect"
                    @click-detail="openWeatherDetail"
                  />
                </div>
              </div>
              <div v-else class="state-panel empty-state">
                <el-empty :description="emptyStateDescription" />
              </div>
            </BaseDashboardCard>
          </section>
        </div>
      </Transition>

      <p class="sr-only" aria-live="polite">{{ selectedCityInfo }}</p>
    </div>
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
  padding: 0 0 calc(116px + env(safe-area-inset-bottom));
  perspective: 1800px;
  perspective-origin: 50% 24%;
}

.hero-stage {
  box-sizing: border-box;
  display: grid;
  min-height: 100vh;
  min-height: 100svh;
  grid-template-rows: minmax(min-content, 1fr) auto;
  align-items: center;
  row-gap: clamp(18px, 2.4svh, 32px);
  padding: clamp(24px, 5vh, 58px) 0 var(--floating-nav-clearance, calc(80px + env(safe-area-inset-bottom)));
}

.hero-search-stack {
  position: relative;
  width: min(620px, 100%);
  min-width: 0;
  margin: 0 auto;
  scroll-margin-top: clamp(52px, 9svh, 132px);
}

.hero-search {
  width: 100%;
}

.list-jump-button {
  position: absolute;
  z-index: 1;
  top: calc(100% - 10px);
  left: 50%;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  transform: translateX(-50%);
  transition:
    color 180ms ease,
    transform 180ms ease;
}

.list-jump-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.list-jump-button svg.is-open {
  transform: rotate(180deg);
}

.list-jump-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: 1px;
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
}

.condition-label {
  margin: 8px 0 0;
  padding: 0;
  border: 0;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 800;
}

.hero-location h1,
.hero-placeholder h1 {
  margin: 0;
  color: inherit;
  font-size: clamp(24px, 4.2vw, 42px);
  line-height: 1.14;
  letter-spacing: -0.045em;
}

.hero-placeholder p {
  margin: 7px 0 0;
  color: var(--hero-muted);
}

.hero-current {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 2.4vw, 26px);
  margin: 26px 0 30px;
}

.hero-icon {
  width: clamp(118px, 16vw, 172px);
  height: clamp(118px, 16vw, 172px);
  padding: 12px;
  color: var(--weather-accent);
  transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-temperature {
  display: flex;
  align-items: flex-start;
  gap: clamp(8px, 1vw, 14px);
  min-width: 0;
  white-space: nowrap;
}

.hero-temperature strong {
  font-size: clamp(72px, 11vw, 112px);
  font-weight: 720;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.055em;
  line-height: 0.86;
}

.hero-temperature span {
  margin-top: 4px;
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
  transition: transform 180ms ease;
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
  transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-loading-spinner {
  --loading-spinner-size: 92px;

  margin-bottom: 22px;
}

.city-list-reveal {
  --city-list-lift: 108px;

  display: grid;
  grid-template-rows: 1fr;
  margin-top: calc(0px - var(--city-list-lift));
}

.city-section {
  box-sizing: border-box;
  width: min(980px, 100%);
  min-height: 0;
  margin: 0 auto;
  padding-top: clamp(22px, 4svh, 44px);
}

.city-list-enter-active,
.city-list-leave-active {
  overflow: clip;
  transition:
    grid-template-rows 480ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 240ms ease;
}

.city-list-enter-active .city-section,
.city-list-leave-active .city-section {
  overflow: clip;
  transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

.city-list-enter-from,
.city-list-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.city-list-enter-from .city-section,
.city-list-leave-to .city-section {
  transform: translateY(-18px);
}

.partial-warning {
  margin: 0 4px 12px;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 650;
}

.weather-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .weather-hero:not(.is-promoting):hover .hero-icon,
  .weather-hero:not(.is-promoting):hover .hero-placeholder-icon {
    transform: translateY(-8px) scale(1.045);
  }

  .refresh-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
    color: inherit;
    transform: translateY(-1px);
  }

  .hero-detail-button:hover:not(:disabled) svg {
    transform: translateX(3px);
  }

  .list-jump-button:hover {
    color: inherit;
    transform: translate(-50%, 2px);
  }
}

.state-panel {
  min-height: 190px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
}

.loading-state {
  padding: 28px;
}

.state-panel :deep(.el-result__title p),
.state-panel :deep(.el-result__subtitle p),
.state-panel :deep(.el-empty__description p) {
  color: var(--hero-text);
}

@media (max-width: 800px) {
  .weather-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
    padding-top: 20px;
  }

  .hero-current {
    margin: 22px 0 26px;
    gap: 10px;
  }

  .hero-icon {
    width: clamp(96px, 28vw, 126px);
    height: clamp(96px, 28vw, 126px);
    padding: 8px;
  }

  .hero-temperature {
    gap: 7px;
  }

  .hero-temperature strong {
    font-size: clamp(58px, 20vw, 76px);
    letter-spacing: -0.045em;
  }

  .hero-temperature span {
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

  .weather-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 360px) {
  .hero-temperature strong {
    font-size: 54px;
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

  .hero-icon,
  .hero-placeholder-icon {
    transition: none;
  }

  .refresh-button svg.is-spinning {
    animation: none;
  }

  .refresh-button {
    transition: none;
  }

  .hero-detail-button svg {
    transition: none;
  }

  .list-jump-button {
    transition: none;
  }

  .list-jump-button svg,
  .city-list-enter-active,
  .city-list-leave-active,
  .city-list-enter-active .city-section,
  .city-list-leave-active .city-section {
    transition: none;
  }

  .hero-detail-button:hover:not(:disabled) svg,
  .refresh-button:hover:not(:disabled) {
    transform: none;
  }

  .list-jump-button:hover {
    transform: translateX(-50%);
  }

  .weather-hero:hover .hero-icon,
  .weather-hero:hover .hero-placeholder-icon {
    transform: none;
  }
}
</style>
