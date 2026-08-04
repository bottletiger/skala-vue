<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { getWeatherVideoKey } from '@/utils/weatherVideo'

const props = defineProps({
  weather: {
    type: Object,
    default: null,
  },
})

const VIDEO_FILE_BY_KEY = Object.freeze({
  'clear-day': 'clear.mp4',
  'clear-night': 'night.mp4',
  'few-clouds': 'few-clouds.mp4',
  overcast: 'clouds.mp4',
  drizzle: 'drizzle.mp4',
  rain: 'rain.mp4',
  'heavy-rain': 'heavy-rain.mp4',
  thunderstorm: 'thunderstorm.mp4',
  snow: 'snow.mp4',
  fog: 'fog.mp4',
})

const prefersReducedMotion = ref(false)
const prefersDataSaving = ref(false)
const isReady = ref(false)
const hasError = ref(false)
let motionQuery
let networkConnection

const activeVideoKey = computed(() => getWeatherVideoKey(props.weather))
const videoFile = computed(() => VIDEO_FILE_BY_KEY[activeVideoKey.value] ?? '')
const videoSource = computed(() => (videoFile.value ? `${import.meta.env.BASE_URL}weather-videos/${videoFile.value}` : ''))
const shouldPlayVideo = computed(() => Boolean(videoSource.value) && !prefersReducedMotion.value && !prefersDataSaving.value && !hasError.value)

const updateMotionPreference = () => {
  prefersReducedMotion.value = motionQuery?.matches ?? false
}

const updateDataPreference = () => {
  prefersDataSaving.value = Boolean(networkConnection?.saveData || /2g/.test(networkConnection?.effectiveType ?? ''))
}

watch(videoSource, () => {
  isReady.value = false
  hasError.value = false
})

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  networkConnection = navigator.connection
  updateMotionPreference()
  updateDataPreference()
  motionQuery.addEventListener?.('change', updateMotionPreference)
  networkConnection?.addEventListener?.('change', updateDataPreference)
})

onBeforeUnmount(() => {
  motionQuery?.removeEventListener?.('change', updateMotionPreference)
  networkConnection?.removeEventListener?.('change', updateDataPreference)
})
</script>

<template>
  <div class="weather-background-video" aria-hidden="true">
    <video
      v-if="shouldPlayVideo"
      :key="videoSource"
      :class="{ 'is-ready': isReady }"
      :src="videoSource"
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      tabindex="-1"
      @canplay="isReady = true"
      @error="hasError = true"
    ></video>
  </div>
</template>

<style scoped>
.weather-background-video {
  position: absolute;
  z-index: -3;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.weather-background-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  filter: saturate(0.72) contrast(0.92);
  transform: scale(1.025);
  transition: opacity 700ms ease;
}

.weather-background-video video.is-ready {
  opacity: 0.32;
}

@media (max-width: 560px) {
  .weather-background-video video.is-ready {
    opacity: 0.26;
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-background-video {
    display: none;
  }
}
</style>
