<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useConfigStore } from '@/stores/configStore'
import { convertTemperature } from '@/utils/temperature'
import { getWeatherTheme } from '@/utils/weatherTheme'

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

const toOffsetDate = (timestamp, timezoneOffset) => {
  if (!Number.isFinite(timestamp) || !Number.isFinite(timezoneOffset)) return null
  const date = new Date((timestamp + timezoneOffset) * 1000)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateParts = (timestamp, timezoneOffset) => {
  const date = toOffsetDate(timestamp, timezoneOffset)
  if (!date) return { weekday: '날짜 없음', dateLabel: '', dateTime: undefined }

  return {
    weekday: new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(date),
    dateLabel: new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', timeZone: 'UTC' }).format(date),
    dateTime: date.toISOString().slice(0, 10),
  }
}

const displayItems = computed(() => {
  return props.items.map((item, index) => {
    const theme = getWeatherTheme({
      condition: item?.weatherMain,
      conditionId: item?.weatherId,
      iconCode: item?.icon,
    })
    const date = formatDateParts(item?.timestamp, props.timezoneOffset)
    const minimum = convertTemperature(item?.minTemperature, unit.value)
    const maximum = convertTemperature(item?.maxTemperature, unit.value)
    const precipitation = Number.isFinite(item?.precipitationProbability) ? item.precipitationProbability : null

    return {
      ...item,
      ...date,
      key: `${item?.date ?? item?.timestamp ?? 'missing'}-${index}`,
      category: theme.category,
      isNight: theme.isNight,
      conditionLabel: item?.weatherDescription || theme.label || '날씨 정보 없음',
      minimum,
      maximum,
      precipitation,
    }
  })
})
</script>

<template>
  <section class="daily-forecast" aria-labelledby="daily-forecast-title">
    <header class="forecast-heading">
      <div>
        <p>이번 주 흐름</p>
        <h3 id="daily-forecast-title">5일 예보</h3>
      </div>
      <span>3시간별 예상 최저 / 최고</span>
    </header>

    <div class="daily-panel">
      <ol class="daily-list">
        <li v-for="item in displayItems" :key="item.key" class="daily-item">
          <div class="day-label">
            <strong>{{ item.weekday }}</strong>
            <time v-if="item.dateTime" :datetime="item.dateTime">{{ item.dateLabel }}</time>
          </div>

          <WeatherConditionIcon class="forecast-icon" :category="item.category" :is-night="item.isNight" />
          <span class="condition-text">{{ item.conditionLabel }}</span>

          <span class="precipitation" :aria-label="`강수확률 ${item.precipitation === null ? '정보 없음' : `${item.precipitation}%`}`">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3S6.5 9.2 6.5 14a5.5 5.5 0 0 0 11 0C17.5 9.2 12 3 12 3Z" /></svg>
            {{ item.precipitation === null ? '—' : `${item.precipitation}%` }}
          </span>

          <div class="temperature-range">
            <span :class="{ missing: item.minimum === null }">
              <span class="sr-only">최저 기온 {{ item.minimum === null ? '정보 없음' : `${item.minimum}${unitSymbol}` }}</span>
              <span aria-hidden="true"
                >{{ item.minimum ?? '—' }}<small v-if="item.minimum !== null">{{ unitSymbol }}</small></span
              >
            </span>
            <i aria-hidden="true"></i>
            <strong :class="{ missing: item.maximum === null }">
              <span class="sr-only">최고 기온 {{ item.maximum === null ? '정보 없음' : `${item.maximum}${unitSymbol}` }}</span>
              <span aria-hidden="true"
                >{{ item.maximum ?? '—' }}<small v-if="item.maximum !== null">{{ unitSymbol }}</small></span
              >
            </strong>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.daily-forecast {
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

.daily-panel {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  backdrop-filter: blur(14px) saturate(108%);
}

.daily-list {
  margin: 0;
  padding: 0 22px;
  list-style: none;
}

.daily-item {
  display: grid;
  min-height: 78px;
  grid-template-columns: minmax(82px, 0.7fr) 46px minmax(150px, 1.5fr) minmax(74px, 0.6fr) minmax(142px, 0.8fr);
  align-items: center;
  gap: 18px;
  padding: 13px 2px;
}

.daily-item + .daily-item {
  border-top: 1px solid rgba(255, 255, 255, 0.19);
}

.day-label {
  display: grid;
  gap: 2px;
}

.day-label strong {
  font-size: 15px;
}

.day-label time,
.condition-text,
.precipitation {
  color: var(--hero-muted);
}

.day-label time {
  font-size: 11px;
  font-weight: 700;
}

.forecast-icon {
  width: 42px;
  height: 42px;
  color: var(--weather-accent);
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.condition-text {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.precipitation {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 5px;
  font-size: 12px;
  font-weight: 750;
}

.precipitation svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentcolor;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.temperature-range {
  display: grid;
  grid-template-columns: minmax(42px, auto) minmax(24px, 1fr) minmax(42px, auto);
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.temperature-range > span:not(.sr-only) {
  color: var(--hero-muted);
}

.temperature-range i {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--weather-accent) 34%, white), var(--weather-accent));
}

.temperature-range small {
  margin-left: 2px;
  font-size: 10px;
  font-weight: 750;
}

.temperature-range .missing {
  color: var(--hero-muted);
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .daily-item:hover .forecast-icon {
    transform: translateY(-3px) scale(1.06);
  }
}

@media (max-width: 700px) {
  .daily-list {
    padding-inline: 16px;
  }

  .daily-item {
    grid-template-areas:
      'day icon condition temperature'
      'day icon precipitation temperature';
    grid-template-columns: 62px 40px minmax(0, 1fr) minmax(112px, auto);
    gap: 2px 10px;
  }

  .day-label {
    grid-area: day;
  }

  .forecast-icon {
    grid-area: icon;
  }

  .condition-text {
    grid-area: condition;
    align-self: end;
  }

  .precipitation {
    grid-area: precipitation;
    align-self: start;
    font-size: 10px;
  }

  .temperature-range {
    grid-area: temperature;
  }
}

@media (max-width: 560px) {
  .forecast-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .daily-panel {
    border-radius: 22px;
  }

  .daily-list {
    padding-inline: 13px;
  }

  .daily-item {
    min-height: 72px;
    grid-template-columns: 54px 36px minmax(0, 1fr) minmax(100px, auto);
    column-gap: 8px;
  }

  .forecast-icon {
    width: 36px;
    height: 36px;
  }

  .condition-text {
    font-size: 12px;
  }

  .temperature-range {
    grid-template-columns: auto 20px auto;
    gap: 5px;
    font-size: 13px;
  }
}

@media (max-width: 390px) {
  .daily-item {
    grid-template-columns: 48px 32px minmax(0, 1fr) minmax(88px, auto);
    column-gap: 6px;
  }

  .day-label strong {
    font-size: 13px;
  }

  .day-label time {
    font-size: 10px;
  }

  .forecast-icon {
    width: 32px;
    height: 32px;
  }

  .temperature-range {
    grid-template-columns: auto 14px auto;
    gap: 3px;
    font-size: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .forecast-icon {
    transition: none;
  }

  .daily-item:hover .forecast-icon {
    transform: none;
  }
}
</style>
