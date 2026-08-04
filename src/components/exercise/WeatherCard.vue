<script setup>
import { computed } from 'vue'

import TemperatureConditionLabel from '@/components/weather/TemperatureConditionLabel.vue'
import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'
import { useTemperature } from '@/composables/useTemperature'
import { formatWeatherTime, getWeatherTheme } from '@/utils/weatherTheme'

const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
    validator(value) {
      return typeof value.id === 'string' && typeof value.name === 'string' && (value.temp === null || Number.isFinite(value.temp))
    },
  },
  selected: {
    type: Boolean,
    default: false,
  },
  promoting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits({
  'select-card': (city) => Boolean(city?.id),
  'click-detail': (cityId) => typeof cityId === 'string',
})

const { displayTemp, unitSymbol } = useTemperature(() => props.cityItem.temp)
const hasTemperature = computed(() => Number.isFinite(props.cityItem.temp))
const weatherTheme = computed(() => getWeatherTheme(props.cityItem))
const localTime = computed(() => formatWeatherTime(props.cityItem.observedAt, props.cityItem.timezoneOffset))
const cityDisplayName = computed(() => props.cityItem.displayName || props.cityItem.name)

const handleCardSelect = () => {
  emit('select-card', props.cityItem)
}

const handleDetailClick = () => {
  emit('click-detail', props.cityItem.id)
}
</script>

<template>
  <div class="weather-card-hover-zone" :style="{ viewTransitionName: promoting ? 'weather-promotion' : undefined }">
    <article class="weather-card dashboard-surface dashboard-surface--weather" :class="{ 'is-selected': selected, 'is-promoting': promoting }">
      <button class="card-select" type="button" :aria-label="`${cityDisplayName} 날씨를 메인 화면으로 보기`" @click="handleCardSelect">
        <span class="city-copy">
          <span class="city-name">{{ cityDisplayName }}</span>
          <span v-if="cityItem.countryCode" class="city-meta">{{ cityItem.countryCode }} · 현지 {{ localTime }}</span>
          <span class="condition">{{ cityItem.status || weatherTheme.label || '날씨 설명 없음' }}</span>
        </span>

        <span class="weather-mark" aria-hidden="true">
          <WeatherConditionIcon :category="weatherTheme.category" :is-night="weatherTheme.isNight" />
        </span>

        <span class="temperature-stack">
          <span class="temperature">
            <strong :class="{ missing: !hasTemperature }">{{ hasTemperature ? displayTemp : '정보 없음' }}</strong>
            <span v-if="hasTemperature">{{ unitSymbol }}</span>
          </span>
          <TemperatureConditionLabel v-if="hasTemperature" :temperature="cityItem.temp" />
        </span>
      </button>

      <button class="detail-button" type="button" :aria-label="`${cityDisplayName} 상세 날씨 페이지로 이동`" @click.stop="handleDetailClick">
        <span class="sr-only">상세 보기</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m7 4 6 6-6 6" />
        </svg>
      </button>
    </article>
  </div>
</template>

<style scoped>
.weather-card-hover-zone {
  min-width: 0;
  min-height: 100px;
}

.weather-card {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 100px;
  height: 100%;
  grid-template-columns: minmax(0, 1fr) 44px;
  overflow: hidden;
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 320ms ease,
    border-color 180ms ease;
}

.weather-card.is-selected {
  border-color: color-mix(in srgb, var(--weather-accent, var(--accent)) 42%, rgba(255, 255, 255, 0.3));
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.19), rgba(255, 255, 255, 0.1));
}

.weather-card:focus-within {
  border-color: rgba(255, 255, 255, 0.62);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--weather-accent, var(--accent)) 28%, transparent),
    0 12px 30px rgba(28, 43, 48, 0.08);
}

.weather-card.is-promoting {
  border-color: rgba(255, 255, 255, 0.68);
  box-shadow: 0 16px 38px rgba(28, 43, 48, 0.12);
}

.card-select {
  display: grid;
  min-width: 0;
  min-height: 100px;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) 38px auto;
  align-items: center;
  gap: clamp(9px, 1.8vw, 14px);
  padding: 12px 4px 12px 16px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.card-select:focus-visible,
