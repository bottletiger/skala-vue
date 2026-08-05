<script setup>
import { computed } from 'vue'

const props = defineProps({
  weather: {
    type: Object,
    default: null,
  },
  advice: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  canRequest: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['request'])

const toFiniteNumber = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && !value.trim()) return null
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

const firstFiniteNumber = (...values) => {
  for (const value of values) {
    const number = toFiniteNumber(value)
    if (number !== null) return number
  }
  return null
}

const weatherValues = computed(() => ({
  temperature: firstFiniteNumber(props.weather?.temp, props.weather?.temperature, props.weather?.temperature_2m),
  humidity: firstFiniteNumber(props.weather?.humidity, props.weather?.relativeHumidity, props.weather?.relative_humidity_2m),
  wind: firstFiniteNumber(props.weather?.wind, props.weather?.windSpeed, props.weather?.wind_speed_10m),
  precipitation: firstFiniteNumber(props.weather?.precipitationProbability, props.weather?.precipitation_probability, props.weather?.rainChance),
  category: String(props.weather?.category ?? props.weather?.weatherCategory ?? '').toLowerCase(),
  conditionId: firstFiniteNumber(props.weather?.conditionId, props.weather?.weatherId),
}))

const fallbackAdvice = computed(() => {
  const { temperature, humidity, wind, precipitation, category, conditionId } = weatherValues.value
  const outfit = []
  const carry = []
  const cautions = []

  if (Number.isFinite(temperature)) {
    if (temperature >= 28) outfit.push('통풍이 잘되는 반소매와 가벼운 하의')
    else if (temperature >= 20) outfit.push('얇은 상의와 가벼운 겉옷')
    else if (temperature >= 12) outfit.push('니트나 재킷을 겹쳐 입기')
    else if (temperature >= 5) outfit.push('도톰한 외투와 긴 옷')
    else outfit.push('보온성이 좋은 외투와 장갑')
  } else {
    outfit.push('기온 변화에 대응하기 쉬운 겹쳐 입기')
  }

  const looksRainy = (Number.isFinite(precipitation) && precipitation >= 40) || ['rain', 'drizzle', 'thunderstorm'].includes(category) || (Number.isFinite(conditionId) && conditionId >= 200 && conditionId < 600)
  if (looksRainy) carry.push('작은 우산')
  if (Number.isFinite(temperature) && temperature >= 25) carry.push('물')
  if (Number.isFinite(wind) && wind >= 8) cautions.push('바람이 강해 헐거운 모자나 우산 사용에 주의하세요.')
  if (Number.isFinite(humidity) && humidity >= 80) cautions.push('습도가 높아 체감온도가 달라질 수 있어요.')

  const headline = looksRainy ? '비에 대비하면 한결 편한 하루예요.' : Number.isFinite(temperature) && temperature >= 28 ? '가볍고 시원한 옷차림이 잘 맞아요.' : '기온에 맞춰 한 겹씩 조절해 보세요.'

  return { headline, outfit, carry, cautions }
})

const adviceData = computed(() => props.advice?.advice ?? props.advice ?? fallbackAdvice.value)
const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}
const outfitItems = computed(() => toList(adviceData.value?.outfit ?? adviceData.value?.clothing))
const carryItems = computed(() => toList(adviceData.value?.carry ?? adviceData.value?.items))
const cautionItems = computed(() => toList(adviceData.value?.cautions ?? adviceData.value?.warnings))
</script>

