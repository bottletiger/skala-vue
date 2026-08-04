<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  to: {
    type: [String, Object],
    required: true,
  },
})
</script>

<template>
  <RouterLink class="weather-route-link" :to="to">
    <span><slot></slot></span>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  </RouterLink>
</template>

<style scoped>
.weather-route-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 18px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, white 9%, transparent);
  color: var(--hero-text);
  font-size: 13px;
  font-weight: 800;
  backdrop-filter: blur(14px) saturate(108%);
  -webkit-backdrop-filter: blur(14px) saturate(108%);
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    transform 180ms ease;
}

.weather-route-link svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: transform 180ms ease;
}

.weather-route-link:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .weather-route-link:hover {
    border-color: color-mix(in srgb, var(--hero-text) 30%, transparent);
    background: color-mix(in srgb, white 15%, transparent);
    transform: translateY(-1px);
  }

  .weather-route-link:hover svg {
    transform: translateX(3px);
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .weather-route-link {
    background: color-mix(in srgb, var(--hero-start) 84%, white);
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-route-link,
  .weather-route-link svg {
    transition: none;
  }
}
</style>
