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
          <span class="detail-copy"><strong>습도</strong><small>공기 중 수증기 비율</small></span>
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
          <span class="detail-copy"><strong>풍속</strong><small>지상 바람 속도</small></span>
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
          <span class="detail-copy"><strong>기압</strong><small>현재 대기압</small></span>
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
          <span class="detail-copy"><strong>시정거리</strong><small>육안으로 볼 수 있는 거리</small></span>
        </dt>
        <dd class="detail-value" :class="{ missing: visibilityKm === null }">
          <strong>{{ visibilityKm ?? '정보 없음' }}</strong
          ><small v-if="visibilityKm !== null">km</small>
        </dd>
      </div>

      <div class="detail-row detail-row--solar">
        <dt class="detail-label">
          <span class="detail-icon" aria-hidden="true"
            ><svg viewBox="0 0 24 24"><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 3v3M4.9 6.9 7 9M19.1 6.9 17 9" /></svg
          ></span>
          <span class="detail-copy"><strong>일출 · 일몰</strong><small>도시 현지 시각</small></span>
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
  width: min(980px, 100%);
  margin: 18px auto 0;
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
  .detail-row:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .detail-row:hover .detail-icon {
    transform: translateY(-2px) scale(1.05);
  }
}

@media (max-width: 560px) {
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
  .detail-row,
  .detail-icon {
    transition: none;
  }

  .detail-row:hover .detail-icon {
    transform: none;
  }
}
</style>
