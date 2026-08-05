<template>
  <section class="weather-map" aria-label="날씨 지도">
    <div class="windy-categories" aria-label="날씨 지도 레이어 선택">
      <UButton
        v-for="category in windyCategories"
        :key="category.overlay"
        type="button"
        color="neutral"
        :variant="selectedOverlay === category.overlay ? 'soft' : 'outline'"
        size="xs"
        @click="selectedOverlay = category.overlay">
        {{ category.label }}
      </UButton>
    </div>

    <iframe
      :key="selectedOverlay"
      class="weather-map-frame"
      title="Weather Map"
      :src="windyEmbedUrl"
      frameborder="0"
      scrolling="no"
      style="pointer-events: none;">
    </iframe>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const windyCategories = [
  { label: '기온', overlay: 'temp' },
  { label: '강수', overlay: 'rain' },
  { label: '구름', overlay: 'clouds' },
  { label: '기압', overlay: 'pressure' },
  { label: '바람', overlay: 'wind' },
  { label: '레이더', overlay: 'radar' },
  { label: 'UV 지수', overlay: 'uvindex' },
]

const selectedOverlay = ref('temp')

const windyEmbedUrl = computed(() =>
  `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=m/s&zoom=7&overlay=${selectedOverlay.value}&product=ecmwf&level=surface&lat=36.385&lon=127.979&pressure=true&message=true`,
)
</script>

<style scoped>
.windy-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 15px;
}

.weather-map-frame {
  display: block;
  width: 100%;
  height: clamp(320px, 75vw, 450px);
  margin-top: 15px;
  border: 0;
  border-radius: 8px;
}
</style>
