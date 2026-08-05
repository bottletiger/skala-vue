import { ref } from 'vue'
import { defineStore } from 'pinia'

export const HOME_WEATHER_CACHE_TTL = 30 * 60 * 1000
export const CURRENT_LOCATION_CACHE_TTL = 5 * 60 * 1000
export const HOME_WEATHER_CACHE_KEY = 'weather-world-cache-v1'

const getLocalStorage = () => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

const isPersistableWorldWeather = (weather) => {
  return Boolean(
    weather &&
      typeof weather.id === 'string' &&
      weather.id &&
      !weather.isCurrentLocation &&
      Number.isFinite(weather.latitude) &&
      Number.isFinite(weather.longitude) &&
      Number.isFinite(weather.observedAt),
  )
}

const removePersistedWorldWeather = () => {
  try {
    getLocalStorage()?.removeItem(HOME_WEATHER_CACHE_KEY)
  } catch {
    // Storage can be unavailable in private browsing or a restricted iframe.
  }
}

const readPersistedWorldWeather = (now = Date.now()) => {
  try {
    const serialized = getLocalStorage()?.getItem(HOME_WEATHER_CACHE_KEY)
    if (!serialized) return { weatherList: [], loadedAt: 0 }

    const cached = JSON.parse(serialized)
    const loadedAt = Number(cached?.loadedAt)
    const cacheAge = now - loadedAt
    const weatherList = Array.isArray(cached?.weatherList) ? cached.weatherList : []
    const hasValidEntries = weatherList.length > 0 && weatherList.every(isPersistableWorldWeather)

    if (!Number.isFinite(loadedAt) || cacheAge < 0 || cacheAge > HOME_WEATHER_CACHE_TTL || !hasValidEntries) {
      removePersistedWorldWeather()
      return { weatherList: [], loadedAt: 0 }
    }

    return { weatherList, loadedAt }
  } catch {
    removePersistedWorldWeather()
    return { weatherList: [], loadedAt: 0 }
  }
}

export const useHomeWeatherStore = defineStore('home-weather', () => {
  const persistedWeather = readPersistedWorldWeather()
  const weatherList = ref(persistedWeather.weatherList)
  const selectedCityId = ref('')
  const lastUpdated = ref('')
  const weatherLoadedAt = ref(persistedWeather.loadedAt)
  const weatherFetchedAtByCity = ref(
    Object.fromEntries(persistedWeather.weatherList.map((weather) => [weather.id, persistedWeather.loadedAt])),
  )
  const isWorldDrawerOpen = ref(false)
  const isRecommendationDrawerOpen = ref(false)

  const hasFreshWeather = (now = Date.now()) => {
    const cacheAge = now - weatherLoadedAt.value
    return weatherList.value.some((weather) => !weather.isCurrentLocation) && cacheAge >= 0 && cacheAge <= HOME_WEATHER_CACHE_TTL
  }

  const hasFreshCityWeather = (cityId, now = Date.now(), ttl = HOME_WEATHER_CACHE_TTL) => {
    const loadedAt = weatherFetchedAtByCity.value[cityId]
    const cacheAge = now - loadedAt
    return Boolean(weatherList.value.some((weather) => weather.id === cityId) && Number.isFinite(loadedAt) && cacheAge >= 0 && cacheAge <= ttl)
  }

  const markCityWeatherLoaded = (cityId, loadedAt = Date.now()) => {
    if (!cityId || !Number.isFinite(loadedAt)) return
    weatherFetchedAtByCity.value = { ...weatherFetchedAtByCity.value, [cityId]: loadedAt }
  }

  const persistWorldWeather = (worldWeather, loadedAt = Date.now()) => {
    if (!Array.isArray(worldWeather) || !worldWeather.length || !worldWeather.every(isPersistableWorldWeather) || !Number.isFinite(loadedAt)) return false

    try {
      getLocalStorage()?.setItem(
        HOME_WEATHER_CACHE_KEY,
        JSON.stringify({
          loadedAt,
          weatherList: worldWeather,
        }),
      )
    } catch {
      return false
    }

    weatherLoadedAt.value = loadedAt
    for (const weather of worldWeather) markCityWeatherLoaded(weather.id, loadedAt)
    return true
  }

  const clearWeatherData = () => {
    weatherList.value = []
    selectedCityId.value = ''
    lastUpdated.value = ''
    weatherLoadedAt.value = 0
    weatherFetchedAtByCity.value = {}
    removePersistedWorldWeather()
  }

  return {
    weatherList,
    selectedCityId,
    lastUpdated,
    weatherLoadedAt,
    isWorldDrawerOpen,
    isRecommendationDrawerOpen,
    hasFreshWeather,
    hasFreshCityWeather,
    markCityWeatherLoaded,
    persistWorldWeather,
    clearWeatherData,
  }
})
