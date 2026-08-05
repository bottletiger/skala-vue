<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  trips: {
    type: Array,
    default: () => [],
  },
  selectedTripId: {
    type: [String, Number],
    default: null,
  },
  removingId: {
    type: [String, Number],
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select', 'remove'])
const pendingRemoveId = ref(null)

const getDestinationName = (trip) => trip?.destination?.name || trip?.destinationName || trip?.destination_name || trip?.title || '저장한 여행'
const getCountryName = (trip) => trip?.destination?.countryName || trip?.destination?.country_name || trip?.countryName || trip?.country_name || ''
const getStartDate = (trip) => trip?.startDate || trip?.start_date || ''
const getEndDate = (trip) => trip?.endDate || trip?.end_date || ''
const getSummary = (trip) => trip?.itinerary?.summary || trip?.generatedPlan?.summary || trip?.generated_plan?.summary || ''

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(date)
}

const formatDateRange = (trip) => {
  const start = formatDate(getStartDate(trip))
  const end = formatDate(getEndDate(trip))
  return start && end ? `${start} – ${end}` : start || end || '날짜 미정'
}

const askRemove = (tripId) => {
  pendingRemoveId.value = tripId
}

const cancelRemove = () => {
  pendingRemoveId.value = null
}

const confirmRemove = (tripId) => {
  emit('remove', tripId)
}

watch(
  () => props.trips,
  () => {
    if (!props.trips.some((trip) => trip.id === pendingRemoveId.value)) pendingRemoveId.value = null
  },
)
</script>

<template>
  <div class="saved-trips" :aria-busy="isLoading">
    <div v-if="isLoading" class="trips-state" aria-live="polite">
      <span aria-hidden="true"></span>
      저장한 여행을 불러오고 있습니다.
    </div>

    <ul v-else-if="trips.length" class="trip-list">
      <li v-for="trip in trips" :key="trip.id" :class="{ 'is-selected': selectedTripId === trip.id }">
        <div class="trip-row">
          <button class="trip-main" type="button" :aria-pressed="selectedTripId === trip.id" @click="emit('select', trip)">
            <span class="trip-date">{{ formatDateRange(trip) }}</span>
            <span class="trip-copy">
              <strong>{{ getDestinationName(trip) }}</strong>
              <small>{{ [getCountryName(trip), getSummary(trip)].filter(Boolean).join(' · ') || '저장한 일정 보기' }}</small>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
          <button class="remove-button" type="button" :disabled="removingId === trip.id" :aria-label="`${getDestinationName(trip)} 여행 삭제`" @click="askRemove(trip.id)">
            {{ removingId === trip.id ? '삭제 중' : '삭제' }}
          </button>
        </div>

        <div v-if="pendingRemoveId === trip.id" class="remove-confirmation" role="group" :aria-label="`${getDestinationName(trip)} 삭제 확인`">
          <p>이 여행을 목록에서 삭제할까요?</p>
          <div>
            <button type="button" @click="cancelRemove">취소</button>
            <button class="confirm-button" type="button" :disabled="removingId === trip.id" @click="confirmRemove(trip.id)">삭제</button>
          </div>
        </div>
      </li>
    </ul>

    <div v-else class="trips-empty">
      <strong>아직 저장한 여행이 없습니다.</strong>
      <p>여행지를 고르고 날씨에 맞는 일정을 만들어 보세요.</p>
    </div>
  </div>
</template>

<style scoped>
.trip-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  list-style: none;
}

.trip-list > li + li {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 11%, transparent);
}

.trip-list > li.is-selected {
  background: color-mix(in srgb, var(--hero-text) 4%, transparent);
}

.trip-row {
  display: grid;
  min-height: 72px;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 0 3px;
}

.trip-main {
  display: grid;
  min-width: 0;
  min-height: 72px;
  grid-template-columns: minmax(88px, 0.46fr) minmax(0, 1fr) 18px;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--hero-text);
  cursor: pointer;
  text-align: left;
}

.trip-date {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.trip-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.trip-copy strong,
.trip-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-copy strong {
  font-size: 14px;
}

.trip-copy small {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 700;
}

.trip-main svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--hero-muted);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.remove-button {
  min-width: 48px;
  padding: 7px 5px;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, #9b4d46 74%, var(--hero-text));
  cursor: pointer;
  font-size: 10px;
  font-weight: 800;
}

.remove-button:disabled {
  cursor: wait;
  opacity: 0.5;
}

.remove-confirmation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0 3px 12px;
  padding: 10px 12px;
  border-left: 2px solid color-mix(in srgb, #9b4d46 65%, transparent);
  background: color-mix(in srgb, #9b4d46 7%, transparent);
}

.remove-confirmation p {
  margin: 0;
  color: var(--hero-text);
  font-size: 10px;
  font-weight: 750;
}

.remove-confirmation > div {
  display: flex;
  gap: 6px;
}

.remove-confirmation button {
  min-height: 30px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-radius: 7px;
  background: transparent;
  color: var(--hero-text);
  cursor: pointer;
  font-size: 9px;
  font-weight: 800;
}

.remove-confirmation .confirm-button {
  border-color: color-mix(in srgb, #9b4d46 72%, transparent);
  background: color-mix(in srgb, #9b4d46 82%, var(--hero-text));
  color: white;
}

.trips-state,
.trips-empty {
  min-height: 150px;
  padding: 48px 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  color: var(--hero-muted);
  text-align: center;
}

.trips-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 700;
}

.trips-state > span {
  width: 15px;
  height: 15px;
  border: 2px solid color-mix(in srgb, var(--hero-muted) 22%, transparent);
  border-top-color: var(--weather-accent);
  border-radius: 50%;
  animation: trips-spin 720ms linear infinite;
}

.trips-empty strong {
  display: block;
  color: var(--hero-text);
  font-size: 14px;
}

.trips-empty p {
  margin: 4px 0 0;
  font-size: 11px;
}

@keyframes trips-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 560px) {
  .trip-main {
    grid-template-columns: minmax(0, 1fr) 16px;
    gap: 8px;
  }

  .trip-date {
    display: none;
  }

  .remove-confirmation {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .trips-state > span {
    animation: none;
  }
}
</style>
