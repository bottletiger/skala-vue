<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useConfigStore } from '@/stores/configStore'
import { formatForecastDateParts, getForecastVisual } from '@/utils/forecastPresentation'
import { convertTemperature } from '@/utils/temperature'

const props = defineProps({
  destination: {
    type: Object,
    default: null,
  },
  forecast: {
    type: Object,
    default: null,
  },
  airQuality: {
    type: Object,
    default: null,
  },
  climate: {
    type: Object,
    default: null,
  },
  climateDates: {
    type: Array,
    default: () => [],
  },
  startDate: {
    type: String,
    default: '',
  },
  endDate: {
    type: String,
    default: '',
  },
  showClimateReference: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isClimateLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  climateErrorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['retry'])

const configStore = useConfigStore()
const { unit, unitSymbol } = storeToRefs(configStore)

const displayDays = computed(() => {
  const timezoneOffset = props.forecast?.timezoneOffset ?? 0
  return (props.forecast?.daily ?? [])
    .filter((item) => {
      const date = item?.date ?? item?.localDate
      if (!date || !props.startDate || !props.endDate) return true
      return date >= props.startDate && date <= props.endDate
    })
    .slice(0, 14)
    .map((item, index) => ({
      ...item,
      ...formatForecastDateParts(item?.timestamp, timezoneOffset),
      ...getForecastVisual(item),
      key: `${item?.date ?? item?.timestamp ?? 'day'}-${index}`,
      minimum: convertTemperature(item?.minTemperature, unit.value),
      maximum: convertTemperature(item?.maxTemperature, unit.value),
    }))
})

const airQualityLabel = computed(() => {
  if (typeof props.airQuality?.category === 'string') return props.airQuality.category
  return props.airQuality?.category?.label ?? '정보 없음'
})

const airQualityValue = computed(() => props.airQuality?.usAqi ?? props.airQuality?.europeanAqi ?? null)
const airQualityName = computed(() => (props.airQuality?.usAqi !== null && props.airQuality?.usAqi !== undefined ? 'US AQI' : '유럽 AQI'))

const selectedMonthNumbers = computed(() => {
  if (props.climateDates.length) {
    return [...new Set(props.climateDates.map((date) => Number(String(date).slice(5, 7))).filter(Number.isFinite))]
  }

  const start = Date.parse(`${props.startDate}T00:00:00Z`)
  const end = Date.parse(`${props.endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return []

  const months = new Set()
  for (let timestamp = start; timestamp <= end && months.size < 12; timestamp += 86_400_000) {
    months.add(new Date(timestamp).getUTCMonth() + 1)
  }
  return [...months]
})

const climateDateLabel = computed(() => {
  const labels = props.climateDates
    .map(String)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .map((date) => {
      const [, month, day] = date.split('-')
      return `${Number(month)}월 ${Number(day)}일`
    })

  if (labels.length <= 3) return labels.join(', ')
  return `${labels.slice(0, 2).join(', ')} 외 ${labels.length - 2}일`
})

const climateMonths = computed(() => {
  if (!props.showClimateReference || !Array.isArray(props.climate?.months)) return []
  return props.climate.months.filter((month) => selectedMonthNumbers.value.includes(month.month))
})

const climateUnit = (key, fallback) => {
  const unitValue = props.climate?.units?.[key]
  if (!unitValue) return fallback
  if (unitValue === 'C') return '℃'
  return unitValue
}

const climateMetric = (value, unitKey, fallbackUnit) => {
  if (!Number.isFinite(value)) return '정보 없음'
  return `${Math.round(value * 10) / 10}${climateUnit(unitKey, fallbackUnit)}`
}
</script>

<template>
  <section class="weather-summary" aria-labelledby="travel-weather-title" :aria-busy="isLoading">
    <header>
      <div>
        <span>FORECAST</span>
        <h2 id="travel-weather-title">{{ destination?.name || '여행지' }} 날씨</h2>
      </div>
      <p v-if="airQuality">
        {{ airQualityLabel }}
        <strong v-if="airQualityValue !== null">{{ airQualityName }} {{ airQualityValue }}</strong>
      </p>
    </header>

    <div v-if="isLoading" class="weather-state" aria-live="polite">
      <span aria-hidden="true"></span>
      여행 기간의 날씨를 확인하고 있습니다.
    </div>

    <div v-else-if="errorMessage" class="weather-state is-error" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" aria-label="여행지 예보 다시 불러오기" @click="emit('retry')">예보 다시 불러오기</button>
    </div>

    <ol v-else-if="displayDays.length" class="forecast-days">
      <li v-for="day in displayDays" :key="day.key">
        <div class="day-copy">
          <strong>{{ day.weekday }}</strong>
          <time v-if="day.dateTime" :datetime="day.dateTime">{{ day.dateLabel }}</time>
        </div>
        <WeatherConditionIcon class="day-icon" :category="day.category" :is-night="day.isNight" />
        <span class="condition-label">{{ day.conditionLabel }}</span>
        <span class="rain-chance">{{ day.precipitation === null || day.precipitation === undefined ? '강수 —' : `강수 ${day.precipitation}%` }}</span>
        <span class="temperature-range">
          <small>{{ day.minimum ?? '—' }}{{ day.minimum === null ? '' : unitSymbol }}</small>
          <i aria-hidden="true"></i>
          <strong>{{ day.maximum ?? '—' }}{{ day.maximum === null ? '' : unitSymbol }}</strong>
        </span>
      </li>
    </ol>

    <p v-else class="weather-state">
      {{ showClimateReference ? '선택한 미래 날짜에 제공되는 단기 예보가 없습니다.' : '표시할 예보가 없습니다.' }}
    </p>

    <section v-if="showClimateReference" class="climate-reference" aria-labelledby="climate-reference-title" :aria-busy="isClimateLoading">
      <header>
        <div>
          <span>CLIMATE REFERENCE</span>
          <h3 id="climate-reference-title">과거 기후 참고 · 예보 아님</h3>
        </div>
        <p>{{ climate?.period?.label ? `${climate.period.label} 기준` : '과거 관측 기준' }}</p>
      </header>

      <p v-if="climateDateLabel" class="climate-boundary">예보가 없는 {{ climateDateLabel }}에만 과거 기후 참고를 사용합니다.</p>

      <div v-if="isClimateLoading" class="climate-state" aria-live="polite">
        <span aria-hidden="true"></span>
        선택한 달의 과거 기후를 확인하고 있습니다.
      </div>

      <p v-else-if="climateErrorMessage || !climateMonths.length" class="climate-state is-error">{{ climateErrorMessage || '표시할 기후 참고가 없습니다.' }}</p>

      <ul v-else>
        <li v-for="month in climateMonths" :key="month.key || month.month">
          <strong>{{ month.label || `${month.month}월` }}</strong>
          <dl>
            <div>
              <dt>평균 기온</dt>
              <dd>{{ climateMetric(month.temperature, 'temperature', '℃') }}</dd>
            </div>
            <div>
              <dt>기간 최고 / 최저</dt>
              <dd>{{ climateMetric(month.maxTemperature, 'maxTemperature', '℃') }} / {{ climateMetric(month.minTemperature, 'minTemperature', '℃') }}</dd>
            </div>
            <div>
              <dt>강수</dt>
              <dd>{{ climateMetric(month.precipitation, 'precipitation', 'mm/day') }}</dd>
            </div>
            <div>
              <dt>습도</dt>
              <dd>{{ climateMetric(month.humidity, 'humidity', '%') }}</dd>
            </div>
          </dl>
        </li>
      </ul>

      <a v-if="climate?.sourceUrl" :href="climate.sourceUrl" target="_blank" rel="noopener noreferrer">자료: {{ climate.source || '기후 자료' }}</a>
    </section>

    <dl v-if="airQuality" class="air-metrics">
      <div>
        <dt>미세먼지</dt>
        <dd>{{ Number.isFinite(airQuality.pm10) ? `${airQuality.pm10} ㎍/㎥` : '정보 없음' }}</dd>
      </div>
      <div>
        <dt>초미세먼지</dt>
        <dd>{{ Number.isFinite(airQuality.pm2_5) ? `${airQuality.pm2_5} ㎍/㎥` : '정보 없음' }}</dd>
      </div>
      <div>
        <dt>자외선</dt>
        <dd>{{ Number.isFinite(airQuality.uvIndex) ? airQuality.uvIndex : '정보 없음' }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.weather-summary {
  display: grid;
  gap: 12px;
}

.weather-summary > header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.weather-summary > header span {
  display: block;
  margin-bottom: 3px;
  color: var(--weather-accent);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.13em;
}

.weather-summary h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: 18px;
  letter-spacing: -0.035em;
}

.weather-summary > header p {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin: 0 2px 1px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 750;
}

.weather-summary > header p strong {
  color: var(--hero-text);
  font-size: 11px;
}

.forecast-days {
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  list-style: none;
}

.forecast-days li {
  display: grid;
  min-height: 64px;
  grid-template-columns: minmax(70px, 0.7fr) 36px minmax(110px, 1.4fr) minmax(65px, 0.6fr) minmax(110px, 0.8fr);
  align-items: center;
  gap: 12px;
  padding: 9px 3px;
}

.forecast-days li + li {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
}

.day-copy {
  display: grid;
  gap: 1px;
}

.day-copy strong {
  color: var(--hero-text);
  font-size: 12px;
}

.day-copy time,
.condition-label,
.rain-chance {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 700;
}

.day-icon {
  width: 34px;
  height: 34px;
  color: var(--weather-accent);
}

.condition-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temperature-range {
  display: grid;
  grid-template-columns: auto minmax(15px, 1fr) auto;
  align-items: center;
  gap: 7px;
  color: var(--hero-text);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.temperature-range small {
  color: var(--hero-muted);
  font-size: inherit;
  font-weight: 700;
}

.temperature-range i {
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--weather-accent) 28%, white), var(--weather-accent));
}

.air-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
}

.climate-reference {
  display: grid;
  gap: 11px;
  margin-top: 3px;
  padding: 17px 0 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
}

.climate-reference > header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.climate-reference > header span {
  display: block;
  margin-bottom: 2px;
  color: var(--weather-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.12em;
}

.climate-reference h3 {
  margin: 0;
  color: var(--hero-text);
  font-size: 14px;
}

.climate-reference > header p {
  margin: 0;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 750;
}

.climate-boundary {
  margin: 0;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 720;
  line-height: 1.5;
}

.climate-reference > ul {
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  list-style: none;
}

.climate-state {
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 9px;
  margin: 0;
  padding: 14px 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 730;
}

.climate-state > span {
  width: 13px;
  height: 13px;
  border: 2px solid color-mix(in srgb, var(--hero-muted) 22%, transparent);
  border-top-color: var(--weather-accent);
  border-radius: 50%;
  animation: travel-weather-spin 720ms linear infinite;
}

.climate-state.is-error {
  color: color-mix(in srgb, #9b4d46 74%, var(--hero-text));
}

.climate-reference > ul > li {
  display: grid;
  min-height: 63px;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 9px 3px;
}

.climate-reference > ul > li + li {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
}

.climate-reference li > strong {
  color: var(--hero-text);
  font-size: 12px;
}

.climate-reference dl {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
}

.climate-reference dl > div {
  min-width: 0;
  padding: 0 10px;
}

.climate-reference dl > div:first-child {
  padding-left: 0;
}

.climate-reference dl > div + div {
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 9%, transparent);
}

.climate-reference dt,
.climate-reference dd {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.climate-reference dt {
  color: var(--hero-muted);
  font-size: 8px;
  font-weight: 730;
}

.climate-reference dd {
  margin: 2px 0 0;
  color: var(--hero-text);
  font-size: 9px;
  font-weight: 810;
}

.climate-reference > a {
  justify-self: end;
  color: var(--hero-muted);
  font-size: 8px;
  font-weight: 750;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.air-metrics > div {
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 12px;
}

.air-metrics > div:first-child {
  padding-left: 3px;
}

.air-metrics > div + div {
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.air-metrics dt,
.air-metrics dd {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.air-metrics dt {
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 750;
}

.air-metrics dd {
  margin: 0;
  color: var(--hero-text);
  font-size: 10px;
  font-weight: 820;
}

.weather-state {
  display: flex;
  min-height: 84px;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 24px 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 700;
}

.weather-state > span {
  width: 15px;
  height: 15px;
  border: 2px solid color-mix(in srgb, var(--hero-muted) 22%, transparent);
  border-top-color: var(--weather-accent);
  border-radius: 50%;
  animation: travel-weather-spin 720ms linear infinite;
}

.weather-state.is-error {
  justify-content: space-between;
  flex-wrap: wrap;
  color: color-mix(in srgb, #a34f48 82%, var(--hero-text));
}

.weather-state.is-error p {
  flex: 1 1 240px;
  margin: 0;
  line-height: 1.55;
}

.weather-state.is-error button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, currentcolor 28%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, white 7%, transparent);
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 9px;
  font-weight: 820;
}

@keyframes travel-weather-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 650px) {
  .forecast-days li {
    grid-template-areas:
      'day icon condition temperature'
      'day icon rain temperature';
    grid-template-columns: 58px 34px minmax(0, 1fr) 102px;
    gap: 0 9px;
  }

  .day-copy {
    grid-area: day;
  }

  .day-icon {
    grid-area: icon;
  }

  .condition-label {
    grid-area: condition;
    align-self: end;
  }

  .rain-chance {
    grid-area: rain;
    align-self: start;
  }

  .temperature-range {
    grid-area: temperature;
  }

  .air-metrics {
    grid-template-columns: 1fr;
  }

  .climate-reference dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 8px;
  }

  .climate-reference dl > div:nth-child(odd) {
    padding-left: 0;
    border-left: 0;
  }

  .air-metrics > div,
  .air-metrics > div:first-child {
    padding: 8px 3px;
  }

  .air-metrics > div + div {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
    border-left: 0;
  }
}

@media (max-width: 420px) {
  .weather-summary > header {
    align-items: start;
    flex-direction: column;
    gap: 6px;
  }

  .forecast-days li {
    grid-template-columns: 52px 32px minmax(0, 1fr) 94px;
    column-gap: 6px;
  }

  .climate-reference > header {
    align-items: start;
    flex-direction: column;
    gap: 4px;
  }

  .climate-reference > ul > li {
    grid-template-columns: 1fr;
    gap: 7px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-state > span {
    animation: none;
  }
}
</style>
