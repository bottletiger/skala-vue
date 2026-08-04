<script setup>
import { computed } from 'vue'

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useTemperature } from '@/composables/useTemperature'
import { toFiniteMetric } from '@/utils/metrics'
import { formatWeatherDateTime } from '@/utils/weatherTheme'

const props = defineProps({
  weather: {
    type: Object,
    required: true,
  },
  theme: {
    type: Object,
    required: true,
  },
})

const { displayTemp, unitSymbol } = useTemperature(() => props.weather?.temp)
const currentTemperature = computed(() => (toFiniteMetric(props.weather?.temp) === null ? null : displayTemp.value))
const observedAt = computed(() => formatWeatherDateTime(props.weather?.observedAt, props.weather?.timezoneOffset))
</script>

<template>
  <div class="current-content">
    <div class="current-condition">
      <strong>{{ weather.status || theme.label || '날씨 설명 없음' }}</strong>
      <span>관측 {{ observedAt }}</span>
    </div>

    <div id="detail-weather-title" class="current-temperature" :class="{ missing: currentTemperature === null }" role="heading" aria-level="2">
      <span>{{ currentTemperature ?? '정보 없음' }}</span>
      <small v-if="currentTemperature !== null">{{ unitSymbol }}</small>
    </div>

    <div class="current-visual">
      <WeatherConditionIcon class="condition-icon" :category="theme.category" :is-night="theme.isNight" />
    </div>
  </div>
</template>

<style scoped>
.current-content {
  display: grid;
  min-height: 124px;
  grid-template-columns: minmax(0, 1fr) auto 74px;
  align-items: center;
  gap: clamp(12px, 2.5vw, 28px);
  padding: 22px 4px 24px;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
}

.current-condition {
  display: grid;
  min-width: 0;
  justify-items: start;
  gap: 7px;
}

.current-condition > strong {
  display: block;
  width: 100%;
  overflow: hidden;
  color: var(--hero-text);
  font-size: clamp(16px, 2.2vw, 22px);
  font-weight: 820;
  letter-spacing: -0.025em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-condition > span {
  color: color-mix(in srgb, var(--hero-muted) 82%, transparent);
  font-size: 11px;
  font-weight: 700;
}

.current-temperature {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  font-size: clamp(44px, 6.4vw, 64px);
  font-weight: 760;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.045em;
  line-height: 0.92;
  white-space: nowrap;
}

.current-temperature small {
  margin-top: 1px;
  font-size: 17px;
  font-weight: 750;
  letter-spacing: -0.02em;
  vertical-align: top;
}

.current-temperature.missing {
  font-size: clamp(18px, 3vw, 24px);
  letter-spacing: -0.03em;
}

.current-visual {
  display: grid;
  width: 74px;
  height: 74px;
  padding: 5px;
  justify-items: center;
  color: var(--weather-accent);
}

.condition-icon {
  width: 100%;
  height: 100%;
}

@media (max-width: 560px) {
  .current-content {
    min-height: 104px;
    grid-template-columns: minmax(0, 1fr) auto 56px;
    gap: 9px;
    padding: 16px 0 20px;
  }

  .current-condition {
    gap: 4px;
  }

  .current-condition > strong {
    font-size: 14px;
  }

  .current-condition > span {
    width: 100%;
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .current-temperature {
    gap: 4px;
    font-size: clamp(36px, 12vw, 48px);
    letter-spacing: -0.04em;
  }

  .current-temperature small {
    font-size: 14px;
  }

  .current-visual {
    width: 56px;
    height: 56px;
    padding: 4px;
  }
}

@media (max-width: 360px) {
  .current-content {
    grid-template-columns: minmax(0, 1fr) auto 48px;
    gap: 6px;
  }

  .current-visual {
    width: 48px;
    height: 48px;
  }

  .current-temperature {
    font-size: 34px;
  }
}
</style>
