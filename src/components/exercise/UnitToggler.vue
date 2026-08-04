<script setup>
import { storeToRefs } from 'pinia'

import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()
const { unit } = storeToRefs(configStore)
const { toggleUnit } = configStore

const getUnitName = (value) => (value === 'celsius' ? '섭씨' : '화씨')
</script>

<template>
  <div class="unit-toggler">
    <span class="sr-only" aria-live="polite">현재 온도 단위는 {{ getUnitName(unit) }}입니다.</span>
    <button
      class="unit-control"
      :class="{ 'is-fahrenheit': unit === 'fahrenheit' }"
      type="button"
      :aria-label="`${getUnitName(unit)}에서 ${getUnitName(unit === 'celsius' ? 'fahrenheit' : 'celsius')}로 변경`"
      @click="toggleUnit"
    >
      <span class="unit-indicator" aria-hidden="true"></span>
      <span class="unit-option" :class="{ active: unit === 'celsius' }" aria-hidden="true">°C</span>
      <span class="unit-option" :class="{ active: unit === 'fahrenheit' }" aria-hidden="true">°F</span>
    </button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: inline-flex;
}

.unit-control {
  position: relative;
  isolation: isolate;
  display: inline-grid;
  min-width: 104px;
  min-height: 44px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-color: color-mix(in srgb, var(--hero-text, #1c292f) 24%, transparent);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 0 0 1px rgba(28, 41, 47, 0.07),
    0 10px 30px rgba(23, 35, 45, 0.1);
  color: var(--hero-muted, #425159);
  cursor: pointer;
  overflow: hidden;
  backdrop-filter: blur(18px) saturate(120%);
  -webkit-backdrop-filter: blur(18px) saturate(120%);
  transition: background-color 180ms ease;
}

.unit-indicator {
  position: absolute;
  z-index: 0;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: 999px;
  background: var(--hero-text, #1c292f);
  box-shadow: 0 3px 12px rgba(23, 35, 45, 0.1);
  transform: translateX(0);
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.unit-control.is-fahrenheit .unit-indicator {
  transform: translateX(100%);
}

.unit-option {
  position: relative;
  z-index: 1;
  display: grid;
  min-width: 38px;
  min-height: 34px;
  place-items: center;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 750;
  transition: color 180ms ease;
}

.unit-option.active {
  color: var(--hero-start, #e4e9e7);
}

.unit-control:hover {
  background: rgba(255, 255, 255, 0.3);
}

.unit-control:active {
  transform: translateY(1px);
}

@supports not (backdrop-filter: blur(1px)) {
  .unit-control {
    background: rgba(244, 247, 246, 0.82);
  }
}

@media (prefers-reduced-motion: reduce) {
  .unit-control,
  .unit-indicator,
  .unit-option {
    transition: none;
  }

  .unit-control:active {
    transform: none;
  }
}
</style>
