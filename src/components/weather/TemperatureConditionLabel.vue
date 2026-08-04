<script setup>
import { computed } from 'vue'

import { getTemperatureCondition } from '@/utils/temperature'

const props = defineProps({
  temperature: {
    type: Number,
    default: null,
  },
})

const condition = computed(() => getTemperatureCondition(props.temperature))
</script>

<template>
  <span v-if="condition" class="temperature-condition" :class="`temperature-condition--${condition.key}`" :aria-label="`${condition.rangeLabel}, ${condition.label}`">
    <svg v-if="condition.key === 'hot'" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 19c-1.4-1.4-1.4-3.2 0-4.6s1.4-3.2 0-4.6S5.6 6.6 7 5.2M12 19c-1.4-1.4-1.4-3.2 0-4.6s1.4-3.2 0-4.6-1.4-3.2 0-4.6M17 19c-1.4-1.4-1.4-3.2 0-4.6s1.4-3.2 0-4.6-1.4-3.2 0-4.6" />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 5.3l3 2.2 3-2.2M9 18.7l3-2.2 3 2.2" />
    </svg>
    <span>{{ condition.label }}</span>
  </span>
</template>

<style scoped>
.temperature-condition {
  display: inline-flex;
  min-height: 14px;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--hero-muted, var(--muted));
  font-size: var(--temperature-condition-font-size, 11px);
  font-weight: 760;
  line-height: 1;
  white-space: nowrap;
}

.temperature-condition--hot {
  color: color-mix(in srgb, var(--hero-text, var(--ink)) 68%, var(--sun));
}

.temperature-condition--cool {
  color: color-mix(in srgb, var(--hero-text, var(--ink)) 72%, #6f8998);
}

.temperature-condition svg {
  width: var(--temperature-condition-icon-size, 14px);
  height: var(--temperature-condition-icon-size, 14px);
  flex: 0 0 auto;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}
</style>
