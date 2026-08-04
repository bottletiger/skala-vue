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
        <span class="weather-mark" aria-hidden="true">
          <WeatherConditionIcon :category="weatherTheme.category" :is-night="weatherTheme.isNight" />
        </span>

        <span class="city-copy">
          <span class="city-name">{{ cityDisplayName }}</span>
          <span v-if="cityItem.countryCode" class="city-meta">{{ cityItem.countryCode }} · 현지 {{ localTime }}</span>
          <span class="condition">{{ cityItem.status || weatherTheme.label || '날씨 설명 없음' }}</span>
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
        <span>상세 보기</span>
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
  min-height: 164px;
}

.weather-card {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 164px;
  height: 100%;
  grid-template-rows: 1fr auto;
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
  min-height: 108px;
  width: 100%;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 16px 18px 8px;
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
  width: 52px;
  height: 52px;
  padding: 2px;
  border: 0;
  background: transparent;
  color: var(--weather-accent, currentcolor);
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    color 180ms ease;
}

.city-copy {
  min-width: 0;
}

.city-name {
  display: block;
  margin: 0 0 4px;
  color: inherit;
  font-size: 17px;
  font-weight: 850;
}

.condition {
  display: block;
  margin: 0;
  color: var(--hero-muted, var(--muted));
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  gap: 8px;
  align-self: center;
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
  font-size: clamp(32px, 3.6vw, 38px);
  font-variant-numeric: tabular-nums;
  line-height: 0.94;
  letter-spacing: -0.035em;
}

.temperature strong.missing {
  max-width: 72px;
  color: var(--hero-muted, var(--muted));
  font-size: 13px;
  letter-spacing: -0.02em;
  line-height: 1.3;
  text-align: right;
  white-space: normal;
}

.temperature span {
  margin-top: 2px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.detail-button {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  justify-self: end;
  gap: 4px;
  min-width: 0;
  min-height: 44px;
  margin: 0 10px 6px;
  padding: 0 9px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--hero-muted, var(--muted));
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
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
    min-height: 150px;
  }

  .card-select {
    min-height: 102px;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    gap: 10px;
    padding: 14px 14px 6px;
  }

  .weather-mark {
    width: 46px;
    height: 46px;
  }

  .temperature strong {
    font-size: 32px;
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