.detail-button:focus-visible {
  border-radius: 12px;
  outline: 2px solid color-mix(in srgb, var(--weather-accent, currentcolor) 70%, white);
  outline-offset: -2px;
}

.weather-mark {
  width: 38px;
  height: 38px;
  padding: 1px;
  border: 0;
  background: transparent;
  color: var(--weather-accent, currentcolor);
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    color 180ms ease;
}

.city-copy {
  display: block;
  min-width: 0;
}

.city-copy > span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city-name {
  display: block;
  margin: 0 0 3px;
  color: inherit;
  font-size: clamp(14px, 2.4vw, 17px);
  font-weight: 850;
}

.condition {
  display: block;
  margin: 0;
  color: var(--hero-muted, var(--muted));
  font-size: clamp(10px, 1.8vw, 12px);
}

.city-meta {
  display: block;
  margin-bottom: 2px;
  color: var(--hero-muted, var(--muted));
  font-size: 9px;
  font-weight: 780;
  letter-spacing: 0.02em;
}

.temperature-stack {
  display: grid;
  min-width: 0;
  justify-items: end;
  gap: 6px;
  align-self: center;
}

.temperature-stack :deep(.temperature-condition) {
  --temperature-condition-font-size: 9px;
  --temperature-condition-icon-size: 11px;
}

.temperature {
  display: flex;
  align-items: flex-start;
  align-self: center;
  gap: 7px;
  margin: 0;
  color: inherit;
  white-space: nowrap;
}

.temperature strong {
  font-size: clamp(27px, 4.2vw, 34px);
  font-variant-numeric: tabular-nums;
  line-height: 0.94;
  letter-spacing: -0.035em;
}

.temperature strong.missing {
  color: var(--hero-muted, var(--muted));
  font-size: 11px;
  letter-spacing: -0.02em;
  line-height: 1.3;
  text-align: right;
  white-space: nowrap;
}

.temperature span {
  margin-top: 2px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.detail-button {
  display: grid;
  width: 44px;
  height: 100%;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--hero-muted, var(--muted));
  cursor: pointer;
}

.detail-button:hover {
  color: inherit;
}

.detail-button svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: transform 180ms ease;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .weather-card-hover-zone:hover .weather-card:not(.is-promoting) {
    border-color: rgba(255, 255, 255, 0.46);
    box-shadow: 0 16px 36px rgba(28, 43, 48, 0.1);
    transform: translateY(-4px) scale(1.006);
  }

  .weather-card-hover-zone:hover .weather-card.is-selected:not(.is-promoting) {
    border-color: color-mix(in srgb, var(--weather-accent, var(--accent)) 52%, white);
    box-shadow: 0 16px 36px rgba(28, 43, 48, 0.1);
  }

  .weather-card-hover-zone:hover .weather-card:not(.is-promoting) .weather-mark {
    transform: translateY(-2px) scale(1.04);
  }

  .detail-button:hover svg {
    transform: translateX(2px);
  }
}

@media (max-width: 430px) {
  .weather-card-hover-zone,
  .weather-card {
    min-height: 92px;
  }

  .weather-card {
    grid-template-columns: minmax(0, 1fr) 40px;
  }

  .card-select {
    min-height: 92px;
    grid-template-columns: minmax(0, 1fr) 32px auto;
    gap: 8px;
    padding: 10px 2px 10px 12px;
  }

  .weather-mark {
    width: 32px;
    height: 32px;
  }

  .temperature strong {
    font-size: clamp(24px, 8vw, 30px);
  }

  .temperature span {
    font-size: 11px;
  }

  .detail-button {
    width: 40px;
    min-height: 92px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-card {
    transition: none;
  }

  .weather-card-hover-zone:hover .weather-card {
    transform: none;
  }

  .weather-mark {
    transition: none;
  }

  .detail-button svg {
    transition: none;
  }

  .weather-card-hover-zone:hover .weather-mark,
  .detail-button:hover svg {
    transform: none;
  }
}
</style>
