<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import WeatherScene from '@/components/common/WeatherScene.vue'
import DestinationSearch from '@/components/travel/DestinationSearch.vue'
import ItineraryResult from '@/components/travel/ItineraryResult.vue'
import NearbyPlacesList from '@/components/travel/NearbyPlacesList.vue'
import TravelPreferencesForm from '@/components/travel/TravelPreferencesForm.vue'
import TravelWeatherSummary from '@/components/travel/TravelWeatherSummary.vue'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { fetchAirQuality, fetchDestinationClimate, fetchDestinationForecast, fetchNearbyPlaces, searchDestinations } from '@/services/travelApi'
import { createTrip, generateItinerary } from '@/services/tripsService'
import { getWeatherRequestErrorMessage } from '@/services/weatherErrors'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateAfter = (offset) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return formatDateInput(date)
}

const minDate = dateAfter(0)
const maxDate = dateAfter(365)
const preferences = reactive({
  startDate: minDate,
  endDate: dateAfter(2),
  pace: 'balanced',
  interests: ['food', 'culture'],
})

const query = ref('')
const destinations = ref([])
const selectedDestination = ref(null)
const isSearching = ref(false)
const searchError = ref('')
const forecast = ref(null)
const airQuality = ref(null)
const climate = ref(null)
const places = ref([])
const selectedPlaceIds = ref([])
const isContextLoading = ref(false)
const isClimateLoading = ref(false)
const contextError = ref('')
const contextNotice = ref('')
const climateError = ref('')
const itinerary = ref(null)
const itineraryCitations = ref([])
const savedTrip = ref(null)
const isGenerating = ref(false)
const isSaving = ref(false)
const actionError = ref('')
const resultSection = ref(null)
let searchTimer = 0
let searchController = null
let contextController = null
let contextRequestId = 0

const isLoggedIn = computed(() => Boolean(authStore.isLoggedIn))
const selectedPlaces = computed(() => places.value.filter((place) => selectedPlaceIds.value.includes(place.id)))
const maxEndDate = computed(() => {
  if (!preferences.startDate) return maxDate
  const date = new Date(`${preferences.startDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return maxDate
  date.setDate(date.getDate() + 13)
  return [formatDateInput(date), maxDate].sort()[0]
})
const plannedDates = computed(() => {
  const start = Date.parse(`${preferences.startDate}T00:00:00Z`)
  const end = Date.parse(`${preferences.endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return []

  const dates = []
  for (let timestamp = start; timestamp <= end && dates.length < 14; timestamp += 86_400_000) {
    dates.push(new Date(timestamp).toISOString().slice(0, 10))
  }
  return dates
})
const formatDateInTimezone = (timeZone) => {
  const now = new Date()

  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)
    const part = (type) => parts.find((entry) => entry.type === type)?.value
    const year = part('year')
    const month = part('month')
    const day = part('day')
    if (year && month && day) return `${year}-${month}-${day}`
  } catch {
    // Invalid destination timezone metadata follows the server's UTC fallback.
  }

  return now.toISOString().slice(0, 10)
}
const destinationToday = computed(() => formatDateInTimezone(selectedDestination.value?.timezone))
const selectedForecast = computed(() => {
  if (!forecast.value) return null
  const daily = (forecast.value.daily ?? []).filter((day) => {
    const date = day?.date ?? day?.localDate
    return !date || (date >= preferences.startDate && date <= preferences.endDate)
  })
  return { ...forecast.value, daily }
})
const availableForecastDates = computed(() => new Set((forecast.value?.daily ?? []).map((day) => day?.date ?? day?.localDate).filter(Boolean)))
const missingForecastDates = computed(() => plannedDates.value.filter((date) => !availableForecastDates.value.has(date)))
const forecastCoversSelection = computed(() => {
  return Boolean(plannedDates.value.length && missingForecastDates.value.length === 0)
})
const missingForecastDatesAreFuture = computed(() => missingForecastDates.value.length > 0 && missingForecastDates.value.every((date) => date > destinationToday.value))
const climateReference = computed(() => {
  if (!missingForecastDatesAreFuture.value || !climate.value) return null
  const months = new Set(missingForecastDates.value.map((date) => Number(date.slice(5, 7))))
  return {
    ...climate.value,
    months: (climate.value.months ?? []).filter((month) => months.has(month.month)),
  }
})
const showClimateReference = computed(() => Boolean(selectedDestination.value && missingForecastDatesAreFuture.value))
const climateCoversMissingDates = computed(() => {
  if (!missingForecastDates.value.length) return true
  if (!showClimateReference.value) return false
  const availableMonths = new Set((climateReference.value?.months ?? []).map((month) => month.month))
  return missingForecastDates.value.every((date) => availableMonths.has(Number(date.slice(5, 7))))
})
const hasCompleteWeatherContext = computed(() => forecastCoversSelection.value || climateCoversMissingDates.value)
const weatherContextError = computed(() => {
  if (contextError.value) return contextError.value
  if (!selectedDestination.value || !missingForecastDates.value.length || missingForecastDatesAreFuture.value) return ''
  return '선택한 날짜 중 오늘 또는 지난 날짜의 예보가 없어 일정을 만들 수 없습니다. 예보를 다시 불러오거나 미래 날짜를 선택해 주세요.'
})
const canCreatePlan = computed(() =>
  Boolean(
    selectedDestination.value &&
    plannedDates.value.length &&
    hasCompleteWeatherContext.value &&
    !isContextLoading.value &&
    (!showClimateReference.value || !isClimateLoading.value) &&
    !isGenerating.value,
  ),
)
const planButtonLabel = computed(() => {
  if (!isLoggedIn.value) return '로그인하고 일정 만들기'
  if (isGenerating.value) return '날씨에 맞춰 정리하는 중'
  return itinerary.value ? '일정 다시 만들기' : '여행 일정 만들기'
})

