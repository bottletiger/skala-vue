<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import ForecastListSection from '@/components/weather/ForecastListSection.vue'
import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useConfigStore } from '@/stores/configStore'
import { formatForecastDay, getForecastVisual, toIsoDateTime } from '@/utils/forecastPresentation'
import { convertTemperature } from '@/utils/temperature'
import { formatWeatherTime } from '@/utils/weatherTheme'

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

const displayItems = computed(() => {
  return props.items.map((item, index) => {
    const temperature = convertTemperature(item?.temperature, unit.value)

    return {
      ...item,
      ...getForecastVisual(item),
      key: `${item?.timestamp ?? 'missing'}-${index}`,
      dateLabel: formatForecastDay(item?.timestamp, props.timezoneOffset),
      timeLabel: formatWeatherTime(item?.timestamp, props.timezoneOffset),
      dateTime: toIsoDateTime(item?.timestamp),
      temperature,
    }
  })
})
</script>

<template>
  <ForecastListSection title-id="hourly-forecast-title" title="시간대별 날씨" summary="현지 시각 · 3시간 간격">
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
  </ForecastListSection>
</template>

<style scoped>
.hourly-scroll {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-color: color-mix(in srgb, var(--hero-muted) 26%, transparent) transparent;
  scrollbar-width: thin;
}

.hourly-scroll:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: -3px;
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
  background: color-mix(in srgb, var(--hero-text) 12%, transparent);
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

@media (max-width: 560px) {
  .hourly-item {
    min-height: 216px;
    padding-inline: 14px;
  }
}
</style>
