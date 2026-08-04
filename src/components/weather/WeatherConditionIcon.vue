<script setup>
defineProps({
  category: {
    type: String,
    default: 'neutral',
    validator: (value) => ['clear', 'clouds', 'rain', 'snow', 'mist', 'thunderstorm', 'neutral'].includes(value),
  },
  isNight: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <svg class="weather-condition-icon" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <g v-if="category === 'clear' && isNight">
      <path d="M64 67c-19 0-32-17-26-35 2-6 6-11 11-14-3 19 12 36 31 33-3 7-9 13-16 16Z" />
      <path d="m70 20 1.5 4.5L76 26l-4.5 1.5L70 32l-1.5-4.5L64 26l4.5-1.5L70 20Z" />
    </g>

    <g v-else-if="category === 'clear'">
      <circle cx="48" cy="48" r="16" />
      <path d="M48 13v10M48 73v10M13 48h10M73 48h10M23 23l7 7M66 66l7 7M23 73l7-7M66 30l7-7" />
    </g>

    <g v-else-if="category === 'clouds'">
      <path d="M25 63h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path v-if="isNight" d="M59 20c-2 10 6 18 16 16-3 5-8 8-14 7" />
      <path v-else d="M62 19v8M78 35h-8M73 24l-6 6" />
    </g>

    <g v-else-if="category === 'rain'">
      <path d="M25 57h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path d="m34 67-4 9M50 67l-4 9M66 67l-4 9" />
    </g>

    <g v-else-if="category === 'snow'">
      <path d="M25 55h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path d="M34 66v12M29 69l10 6M39 69l-10 6M62 66v12M57 69l10 6M67 69l-10 6" />
    </g>

    <g v-else-if="category === 'thunderstorm'">
      <path d="M25 54h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path class="icon-fill" d="m51 59-10 15h9l-3 12 14-19h-9l5-8h-6Z" />
    </g>

    <g v-else-if="category === 'mist'">
      <path d="M20 32h48M28 45h48M20 58h48M28 71h48" />
    </g>

    <g v-else>
      <circle cx="48" cy="48" r="27" />
      <path d="M35 48h26" />
    </g>
  </svg>
</template>

<style scoped>
.weather-condition-icon {
  display: block;
  width: 100%;
  height: 100%;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.icon-fill {
  fill: currentcolor;
  stroke-width: 1.5;
}
</style>
