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
      <path class="weather-element--moon weather-element--soft-fill" d="M64 67c-19 0-32-17-26-35 2-6 6-11 11-14-3 19 12 36 31 33-3 7-9 13-16 16Z" />
      <path class="weather-element--star icon-fill" d="m70 20 1.5 4.5L76 26l-4.5 1.5L70 32l-1.5-4.5L64 26l4.5-1.5L70 20Z" />
    </g>

    <g v-else-if="category === 'clear'">
      <circle class="weather-element--sun weather-element--soft-fill" cx="48" cy="48" r="16" />
      <path class="weather-element--sun" d="M48 13v10M48 73v10M13 48h10M73 48h10M23 23l7 7M66 66l7 7M23 73l7-7M66 30l7-7" />
    </g>

    <g v-else-if="category === 'clouds'">
      <path class="weather-element--cloud" d="M25 63h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path v-if="isNight" class="weather-element--moon" d="M59 20c-2 10 6 18 16 16-3 5-8 8-14 7" />
      <path v-else class="weather-element--sun" d="M62 19v8M78 35h-8M73 24l-6 6" />
    </g>

    <g v-else-if="category === 'rain'">
      <path class="weather-element--cloud" d="M25 57h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path class="weather-element--rain" d="m34 67-4 9M50 67l-4 9M66 67l-4 9" />
    </g>

    <g v-else-if="category === 'snow'">
      <path class="weather-element--cloud" d="M25 55h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path class="weather-element--snow" d="M34 66v12M29 69l10 6M39 69l-10 6M62 66v12M57 69l10 6M67 69l-10 6" />
    </g>

    <g v-else-if="category === 'thunderstorm'">
      <path class="weather-element--cloud" d="M25 54h45a12 12 0 0 0 1-24 21 21 0 0 0-40-1 13 13 0 0 0-6 25Z" />
      <path class="weather-element--lightning icon-fill" d="m51 59-10 15h9l-3 12 14-19h-9l5-8h-6Z" />
    </g>

    <g v-else-if="category === 'mist'">
      <path class="weather-element--mist-primary" d="M20 32h48M20 58h48" />
      <path class="weather-element--mist-secondary" d="M28 45h48M28 71h48" />
    </g>

    <g v-else>
      <circle cx="48" cy="48" r="27" />
      <path d="M35 48h26" />
    </g>
  </svg>
</template>

<style scoped>
.weather-condition-icon {
  --weather-icon-sun: color-mix(in srgb, #d5a13d 88%, currentcolor);
  --weather-icon-cloud-outline: color-mix(in srgb, #718d9b 88%, currentcolor);
  --weather-icon-cloud-fill: color-mix(in srgb, #a8bbc4 86%, currentcolor);
  --weather-icon-rain: color-mix(in srgb, #4f9ec8 88%, currentcolor);
  --weather-icon-snow: color-mix(in srgb, #82cedd 88%, currentcolor);
  --weather-icon-lightning: color-mix(in srgb, #e1ae3f 90%, currentcolor);
  --weather-icon-moon: color-mix(in srgb, #bbb9de 88%, currentcolor);
  --weather-icon-star: color-mix(in srgb, #f0d89c 90%, currentcolor);
  --weather-icon-mist-primary: color-mix(in srgb, #7695a3 88%, currentcolor);
  --weather-icon-mist-secondary: color-mix(in srgb, #9eb4be 84%, currentcolor);

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

.weather-element--soft-fill {
  fill: color-mix(in srgb, currentcolor 16%, transparent);
}

.weather-element--sun {
  color: var(--weather-icon-sun, currentcolor);
  stroke: currentcolor;
}

.weather-element--cloud {
  fill: color-mix(in srgb, var(--weather-icon-cloud-fill, currentcolor) 22%, transparent);
  stroke: var(--weather-icon-cloud-outline, currentcolor);
}

.weather-element--rain {
  stroke: var(--weather-icon-rain, currentcolor);
}

.weather-element--snow {
  stroke: var(--weather-icon-snow, currentcolor);
}

.weather-element--lightning {
  fill: var(--weather-icon-lightning, currentcolor);
  stroke: var(--weather-icon-lightning, currentcolor);
}

.weather-element--moon {
  color: var(--weather-icon-moon, currentcolor);
  stroke: currentcolor;
}

.weather-element--star {
  color: var(--weather-icon-star, currentcolor);
  fill: currentcolor;
  stroke: currentcolor;
}

.weather-element--mist-primary {
  stroke: var(--weather-icon-mist-primary, currentcolor);
}

.weather-element--mist-secondary {
  stroke: var(--weather-icon-mist-secondary, currentcolor);
}
</style>
