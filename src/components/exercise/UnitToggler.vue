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
  min-width: 80px;
  min-height: 44px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  padding: 3px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
  color: var(--unit-muted, var(--hero-muted, #425159));
  cursor: pointer;
  overflow: hidden;
  transition: background-color 180ms ease;
}

.unit-indicator {
  position: absolute;
  z-index: 0;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  border-radius: 999px;
  background: color-mix(in srgb, var(--unit-ink, var(--hero-text, #1c292f)) 9%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--unit-ink, var(--hero-text, #1c292f)) 6%, transparent);
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
  min-width: 32px;
  min-height: 36px;
  place-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 750;
  transition: color 180ms ease;
}

.unit-option.active {
  color: var(--unit-ink, var(--hero-text, #1c292f));
}

.unit-control:hover {
  background: color-mix(in srgb, var(--unit-ink, var(--hero-text, #1c292f)) 5%, transparent);
}

.unit-control:active {
  transform: translateY(1px);
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
