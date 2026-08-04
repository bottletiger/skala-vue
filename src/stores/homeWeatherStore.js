import { ref } from 'vue'
import { defineStore } from 'pinia'

export const HOME_WEATHER_CACHE_TTL = 5 * 60 * 1000

export const useHomeWeatherStore = defineStore('home-weather', () => {
  const weatherList = ref([])
  const selectedCityId = ref('')
  const lastUpdated = ref('')
  const weatherLoadedAt = ref(0)
  const isWorldDrawerOpen = ref(false)

  const hasFreshWeather = (now = Date.now()) => {
    const cacheAge = now - weatherLoadedAt.value
    return weatherList.value.length > 0 && cacheAge >= 0 && cacheAge <= HOME_WEATHER_CACHE_TTL
  }

  const markWeatherLoaded = (loadedAt = Date.now()) => {
    weatherLoadedAt.value = loadedAt
  }

  const clearWeatherData = () => {
    weatherList.value = []
    selectedCityId.value = ''
    lastUpdated.value = ''
    weatherLoadedAt.value = 0
  }

  return {
    weatherList,
    selectedCityId,
    lastUpdated,
    weatherLoadedAt,
    isWorldDrawerOpen,
    hasFreshWeather,
    markWeatherLoaded,
    clearWeatherData,
  }
})
