<script setup>
import { computed } from 'vue'

import { useTemperature } from '@/composables/useTemperature'
import { toFiniteMetric } from '@/utils/metrics'
import { formatWeatherTime } from '@/utils/weatherTheme'

const props = defineProps({
  weather: {
    type: Object,
    required: true,
  },
})

const { displayTemp: displayFeelsLike, unitSymbol } = useTemperature(() => props.weather?.feelsLike)
const feelsLikeTemperature = computed(() => (toFiniteMetric(props.weather?.feelsLike) === null ? null : displayFeelsLike.value))
const humidity = computed(() => toFiniteMetric(props.weather?.humidity))
const pressure = computed(() => toFiniteMetric(props.weather?.pressure))
const windSpeed = computed(() => toFiniteMetric(props.weather?.wind))
const visibilityKm = computed(() => {
  const visibilityMeters = toFiniteMetric(props.weather?.visibility)
  return visibilityMeters === null ? null : Math.round((visibilityMeters / 1000) * 10) / 10
})
const sunriseTime = computed(() => formatWeatherTime(props.weather?.sunrise, props.weather?.timezoneOffset))
const sunsetTime = computed(() => formatWeatherTime(props.weather?.sunset, props.weather?.timezoneOffset))
</script>

<template>
  <section class="details-section" aria-labelledby="details-list-title">
    <div class="details-heading">
      <h2 id="details-list-title">상세 정보</h2>
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
          <strong>체감 온도</strong>
        </dt>
        <dd class="detail-value" :class="{ missing: feelsLikeTemperature === null }">
          <strong>{{ feelsLikeTemperature ?? '정보 없음' }}</strong
          ><small v-if="feelsLikeTemperature !== null">{{ unitSymbol }}</small>
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
          <strong>습도</strong>
        </dt>
        <dd class="detail-value" :class="{ missing: humidity === null }">
          <strong>{{ humidity ?? '정보 없음' }}</strong
          ><small v-if="humidity !== null">%</small>
        </dd>
      </div>

      <div class="detail-row">
        <dt class="detail-label">
          <span class="detail-icon" aria-hidden="true"
            ><svg viewBox="0 0 24 24"><path d="M3 8h11a2.5 2.5 0 1 0-2.3-3.5M3 12h16a2 2 0 1 1-1.8 2.8M3 16h8" /></svg
          ></span>
          <strong>풍속</strong>
        </dt>
        <dd class="detail-value" :class="{ missing: windSpeed === null }">
          <strong>{{ windSpeed ?? '정보 없음' }}</strong
          ><small v-if="windSpeed !== null">m/s</small>
        </dd>
      </div>

      <div class="detail-row">
        <dt class="detail-label">
          <span class="detail-icon" aria-hidden="true"
            ><svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
              <path d="m12 12 3.5-3.5M8 17h8" /></svg
          ></span>
          <strong>기압</strong>
        </dt>
        <dd class="detail-value" :class="{ missing: pressure === null }">
          <strong>{{ pressure ?? '정보 없음' }}</strong
          ><small v-if="pressure !== null">hPa</small>
        </dd>
      </div>

      <div class="detail-row">
        <dt class="detail-label">
          <span class="detail-icon" aria-hidden="true"
            ><svg viewBox="0 0 24 24">
              <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
              <circle cx="12" cy="12" r="2.5" /></svg
          ></span>
          <strong>시정거리</strong>
        </dt>
        <dd class="detail-value" :class="{ missing: visibilityKm === null }">
          <strong>{{ visibilityKm ?? '정보 없음' }}</strong
          ><small v-if="visibilityKm !== null">km</small>
        </dd>
      </div>

      <div class="detail-row">
        <dt class="detail-label">
          <span class="detail-icon" aria-hidden="true"
            ><svg viewBox="0 0 24 24"><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 3v3M4.9 6.9 7 9M19.1 6.9 17 9" /></svg
          ></span>
          <strong>일출 · 일몰</strong>
        </dt>
        <dd class="detail-value detail-value--pair">
          <span
            ><small>일출</small><strong>{{ sunriseTime }}</strong></span
          ><i aria-hidden="true"></i
          ><span
            ><small>일몰</small><strong>{{ sunsetTime }}</strong></span
          >
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.details-section {
  margin: 28px auto 0;
}

.details-heading {
  margin-bottom: 12px;
  padding: 0 4px;
}

.details-heading h2 {
  margin: 0;
  font-size: 18px;
}

.details-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(190px, 1.45fr);
  margin: 0;
  padding: 0 4px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
}

.detail-row {
  display: grid;
  min-width: 0;
  min-height: 112px;
  align-content: center;
  gap: 10px;
  padding: 16px 14px;
  transition: background-color 180ms ease;
}

.detail-row + .detail-row {
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.detail-label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.detail-icon {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 auto;
  place-items: center;
  color: var(--weather-accent);
}

.detail-icon svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.75;
}

.detail-label > strong {
  min-width: 0;
  overflow: hidden;
  color: var(--hero-text);
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-value {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 5px;
  margin: 0;
  color: var(--hero-text);
  font-variant-numeric: tabular-nums;
  text-align: left;
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
  gap: 10px;
}

.detail-value--pair > span {
  display: flex;
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
  background: color-mix(in srgb, var(--hero-text) 18%, transparent);
}

@media (max-width: 840px) {
  .details-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .detail-row:nth-child(3n + 1) {
    border-left: 0;
  }

  .detail-row:nth-child(n + 4) {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .detail-row:hover {
    background: color-mix(in srgb, var(--hero-text) 5%, transparent);
  }
}

@media (max-width: 560px) {
  .details-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0;
  }

  .detail-row {
    min-height: 104px;
    gap: 8px;
    padding: 14px 10px;
  }

  .detail-row:nth-child(even) {
    border-left: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  }

  .detail-row:nth-child(odd) {
    border-left: 0;
  }

  .detail-row:nth-child(n + 3) {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  }

  .detail-label {
    gap: 6px;
  }

  .detail-icon {
    width: 23px;
    height: 23px;
  }

  .detail-icon svg {
    width: 20px;
    height: 20px;
  }

  .detail-label > strong {
    font-size: 12px;
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
  .detail-value--pair {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .detail-value--pair > i {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-row {
    transition: none;
  }
}
</style>
