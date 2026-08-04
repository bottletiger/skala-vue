<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useConfigStore } from '@/stores/configStore'
import { convertTemperature } from '@/utils/temperature'
import { formatWeatherTime, getWeatherTheme } from '@/utils/weatherTheme'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  timezoneOffset: {
    type: Number,
    default: 0,
  },
})

const configStore = useConfigStore()
const { unit, unitSymbol } = storeToRefs(configStore)

const toDate = (timestamp, timezoneOffset) => {
  if (!Number.isFinite(timestamp) || !Number.isFinite(timezoneOffset)) return null
  const date = new Date((timestamp + timezoneOffset) * 1000)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatForecastDay = (timestamp, timezoneOffset) => {
  const date = toDate(timestamp, timezoneOffset)
  if (!date) return '날짜 정보 없음'

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(date)
}

const toIsoDateTime = (timestamp) => {
  if (!Number.isFinite(timestamp)) return undefined
  const date = new Date(timestamp * 1000)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const displayItems = computed(() => {
  return props.items.map((item, index) => {
    const theme = getWeatherTheme({
      condition: item?.weatherMain,
      conditionId: item?.weatherId,
      iconCode: item?.icon,
    })
    const temperature = convertTemperature(item?.temperature, unit.value)
    const precipitation = Number.isFinite(item?.precipitationProbability) ? item.precipitationProbability : null

    return {
      ...item,
      key: `${item?.timestamp ?? 'missing'}-${index}`,
      category: theme.category,
      isNight: theme.isNight,
      conditionLabel: item?.weatherDescription || theme.label || '날씨 정보 없음',
      dateLabel: formatForecastDay(item?.timestamp, props.timezoneOffset),
      timeLabel: formatWeatherTime(item?.timestamp, props.timezoneOffset),
      dateTime: toIsoDateTime(item?.timestamp),
      temperature,
      precipitation,
    }
  })
})
</script>

<template>
  <section class="hourly-forecast" aria-labelledby="hourly-forecast-title">
    <header class="forecast-heading">
      <div>
        <p>앞으로 약 24시간</p>
        <h3 id="hourly-forecast-title">시간대별 날씨</h3>
      </div>
      <span>3시간 간격 · 현지 시각</span>
    </header>

    <div class="hourly-panel">
      <div class="hourly-scroll" role="region" aria-label="시간대별 예보 가로 목록" tabindex="0">
        <ol class="hourly-list">
          <li v-for="item in displayItems" :key="item.key" class="hourly-item">
            <span class="forecast-date">{{ item.dateLabel }}</span>
            <time v-if="item.dateTime" :datetime="item.dateTime">{{ item.timeLabel }}</time>
            <span v-else class="forecast-time">{{ item.timeLabel }}</span>

            <WeatherConditionIcon class="forecast-icon" :category="item.category" :is-night="item.isNight" />
            <span class="condition-text">{{ item.conditionLabel }}</span>

            <strong v-if="item.temperature !== null" class="forecast-temperature"
              >{{ item.temperature }}<small>{{ unitSymbol }}</small></strong
            >
            <strong v-else class="forecast-temperature missing">정보 없음</strong>

            <span class="precipitation" :aria-label="`강수확률 ${item.precipitation === null ? '정보 없음' : `${item.precipitation}%`}`">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3S6.5 9.2 6.5 14a5.5 5.5 0 0 0 11 0C17.5 9.2 12 3 12 3Z" /></svg>
              {{ item.precipitation === null ? '—' : `${item.precipitation}%` }}
            </span>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hourly-forecast {
  min-width: 0;
}

.forecast-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
  padding: 0 4px;
}

.forecast-heading p,
.forecast-heading h3 {
  margin: 0;
}

.forecast-heading p {
  margin-bottom: 3px;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
}

.forecast-heading h3 {
  font-size: 18px;
}

.forecast-heading > span {
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 700;
}

.hourly-panel {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  backdrop-filter: blur(14px) saturate(108%);
}

.hourly-scroll {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-color: color-mix(in srgb, var(--hero-muted) 26%, transparent) transparent;
  scrollbar-width: thin;
}

.hourly-scroll:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: -3px;
  border-radius: 24px;
}

.hourly-list {
  display: grid;
  grid-auto-columns: minmax(116px, 1fr);
  grid-auto-flow: column;
  min-width: max-content;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hourly-item {
  position: relative;
  display: grid;
  min-width: 116px;
  min-height: 226px;
  align-content: start;
  justify-items: center;
  padding: 18px 16px 16px;
  text-align: center;
}

.hourly-item + .hourly-item::before {
  position: absolute;
  top: 18px;
  bottom: 18px;
  left: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.19);
  content: '';
}

.forecast-date,
.condition-text,
.precipitation {
  color: var(--hero-muted);
}

.forecast-date {
  font-size: 10px;
  font-weight: 700;
}

.hourly-item time,
.forecast-time {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 800;
}

.forecast-icon {
  width: 48px;
  height: 48px;
  margin: 13px 0 5px;
  color: var(--weather-accent);
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.condition-text {
  width: 100%;
  overflow: hidden;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.forecast-temperature {
  margin-top: 10px;
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.forecast-temperature small {
  margin-left: 2px;
  color: var(--hero-muted);
  font-size: 11px;
}

.forecast-temperature.missing {
  color: var(--hero-muted);
  font-size: 12px;
  letter-spacing: 0;
}

.precipitation {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 750;
}

.precipitation svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentcolor;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .hourly-item:hover .forecast-icon {
    transform: translateY(-4px) scale(1.06);
  }
}

@media (max-width: 560px) {
  .forecast-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .hourly-item {
    min-height: 216px;
    padding-inline: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .forecast-icon {
    transition: none;
  }

  .hourly-item:hover .forecast-icon {
    transform: none;
  }
}
</style>