useDocumentTitle(() => '여행 날씨 계획')

const friendlyError = (error, fallback) => {
  if (error?.code === 'AUTH_REQUIRED') return '맞춤 일정은 로그인 후 만들 수 있습니다.'
  if (error?.code === 'SERVICE_NOT_CONFIGURED') return '맞춤 일정 기능을 준비하고 있습니다. 설정을 확인한 뒤 다시 시도해 주세요.'
  if (error?.code === 'AI_RATE_LIMITED') return '이번 시간대의 일정 생성 횟수를 모두 사용했습니다. 잠시 후 다시 시도해 주세요.'
  if (error?.code === 'AI_PROVIDER_RATE_LIMITED' || error?.status === 429) {
    return 'AI 요청이 잠시 많습니다. 잠시 후 다시 시도해 주세요.'
  }
  return fallback
}

const resetDestinationContext = () => {
  contextController?.abort()
  contextRequestId += 1
  forecast.value = null
  airQuality.value = null
  climate.value = null
  places.value = []
  selectedPlaceIds.value = []
  isContextLoading.value = false
  isClimateLoading.value = false
  contextError.value = ''
  contextNotice.value = ''
  climateError.value = ''
  itinerary.value = null
  itineraryCitations.value = []
  savedTrip.value = null
  actionError.value = ''
}

const clearDestination = () => {
  selectedDestination.value = null
  query.value = ''
  destinations.value = []
  searchError.value = ''
  resetDestinationContext()
}

const updateQuery = (value) => {
  if (selectedDestination.value && value !== selectedDestination.value.name) {
    selectedDestination.value = null
    resetDestinationContext()
  }
  query.value = value
}

const runDestinationSearch = async () => {
  window.clearTimeout(searchTimer)
  searchTimer = 0
  const normalizedQuery = query.value.trim()
  searchController?.abort()

  if (selectedDestination.value || normalizedQuery.length < 2) {
    destinations.value = []
    searchError.value = ''
    isSearching.value = false
    return
  }

  const controller = new AbortController()
  searchController = controller
  isSearching.value = true
  searchError.value = ''

  try {
    destinations.value = await searchDestinations(normalizedQuery, { count: 8, language: 'ko', signal: controller.signal })
  } catch (error) {
    if (error?.name !== 'AbortError') {
      destinations.value = []
      searchError.value = '도시 검색이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    if (searchController === controller) {
      isSearching.value = false
      searchController = null
    }
  }
}