<template>
  <section v-if="weather" class="advice-panel" aria-labelledby="weather-advice-title" :aria-busy="isLoading">
    <header>
      <div class="advice-symbol" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 8.5A4 4 0 0 1 12 5a4 4 0 0 1 4 3.5M7 9h10l-1 10H8L7 9Z" />
          <path d="M9.5 5.5 8 3M14.5 5.5 16 3" />
        </svg>
      </div>
      <div>
        <span>FOR TODAY</span>
        <h2 id="weather-advice-title">오늘의 준비</h2>
      </div>
      <button v-if="canRequest" type="button" :disabled="isLoading" @click="emit('request')">
        {{ isLoading ? '정리하는 중' : advice ? '새로 추천' : '맞춤 추천' }}
      </button>
    </header>

    <div v-if="isLoading" class="advice-loading" aria-live="polite">
      <span></span>
      <span></span>
    </div>

    <template v-else>
      <p class="advice-headline">{{ adviceData.headline || adviceData.comment || fallbackAdvice.headline }}</p>

      <dl class="advice-details">
        <div v-if="outfitItems.length">
          <dt>옷차림</dt>
          <dd>{{ outfitItems.join(' · ') }}</dd>
        </div>
        <div v-if="carryItems.length">
          <dt>챙길 것</dt>
          <dd>{{ carryItems.join(' · ') }}</dd>
        </div>
        <div v-if="cautionItems.length">
          <dt>참고</dt>
          <dd>{{ cautionItems.join(' ') }}</dd>
        </div>
      </dl>

      <p v-if="errorMessage" class="advice-error" role="status">기본 날씨 안내를 표시하고 있습니다. 잠시 후 다시 시도해 주세요.</p>
    </template>
  </section>
</template>

<style scoped>
.advice-panel {
  display: grid;
  gap: 16px;
  margin: 34px auto 0;
  padding: 22px 24px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  border-radius: 20px;
  background: linear-gradient(135deg, color-mix(in srgb, white 12%, transparent), color-mix(in srgb, white 5%, transparent));
  box-shadow: 0 12px 34px color-mix(in srgb, var(--hero-end) 20%, transparent);
  backdrop-filter: blur(18px) saturate(110%);
  -webkit-backdrop-filter: blur(18px) saturate(110%);
}

.advice-panel > header {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
}

.advice-symbol {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  color: var(--weather-accent);
}

.advice-symbol svg {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.55;
}

.advice-panel header span {
  display: block;
  margin-bottom: 1px;
  color: var(--weather-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.13em;
}

.advice-panel h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: 16px;
  letter-spacing: -0.035em;
}

.advice-panel header button {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 17%, transparent);
  border-radius: 9px;
  background: color-mix(in srgb, white 8%, transparent);
  color: var(--hero-text);
  cursor: pointer;
  font-size: 9px;
  font-weight: 820;
}

.advice-panel header button:disabled {
  cursor: wait;
  opacity: 0.5;
}

.advice-headline {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(17px, 3vw, 22px);
  font-weight: 810;
  line-height: 1.45;
  letter-spacing: -0.035em;
}

.advice-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding-top: 13px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.advice-details > div {
  display: grid;
  min-width: 0;
  gap: 3px;
  padding: 0 15px;
}

.advice-details > div:first-child {
  padding-left: 0;
}

.advice-details > div + div {
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 11%, transparent);
}

.advice-details dt {
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 800;
}

.advice-details dd {
  margin: 0;
  color: var(--hero-text);
  font-size: 10px;
  font-weight: 730;
  line-height: 1.55;
}

.advice-error {
  margin: -6px 0 0;
  color: var(--hero-muted);
  font-size: 9px;
}

.advice-loading {
  display: grid;
  gap: 10px;
  padding: 5px 0;
}

.advice-loading span {
  display: block;
  width: 78%;
  height: 13px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--hero-text) 9%, transparent);
  animation: advice-pulse 1.3s ease-in-out infinite alternate;
}

.advice-loading span:last-child {
  width: 48%;
  animation-delay: 180ms;
}

@keyframes advice-pulse {
  to {
    opacity: 0.42;
  }
}

@media (max-width: 620px) {
  .advice-panel {
    padding: 19px 17px;
  }

  .advice-details {
    grid-template-columns: 1fr;
  }

  .advice-details > div,
  .advice-details > div:first-child {
    padding: 9px 0;
  }

  .advice-details > div + div {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
    border-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .advice-loading span {
    animation: none;
  }
}
</style>
