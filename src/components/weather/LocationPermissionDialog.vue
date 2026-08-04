<script setup>
import { computed } from 'vue'

import WeatherConditionIcon from '@/components/weather/WeatherConditionIcon.vue'

const props = defineProps({
  state: {
    type: String,
    required: true,
    validator: (value) => ['prompt', 'requesting', 'denied', 'error', 'unsupported'].includes(value),
  },
  message: {
    type: String,
    default: '',
  },
})

defineEmits({
  accept: null,
  dismiss: null,
})

const copyByState = {
  prompt: {
    eyebrow: 'LOCAL WEATHER',
    title: '지금 있는 곳의 날씨부터 볼까요?',
    description: '현재 위치는 날씨를 조회하는 동안에만 사용하며 별도로 저장하지 않습니다.',
    action: '내 위치 날씨 보기',
  },
  requesting: {
    eyebrow: 'FINDING LOCATION',
    title: '현재 위치를 확인하고 있습니다',
    description: '브라우저의 위치 권한 안내에서 허용을 선택해 주세요.',
    action: '위치 확인 중',
  },
  denied: {
    eyebrow: 'LOCATION OFF',
    title: '위치 권한이 꺼져 있어요',
    description: '브라우저의 사이트 설정에서 위치 권한을 허용한 다음 다시 시도해 주세요.',
    action: '다시 시도',
  },
  error: {
    eyebrow: 'LOCATION UNAVAILABLE',
    title: '현재 위치를 확인하지 못했어요',
    description: '서울 날씨로 계속 둘러보거나 잠시 후 위치 확인을 다시 시도할 수 있습니다.',
    action: '다시 시도',
  },
  unsupported: {
    eyebrow: 'LOCATION UNAVAILABLE',
    title: '위치 기능을 사용할 수 없어요',
    description: '현재 브라우저에서는 위치 확인을 지원하지 않아 서울 날씨부터 보여드립니다.',
    action: '서울 날씨로 계속',
  },
}

const currentCopy = computed(() => copyByState[props.state])
</script>

<template>
  <div class="location-consent-layer" role="presentation">
    <div class="location-consent-backdrop" aria-hidden="true"></div>
    <section class="location-consent" role="dialog" aria-modal="true" aria-labelledby="location-consent-title" aria-describedby="location-consent-description">
      <div class="location-consent-icon" aria-hidden="true">
        <WeatherConditionIcon category="clouds" :is-night="false" />
        <span></span>
      </div>

      <p class="location-consent-eyebrow">{{ currentCopy.eyebrow }}</p>
      <h2 id="location-consent-title">{{ currentCopy.title }}</h2>
      <p id="location-consent-description">{{ message || currentCopy.description }}</p>

      <div class="location-consent-actions">
        <button class="location-primary" type="button" :disabled="state === 'requesting'" @click="$emit('accept')">
          <span v-if="state === 'requesting'" class="location-spinner" aria-hidden="true"></span>
          {{ currentCopy.action }}
        </button>
        <button v-if="state !== 'unsupported'" class="location-secondary" type="button" :disabled="state === 'requesting'" @click="$emit('dismiss')">서울 날씨로 둘러보기</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.location-consent-layer {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
}

.location-consent-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(28, 41, 47, 0.28);
  backdrop-filter: blur(18px) saturate(112%);
  -webkit-backdrop-filter: blur(18px) saturate(112%);
}

.location-consent {
  position: relative;
  width: min(430px, 100%);
  padding: 34px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 30px;
  background: color-mix(in srgb, var(--hero-end) 76%, rgba(255, 255, 255, 0.86));
  box-shadow:
    0 28px 80px rgba(21, 34, 39, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  color: var(--hero-text);
  text-align: center;
}

.location-consent-icon {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  padding: 8px;
  color: var(--weather-accent);
}

.location-consent-icon span {
  position: absolute;
  right: 4px;
  bottom: 5px;
  width: 15px;
  height: 15px;
  border: 4px solid color-mix(in srgb, var(--hero-end) 74%, white);
  border-radius: 50%;
  background: var(--hero-text);
}

.location-consent-eyebrow {
  margin: 0 0 8px;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.1em;
}

.location-consent h2 {
  margin: 0;
  font-size: clamp(26px, 6vw, 34px);
  line-height: 1.15;
  letter-spacing: -0.045em;
}

.location-consent h2 + p {
  max-width: 330px;
  margin: 14px auto 0;
  color: var(--hero-muted);
  font-size: 13px;
  line-height: 1.75;
}

.location-consent-actions {
  display: grid;
  gap: 8px;
  margin-top: 26px;
}

.location-consent-actions button {
  min-height: 48px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 820;
}

.location-consent-actions button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.location-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: color-mix(in srgb, var(--hero-text) 86%, transparent);
  color: white;
}

.location-secondary {
  border: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
  background: rgba(255, 255, 255, 0.2);
  color: var(--hero-muted);
}

.location-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.32);
  border-top-color: white;
  border-radius: 50%;
  animation: location-spin 760ms linear infinite;
}

@keyframes location-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 560px) {
  .location-consent-layer {
    align-items: end;
    padding: 12px;
  }

  .location-consent {
    padding: 28px 22px calc(24px + env(safe-area-inset-bottom));
    border-radius: 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .location-spinner {
    animation: none;
  }
}
</style>