const loadDestinationContext = async (destination) => {
  contextController?.abort()
  const controller = new AbortController()
  contextController = controller
  const requestId = ++contextRequestId
  isContextLoading.value = true
  isClimateLoading.value = true
  contextError.value = ''
  contextNotice.value = ''
  climateError.value = ''

  const climateRequest = Promise.allSettled([fetchDestinationClimate(destination, { signal: controller.signal })]).then(([result]) => result)
  const [forecastResult, airResult, placesResult] = await Promise.allSettled([
    fetchDestinationForecast(destination, { signal: controller.signal }),
    fetchAirQuality(destination, { signal: controller.signal }),
    fetchNearbyPlaces(destination, { limit: 8, language: 'ko', signal: controller.signal }),
  ])

  if (requestId !== contextRequestId || controller.signal.aborted) return

  forecast.value = forecastResult.status === 'fulfilled' ? forecastResult.value : null
  airQuality.value = airResult.status === 'fulfilled' ? airResult.value : null
  places.value = placesResult.status === 'fulfilled' ? placesResult.value : []
  selectedPlaceIds.value = places.value.slice(0, 5).map((place) => place.id)

  if (!forecast.value) {
    contextError.value = getWeatherRequestErrorMessage(forecastResult.reason, '여행지 예보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
  } else if (airResult.status === 'rejected' || placesResult.status === 'rejected') {
    contextNotice.value = '일부 주변 정보는 불러오지 못했지만 날씨 일정은 만들 수 있습니다.'
  }

  isContextLoading.value = false

  const climateResult = await climateRequest
  if (requestId !== contextRequestId || controller.signal.aborted) return

  if (climateResult.status === 'fulfilled') {
    climate.value = climateResult.value
  } else if (climateResult.reason?.name !== 'AbortError') {
    climateError.value = '과거 기후 참고를 불러오지 못했습니다.'
  }
  isClimateLoading.value = false
  contextController = null
}

const selectDestination = (destination) => {
  selectedDestination.value = destination
  query.value = destination.name
  destinations.value = []
  searchError.value = ''
  resetDestinationContext()
  void loadDestinationContext(destination)
}

const retryDestinationContext = () => {
  if (!selectedDestination.value || isContextLoading.value) return
  const destination = selectedDestination.value
  resetDestinationContext()
  void loadDestinationContext(destination)
}

const buildPlanInput = () => ({
  destination: selectedDestination.value,
  startDate: preferences.startDate,
  endDate: preferences.endDate,
  preferences: {
    pace: preferences.pace,
    interests: preferences.interests,
  },
  forecast: selectedForecast.value,
  airQuality: airQuality.value,
  climateReference: climateReference.value,
  places: selectedPlaces.value,
})

const requestPlan = async () => {
  if (!isLoggedIn.value) {
    await router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  if (!canCreatePlan.value) return

  isGenerating.value = true
  actionError.value = ''
  savedTrip.value = null

  try {
    const response = await generateItinerary(buildPlanInput())
    itinerary.value = response?.itinerary ?? response
    itineraryCitations.value = Array.isArray(response?.meta?.citations) ? response.meta.citations : []
    savedTrip.value = response?.trip ?? null
    await nextTick()
    resultSection.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  } catch (error) {
    actionError.value = friendlyError(error, '여행 일정을 만들지 못했습니다.')
  } finally {
    isGenerating.value = false
  }
}

const savePlan = async () => {
  if (!itinerary.value || !isLoggedIn.value || isSaving.value) return
  isSaving.value = true
  actionError.value = ''

  try {
    savedTrip.value = await createTrip({
      ...buildPlanInput(),
      title: `${selectedDestination.value.name} 여행`,
      weatherSnapshot: selectedForecast.value,
      airQualitySnapshot: airQuality.value,
      itinerary: itinerary.value,
    })
  } catch (error) {
    actionError.value = friendlyError(error, '여행을 저장하지 못했습니다.')
  } finally {
    isSaving.value = false
  }
}

watch(query, () => {
  window.clearTimeout(searchTimer)
  if (selectedDestination.value) return
  searchTimer = window.setTimeout(runDestinationSearch, 280)
})

watch([() => preferences.startDate, () => preferences.endDate], ([startDate]) => {
  if (!startDate) return
  if (!preferences.endDate || preferences.endDate < startDate) preferences.endDate = startDate
  if (preferences.endDate > maxEndDate.value) preferences.endDate = maxEndDate.value
})

const updatePreferences = (value) => {
  Object.assign(preferences, value)
  savedTrip.value = null
}

onMounted(() => {
  if (typeof route.query.destination === 'string') query.value = route.query.destination.trim()
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
  searchController?.abort()
  contextController?.abort()
})
</script>

<template>
  <WeatherScene>
    <div class="travel-shell">
      <section class="planner-panel" aria-label="여행 일정 만들기">
        <div class="planner-column planner-inputs">
          <DestinationSearch
            :query="query"
            :results="destinations"
            :selected-destination="selectedDestination"
            :is-loading="isSearching"
            :error-message="searchError"
            @update:query="updateQuery"
            @search="runDestinationSearch"
            @select="selectDestination"
            @clear="clearDestination"
          />

          <TravelPreferencesForm
            :model-value="preferences"
            :min-date="minDate"
            :max-date="maxDate"
            :max-end-date="maxEndDate"
            :disabled="!selectedDestination"
            @update:model-value="updatePreferences"
          />
        </div>

        <div class="planner-column planner-context">
          <template v-if="selectedDestination">
            <TravelWeatherSummary
              :destination="selectedDestination"
              :forecast="forecast"
              :air-quality="airQuality"
              :climate="climateReference"
              :climate-dates="missingForecastDates"
              :start-date="preferences.startDate"
              :end-date="preferences.endDate"
              :show-climate-reference="showClimateReference"
              :is-loading="isContextLoading"
              :is-climate-loading="isClimateLoading"
              :error-message="weatherContextError"
              :climate-error-message="climateError"
              @retry="retryDestinationContext"
            />
            <NearbyPlacesList v-model="selectedPlaceIds" :places="places" :is-loading="isContextLoading" />
          </template>

          <div v-else class="context-placeholder" aria-hidden="true">
            <span>01</span>
            <strong>도시를 먼저 선택하세요.</strong>
            <p>예보와 주변 장소가 이곳에 이어서 표시됩니다.</p>
          </div>
        </div>

        <div class="planner-submit">
          <div>
            <p v-if="showClimateReference && isClimateLoading">선택한 달의 과거 기후를 확인하고 있습니다.</p>
            <p v-else-if="showClimateReference && climateError">장기 날짜는 기후 참고를 불러온 뒤 일정을 만들 수 있습니다.</p>
            <p v-else-if="weatherContextError">{{ weatherContextError }}</p>
            <p v-else-if="showClimateReference">예보가 없는 미래 날짜에는 과거 기후 참고만 반영합니다.</p>
            <p v-else-if="contextNotice">{{ contextNotice }}</p>
            <p v-else-if="!isLoggedIn">일정 생성과 저장은 로그인 후 이용할 수 있습니다.</p>
            <p v-else>최대 14일의 날씨와 선택한 장소만 일정에 반영합니다.</p>
            <RouterLink v-if="!isLoggedIn" :to="{ name: 'Login', query: { redirect: route.fullPath } }">로그인</RouterLink>
          </div>
          <button type="button" :disabled="isLoggedIn && !canCreatePlan" @click="requestPlan">
            <span v-if="isGenerating" class="button-spinner" aria-hidden="true"></span>
            {{ planButtonLabel }}
            <svg v-if="!isGenerating" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>

        <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>
      </section>

      <section v-if="itinerary" ref="resultSection" class="result-section">
        <ItineraryResult
          :itinerary="itinerary"
          :can-save="isLoggedIn"
          :is-saved="Boolean(savedTrip)"
          :is-saving="isSaving"
          :is-regenerating="isGenerating"
          :citations="itineraryCitations"
          @save="savePlan"
          @regenerate="requestPlan"
        />
      </section>
    </div>
  </WeatherScene>
</template>

<style scoped>
.travel-shell {
  position: relative;
  z-index: 1;
  display: grid;
  align-items: center;
  width: min(1060px, calc(100% - 40px));
  min-height: 100svh;
  margin: 0 auto;
  padding: clamp(48px, 8svh, 88px) 0 calc(var(--floating-nav-height, 62px) + var(--floating-nav-offset, 12px) + 72px + env(safe-area-inset-bottom));
}

.planner-panel {
  display: grid;
  grid-template-columns: minmax(300px, 0.83fr) minmax(0, 1.17fr);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, white 24%, transparent);
  border-radius: 24px;
  background: linear-gradient(145deg, color-mix(in srgb, white 14%, transparent), color-mix(in srgb, white 5%, transparent));
  box-shadow: 0 18px 54px color-mix(in srgb, var(--hero-end) 21%, transparent);
  backdrop-filter: blur(24px) saturate(112%);
  -webkit-backdrop-filter: blur(24px) saturate(112%);
}

.planner-column {
  display: grid;
  align-content: start;
  gap: 30px;
  padding: clamp(22px, 3.5vw, 34px);
}

.planner-context {
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.context-placeholder {
  display: grid;
  min-height: 390px;
  align-content: center;
  justify-items: center;
  color: var(--hero-muted);
  text-align: center;
}

.context-placeholder > span {
  margin-bottom: 13px;
  color: var(--weather-accent);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.12em;
}

.context-placeholder strong {
  color: var(--hero-text);
  font-size: 15px;
}

.context-placeholder p {
  margin: 4px 0 0;
  font-size: 11px;
}

.planner-submit {
  display: flex;
  grid-column: 1 / -1;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 13px clamp(22px, 3.5vw, 34px);
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.planner-submit > div {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.planner-submit p {
  margin: 0;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 700;
}

.planner-submit a {
  color: var(--hero-text);
  font-size: 10px;
  font-weight: 850;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.planner-submit > button {
  display: inline-flex;
  min-width: 162px;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 16px;
  border: 1px solid var(--hero-text);
  border-radius: 11px;
  background: var(--hero-text);
  color: var(--hero-start);
  cursor: pointer;
  font-size: 11px;
  font-weight: 840;
}

.planner-submit > button:disabled {
  cursor: not-allowed;
  opacity: 0.43;
}

.planner-submit > button svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.button-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, currentcolor 28%, transparent);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: plan-spin 720ms linear infinite;
}

.action-error {
  grid-column: 1 / -1;
  margin: -1px 0 0;
  padding: 11px clamp(22px, 3.5vw, 34px);
  border-top: 1px solid color-mix(in srgb, #9b4d46 17%, transparent);
  color: color-mix(in srgb, #9b4d46 82%, var(--hero-text));
  font-size: 10px;
  font-weight: 760;
  text-align: right;
}

.result-section {
  scroll-margin-top: 34px;
  margin-top: clamp(50px, 8svh, 82px);
}

@keyframes plan-spin {
  to {
    transform: rotate(1turn);
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .planner-panel {
    background: color-mix(in srgb, var(--hero-start) 86%, white);
  }
}

@media (max-width: 840px) {
  .planner-panel {
    grid-template-columns: 1fr;
  }

  .planner-context {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
    border-left: 0;
  }

  .context-placeholder {
    min-height: 180px;
  }
}

@media (max-width: 560px) {
  .travel-shell {
    width: min(100% - 28px, 1060px);
    padding-top: 42px;
  }

  .planner-panel {
    border-radius: 20px;
  }

  .planner-column {
    padding: 21px 17px;
  }

  .planner-submit {
    align-items: stretch;
    flex-direction: column;
    padding: 16px 17px 18px;
  }

  .planner-submit > div {
    display: block;
  }

  .planner-submit a {
    display: inline-block;
    margin-top: 4px;
  }

  .planner-submit > button {
    width: 100%;
  }

  .action-error {
    padding-inline: 17px;
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .button-spinner {
    animation: none;
  }
}
</style>
