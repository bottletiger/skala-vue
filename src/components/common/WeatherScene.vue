<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

import { clearActiveSceneWeatherTheme, setActiveSceneWeatherTheme, useSharedWeatherTheme } from '@/composables/useSharedWeatherTheme'

const props = defineProps({
  theme: {
    type: Object,
    default: null,
  },
})

const { weatherTheme: sharedWeatherTheme } = useSharedWeatherTheme()
const activeTheme = computed(() => props.theme ?? sharedWeatherTheme.value)
const sceneOwner = Symbol('weather-scene')

watch(
  () => props.theme,
  (theme) => {
    if (theme) setActiveSceneWeatherTheme(theme, sceneOwner)
    else clearActiveSceneWeatherTheme(sceneOwner)
  },
  { immediate: true },
)

onBeforeUnmount(() => clearActiveSceneWeatherTheme(sceneOwner))
</script>

<template>
  <div class="weather-scene" :style="activeTheme.cssVariables" :data-theme="activeTheme.name">
    <slot name="backdrop"></slot>
    <div class="weather-scene__atmosphere" aria-hidden="true"></div>
    <slot></slot>
  </div>
</template>

<style scoped>
.weather-scene {
  position: relative;
  min-height: 100svh;
  overflow: clip;
  isolation: isolate;
  background:
    radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--weather-accent) 24%, transparent) 0%, transparent 31%),
    radial-gradient(ellipse at 14% 88%, color-mix(in srgb, var(--hero-end) 72%, transparent) 0%, transparent 52%),
    linear-gradient(158deg, var(--hero-start) 0%, color-mix(in srgb, var(--hero-start) 54%, var(--hero-end)) 52%, var(--hero-end) 100%);
  color: var(--hero-text);
  transition:
    --hero-start 500ms ease,
    --hero-end 500ms ease,
    --weather-accent 500ms ease,
    --hero-text 500ms ease,
    --hero-muted 500ms ease,
    color 500ms ease;
}

.weather-scene::before,
.weather-scene::after,
.weather-scene__atmosphere {
  position: absolute;
  pointer-events: none;
  content: '';
}

.weather-scene::before {
  z-index: -2;
  inset: -18% -14% -8%;
  background:
    radial-gradient(ellipse at 12% 28%, rgba(255, 255, 255, 0.34) 0 6%, transparent 28%), radial-gradient(ellipse at 52% 20%, rgba(255, 255, 255, 0.2) 0 8%, transparent 31%),
    radial-gradient(ellipse at 88% 38%, color-mix(in srgb, var(--weather-accent) 22%, transparent) 0 7%, transparent 30%);
  filter: blur(34px);
  opacity: 0.82;
  animation: weather-atmosphere-drift 22s ease-in-out infinite alternate;
}

.weather-scene::after {
  z-index: -1;
  right: -22%;
  bottom: -20%;
  left: -22%;
  height: 62%;
  background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--weather-accent) 26%, transparent) 0%, transparent 62%), linear-gradient(to top, rgba(255, 255, 255, 0.13), transparent 72%);
  filter: blur(58px);
  opacity: 0.72;
}

.weather-scene__atmosphere {
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, 0.22), transparent 48%), linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 48%, rgba(255, 255, 255, 0.07));
}

.weather-scene[data-theme='clouds'] .weather-scene__atmosphere {
  background:
    radial-gradient(ellipse at 14% 20%, rgba(255, 255, 255, 0.31) 0 7%, transparent 26%), radial-gradient(ellipse at 43% 11%, rgba(255, 255, 255, 0.19) 0 9%, transparent 30%),
    radial-gradient(ellipse at 82% 31%, rgba(255, 255, 255, 0.24) 0 8%, transparent 28%);
  filter: blur(18px);
}

.weather-scene[data-theme='rain'] .weather-scene__atmosphere,
.weather-scene[data-theme='thunderstorm'] .weather-scene__atmosphere {
  background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(255, 255, 255, 0.09) 19px, transparent 21px 34px);
  opacity: 0.48;
}

.weather-scene[data-theme='snow'] .weather-scene__atmosphere {
  background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.72) 0 2px, transparent 3px), radial-gradient(circle at 70% 34%, rgba(255, 255, 255, 0.62) 0 3px, transparent 4px),
    radial-gradient(circle at 43% 55%, rgba(255, 255, 255, 0.58) 0 2px, transparent 3px);
  background-size:
    88px 88px,
    122px 122px,
    148px 148px;
}

.weather-scene[data-theme='mist'] .weather-scene__atmosphere {
  background: radial-gradient(ellipse at 18% 30%, rgba(255, 255, 255, 0.28), transparent 48%), radial-gradient(ellipse at 78% 58%, rgba(255, 255, 255, 0.22), transparent 52%);
  filter: blur(28px);
}

@keyframes weather-atmosphere-drift {
  from {
    transform: translate3d(-1.5%, -0.5%, 0) scale(1);
  }

  to {
    transform: translate3d(1.5%, 0.8%, 0) scale(1.035);
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-scene,
  .weather-scene::before {
    animation: none;
    transition: none;
  }
}
</style>
