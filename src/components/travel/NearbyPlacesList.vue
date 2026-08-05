<script setup>
import { computed } from 'vue'

const props = defineProps({
  places: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedCount = computed(() => props.modelValue.length)

const togglePlace = (placeId) => {
  const next = props.modelValue.includes(placeId) ? props.modelValue.filter((id) => id !== placeId) : [...props.modelValue, placeId]
  emit('update:modelValue', next)
}

const formatDistance = (distance) => {
  if (!Number.isFinite(Number(distance))) return ''
  const meters = Number(distance)
  return meters >= 1000 ? `${Math.round((meters / 1000) * 10) / 10}km` : `${Math.round(meters)}m`
}
</script>

<template>
  <section class="places-section" aria-labelledby="nearby-places-title" :aria-busy="isLoading">
    <header>
      <div>
        <span>PLACES</span>
        <h2 id="nearby-places-title">일정에 담을 장소</h2>
      </div>
      <p v-if="places.length">{{ selectedCount }}곳 선택</p>
    </header>

    <div v-if="isLoading" class="places-loading" aria-live="polite">
      <span aria-hidden="true"></span>
      주변 장소를 찾고 있습니다.
    </div>

    <ul v-else-if="places.length" class="places-list">
      <li v-for="place in places" :key="place.id">
        <label>
          <input type="checkbox" :checked="modelValue.includes(place.id)" @change="togglePlace(place.id)" />
          <span class="place-check" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m7 12 3.2 3.2L17.5 8" /></svg>
          </span>
          <span class="place-copy">
            <strong>{{ place.title }}</strong>
            <small v-if="place.description">{{ place.description }}</small>
          </span>
          <span v-if="formatDistance(place.distance)" class="place-distance">{{ formatDistance(place.distance) }}</span>
        </label>
      </li>
    </ul>

    <p v-else class="places-empty">주변 장소 정보가 없더라도 날씨 중심 일정은 만들 수 있습니다.</p>
  </section>
</template>

<style scoped>
.places-section {
  display: grid;
  gap: 12px;
}

.places-section > header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.places-section > header span {
  display: block;
  margin-bottom: 3px;
  color: var(--weather-accent);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.13em;
}

.places-section h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: 18px;
  letter-spacing: -0.035em;
}

.places-section > header p {
  margin: 0 2px 1px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 800;
}

.places-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  list-style: none;
}

.places-list li + li {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
}

.places-list label {
  display: grid;
  min-height: 62px;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 9px 3px;
  cursor: pointer;
  transition: background-color 180ms ease;
}

.places-list input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.place-check {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--hero-text) 24%, transparent);
  border-radius: 50%;
  color: transparent;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;
}

.place-check svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.places-list input:checked + .place-check {
  border-color: var(--hero-text);
  background: var(--hero-text);
  color: var(--hero-start);
}

.places-list input:focus-visible + .place-check {
  outline: 2px solid currentcolor;
  outline-offset: 2px;
}

.place-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.place-copy strong,
.place-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-copy strong {
  color: var(--hero-text);
  font-size: 13px;
}

.place-copy small,
.place-distance {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 700;
}

.place-distance {
  margin-left: 8px;
  font-variant-numeric: tabular-nums;
}

.places-loading,
.places-empty {
  min-height: 74px;
  margin: 0;
  padding: 23px 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 700;
}

.places-loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.places-loading > span {
  width: 15px;
  height: 15px;
  border: 2px solid color-mix(in srgb, var(--hero-muted) 22%, transparent);
  border-top-color: var(--weather-accent);
  border-radius: 50%;
  animation: places-spin 720ms linear infinite;
}

@keyframes places-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (hover: hover) and (pointer: fine) {
  .places-list label:hover {
    background: color-mix(in srgb, var(--hero-text) 4%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .places-loading > span {
    animation: none;
  }

  .places-list label,
  .place-check {
    transition: none;
  }
}
</style>
