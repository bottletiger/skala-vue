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
    <div class="current-visual">
      <WeatherConditionIcon class="condition-icon" :category="theme.category" :is-night="theme.isNight" />
    </div>

    <div class="current-location">
      <p>{{ weather.displayName || weather.name }}</p>
      <strong>{{ weather.status || theme.label || '날씨 설명 없음' }}</strong>
      <span>관측 {{ observedAt }}</span>
    </div>

    <div class="current-reading">
      <div id="detail-weather-title" class="current-temperature" :class="{ missing: currentTemperature === null }" role="heading" aria-level="2">
        <span>{{ currentTemperature ?? '정보 없음' }}</span>
        <small v-if="currentTemperature !== null">{{ unitSymbol }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.current-content {
  display: grid;
  min-height: 110px;
  grid-template-columns: 82px minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 0 8px;
}

.current-location {
  display: grid;
  min-width: 0;
  justify-items: start;
}

.current-location > p {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(20px, 2.6vw, 28px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.current-location > strong {
  display: block;
  width: 100%;
  margin-top: 4px;
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-location > span {
  margin-top: 6px;
  color: color-mix(in srgb, var(--hero-muted) 82%, transparent);
  font-size: 10px;
  font-weight: 700;
}

.current-reading {
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
  width: 82px;
  height: 82px;
  padding: 7px;
  justify-items: center;
  color: var(--weather-accent);
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.condition-icon {
  width: 100%;
  height: 100%;
}

@media (max-width: 560px) {
  .current-content {
    min-height: 92px;
    grid-template-columns: 60px minmax(0, 1fr) auto;
    gap: 11px;
    padding: 0 2px;
  }

  .current-location > p {
    font-size: 19px;
  }

  .current-location > strong {
    font-size: 11px;
  }

  .current-location > span {
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
    width: 60px;
    height: 60px;
    padding: 5px;
  }
}

@media (max-width: 360px) {
  .current-content {
    grid-template-columns: 54px minmax(0, 1fr) auto;
    gap: 8px;
  }

  .current-visual {
    width: 54px;
    height: 54px;
  }

  .current-temperature {
    font-size: 34px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .current-visual {
    transition: none;
  }
}
</style>
