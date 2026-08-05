<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import WeatherScene from '@/components/common/WeatherScene.vue'
import ItineraryResult from '@/components/travel/ItineraryResult.vue'
import SavedTripsList from '@/components/travel/SavedTripsList.vue'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { listTrips, removeTrip } from '@/services/tripsService'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const trips = ref([])
const selectedTrip = ref(null)
const isLoading = ref(false)
const isLoggingOut = ref(false)
const removingId = ref(null)
const errorMessage = ref('')
const logoutError = ref('')

const userLabel = computed(() => authStore.user?.user_metadata?.name || authStore.user?.email || '내 계정')
const selectedItinerary = computed(() => selectedTrip.value?.itinerary || selectedTrip.value?.generatedPlan || selectedTrip.value?.generated_plan || null)

useDocumentTitle(() => '내 여행')

const loadSavedTrips = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    trips.value = await listTrips()
    if (selectedTrip.value) selectedTrip.value = trips.value.find((trip) => trip.id === selectedTrip.value.id) ?? null
  } catch (error) {
    errorMessage.value = error?.code === 'SERVICE_NOT_CONFIGURED' ? '저장 기능을 준비하고 있습니다.' : error?.message || '저장한 여행을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const selectTrip = (trip) => {
  selectedTrip.value = selectedTrip.value?.id === trip.id ? null : trip
}

const deleteTrip = async (tripId) => {
  if (removingId.value !== null) return
  removingId.value = tripId
  errorMessage.value = ''

  try {
    await removeTrip(tripId)
    trips.value = trips.value.filter((trip) => trip.id !== tripId)
    if (selectedTrip.value?.id === tripId) selectedTrip.value = null
  } catch (error) {
    errorMessage.value = error?.message || '여행을 삭제하지 못했습니다.'
  } finally {
    removingId.value = null
  }
}

const logout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  logoutError.value = ''

  try {
    const succeeded = await authStore.logout()
    if (!succeeded) {
      logoutError.value = authStore.errorMessage || '로그아웃하지 못했습니다.'
      return
    }
    await router.replace({ name: 'WeatherHome' })
  } catch (error) {
    logoutError.value = error?.message || '로그아웃하지 못했습니다.'
  } finally {
    isLoggingOut.value = false
  }
}

onMounted(loadSavedTrips)
</script>

<template>
  <WeatherScene>
    <div class="trips-shell">
      <header class="trips-hero">
        <div>
          <span>SAVED TRIPS</span>
          <h1>내 여행</h1>
          <p>{{ userLabel }}</p>
        </div>
        <div class="trips-hero-actions">
          <RouterLink :to="{ name: 'TravelPlanner' }">
            새 여행 계획
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </RouterLink>
          <button type="button" :disabled="isLoggingOut" @click="logout">
            {{ isLoggingOut ? '로그아웃 중' : '로그아웃' }}
          </button>
        </div>
      </header>

      <p v-if="logoutError" class="logout-error" role="alert">{{ logoutError }}</p>

      <section class="saved-section" aria-labelledby="saved-trips-title">
        <header>
          <h2 id="saved-trips-title">저장한 일정</h2>
          <span>{{ trips.length }}개</span>
        </header>

        <p v-if="errorMessage" class="trips-error" role="alert">
          {{ errorMessage }}
          <button type="button" @click="loadSavedTrips">다시 시도</button>
        </p>

        <SavedTripsList :trips="trips" :selected-trip-id="selectedTrip?.id" :is-loading="isLoading" :removing-id="removingId" @select="selectTrip" @remove="deleteTrip" />
      </section>

      <section v-if="selectedTrip" class="selected-trip-section" aria-live="polite">
        <ItineraryResult v-if="selectedItinerary" :itinerary="selectedItinerary" :can-regenerate="false" />
        <div v-else class="missing-itinerary">
          <strong>저장된 일정 내용이 없습니다.</strong>
          <p>새 여행 계획에서 날씨에 맞는 일정을 다시 만들어 주세요.</p>
          <RouterLink :to="{ name: 'TravelPlanner', query: { destination: selectedTrip.destination?.name } }">다시 계획하기</RouterLink>
        </div>
      </section>
    </div>
  </WeatherScene>
</template>

<style scoped>
.trips-shell {
  position: relative;
  z-index: 1;
  width: min(940px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(48px, 8svh, 88px) 0 calc(var(--floating-nav-height, 62px) + var(--floating-nav-offset, 12px) + 72px + env(safe-area-inset-bottom));
}

.trips-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: clamp(34px, 6svh, 58px);
}

.trips-hero > div > span {
  display: block;
  margin-bottom: 8px;
  color: var(--weather-accent);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.15em;
}

.trips-hero h1 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(46px, 8vw, 72px);
  line-height: 0.92;
  letter-spacing: -0.065em;
}

.trips-hero p {
  margin: 12px 0 0;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
}

.trips-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trips-hero-actions > a {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border: 1px solid var(--hero-text);
  border-radius: 10px;
  background: var(--hero-text);
  color: var(--hero-start);
  font-size: 10px;
  font-weight: 830;
}

.trips-hero-actions > a svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.trips-hero-actions > button {
  min-height: 42px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 9px;
  font-weight: 780;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentcolor 38%, transparent);
  text-underline-offset: 4px;
}

.trips-hero-actions > button:hover {
  color: var(--hero-text);
}

.trips-hero-actions > button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.logout-error {
  margin: -34px 0 30px;
  color: color-mix(in srgb, #9b4d46 82%, var(--hero-text));
  font-size: 10px;
  font-weight: 750;
  text-align: right;
}

.saved-section > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  padding: 0 3px;
}

.saved-section h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: 18px;
  letter-spacing: -0.035em;
}

.saved-section > header span {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.trips-error {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  margin: 0 0 12px;
  padding: 10px 12px;
  border-left: 2px solid color-mix(in srgb, #9b4d46 65%, transparent);
  background: color-mix(in srgb, #9b4d46 7%, transparent);
  color: color-mix(in srgb, #9b4d46 82%, var(--hero-text));
  font-size: 10px;
  font-weight: 750;
}

.trips-error button {
  flex: 0 0 auto;
  padding: 3px 0;
  border: 0;
  border-bottom: 1px solid currentcolor;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 9px;
  font-weight: 850;
}

.selected-trip-section {
  margin-top: clamp(50px, 8svh, 78px);
}

.missing-itinerary {
  padding: 34px 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  text-align: center;
}

.missing-itinerary strong {
  color: var(--hero-text);
  font-size: 14px;
}

.missing-itinerary p {
  margin: 4px 0 13px;
  color: var(--hero-muted);
  font-size: 11px;
}

.missing-itinerary a {
  color: var(--hero-text);
  font-size: 10px;
  font-weight: 830;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 560px) {
  .trips-shell {
    width: min(100% - 28px, 940px);
    padding-top: 42px;
  }

  .trips-hero {
    align-items: start;
    flex-direction: column;
  }

  .trips-hero-actions {
    width: 100%;
  }

  .trips-hero-actions > a {
    flex: 1;
    justify-content: center;
  }

  .logout-error {
    margin-top: -22px;
    text-align: left;
  }
}
</style>
