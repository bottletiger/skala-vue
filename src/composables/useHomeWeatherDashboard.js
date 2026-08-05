import { computed, onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { CITY_CONFIG } from '@/data/cities'
import { CURRENT_LOCATION_ID } from '@/services/geolocation'
import { fetchCityWeather, fetchWeatherList } from '@/services/weatherApi'
import { getWeatherRequestErrorMessage } from '@/services/weatherErrors'
import { CURRENT_LOCATION_CACHE_TTL, HOME_WEATHER_CACHE_TTL, useHomeWeatherStore } from '@/stores/homeWeatherStore'
import { formatKoreanSelectionMessage } from '@/utils/koreanGrammar'

export const useHomeWeatherDashboard = (getRouteSelectedCityId) => {
  const homeWeatherStore = useHomeWeatherStore()
  const { weatherList, selectedCityId, lastUpdated, isWorldDrawerOpen } = storeToRefs(homeWeatherStore)
  const selectedCityInfo = ref('도시 카드를 선택해 보세요.')
  const isLoading = ref(false)
  const isWorldLoading = ref(false)
  const errorMessage = ref('')
  const worldErrorMessage = ref('')
  const failedCityCount = ref(0)
  let requestId = 0
  let worldLoadPromise = null

  const selectedWeather = computed(() => {
    return weatherList.value.find((item) => item.id === selectedCityId.value) ?? null
  })

  const updateLastUpdated = () => {
    lastUpdated.value = new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())
  }

  const upsertWeather = (weather) => {
    const existingIndex = weatherList.value.findIndex((city) => city.id === weather.id)
    if (existingIndex < 0) {
      weatherList.value = [weather, ...weatherList.value]
      return
    }

    const nextWeatherList = [...weatherList.value]
    nextWeatherList[existingIndex] = weather
    weatherList.value = nextWeatherList
  }

  const restoreCachedWeather = () => {
    const routeSelectedCityId = getRouteSelectedCityId()
    const cachedSelection = weatherList.value.find((item) => item.id === routeSelectedCityId) ?? weatherList.value.find((item) => item.id === selectedCityId.value) ?? weatherList.value[0] ?? null

    selectedCityId.value = cachedSelection?.id ?? ''
    selectedCityInfo.value = cachedSelection ? `${cachedSelection.name} 날씨를 다시 표시했습니다.` : '표시할 도시가 없습니다.'
    failedCityCount.value = 0
    errorMessage.value = ''
    isLoading.value = false
  }

  const loadWeather = async ({ onSuccess, onError } = {}) => {
    const activeRequestId = ++requestId
    const routeSelectedCityId = getRouteSelectedCityId()
    const requestedCityId = routeSelectedCityId || selectedCityId.value
    const cachedRequestedCity = weatherList.value.find((city) => city.id === requestedCityId)
    const cityConfig = CITY_CONFIG.find((city) => city.id === requestedCityId) ?? cachedRequestedCity ?? CITY_CONFIG[0]

    isLoading.value = true
    errorMessage.value = ''
    selectedCityInfo.value = '날씨 데이터를 갱신하는 중입니다.'

    try {
      const nextWeather = await fetchCityWeather(cityConfig)
      if (activeRequestId !== requestId) return

      upsertWeather(nextWeather)
      selectedCityId.value = nextWeather.id
      selectedCityInfo.value = `${nextWeather.name} 날씨를 표시하고 있습니다.`
      updateLastUpdated()
      homeWeatherStore.markCityWeatherLoaded(nextWeather.id)
      onSuccess?.()
      return nextWeather
    } catch (error) {
      if (activeRequestId !== requestId) return

      errorMessage.value = getWeatherRequestErrorMessage(error, '날씨 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      selectedCityInfo.value = selectedWeather.value ? `${selectedWeather.value.name}의 이전 관측값을 유지하고 있습니다.` : '날씨 데이터를 표시할 수 없습니다.'
      onError?.()
    } finally {
      if (activeRequestId === requestId) isLoading.value = false
    }
  }

  const loadWorldWeather = ({ force = false } = {}) => {
    if (!force && homeWeatherStore.hasFreshWeather()) {
      worldErrorMessage.value = ''
      failedCityCount.value = 0
      return Promise.resolve(weatherList.value.filter((city) => !city.isCurrentLocation))
    }
    if (worldLoadPromise) return worldLoadPromise

    isWorldLoading.value = true
    worldErrorMessage.value = ''
    failedCityCount.value = 0

    worldLoadPromise = fetchWeatherList(CITY_CONFIG, undefined, ({ failedCount }) => {
      failedCityCount.value = failedCount
    })
      .then((worldWeather) => {
        const currentLocation = weatherList.value.find((city) => city.isCurrentLocation)
        weatherList.value = currentLocation ? [currentLocation, ...worldWeather] : worldWeather
        if (!weatherList.value.some((city) => city.id === selectedCityId.value)) {
          selectedCityId.value = worldWeather[0]?.id ?? currentLocation?.id ?? ''
        }
        const loadedAt = Date.now()
        homeWeatherStore.persistWorldWeather(worldWeather, loadedAt)
        updateLastUpdated()
        return worldWeather
      })
      .catch((error) => {
        worldErrorMessage.value = getWeatherRequestErrorMessage(error, '세계 날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return []
      })
      .finally(() => {
        isWorldLoading.value = false
        worldLoadPromise = null
      })

    return worldLoadPromise
  }

  const initializeWeather = () => {
    const routeSelectedCityId = getRouteSelectedCityId()
    const cachedSelection = weatherList.value.find((item) => item.id === routeSelectedCityId) ?? weatherList.value.find((item) => item.id === selectedCityId.value) ?? weatherList.value.find((item) => !item.isCurrentLocation)
    const cacheTtl = cachedSelection?.isCurrentLocation ? CURRENT_LOCATION_CACHE_TTL : HOME_WEATHER_CACHE_TTL

    if (cachedSelection && homeWeatherStore.hasFreshCityWeather(cachedSelection.id, Date.now(), cacheTtl)) {
      restoreCachedWeather()
      return Promise.resolve()
    }
    return loadWeather()
  }

  const loadCurrentLocation = async ({ latitude, longitude }) => {
    const cachedLocation = weatherList.value.find((city) => city.isCurrentLocation)
    const isSameArea = cachedLocation && Math.abs(cachedLocation.latitude - latitude) < 0.01 && Math.abs(cachedLocation.longitude - longitude) < 0.01
    if (isSameArea && homeWeatherStore.hasFreshCityWeather(CURRENT_LOCATION_ID, Date.now(), CURRENT_LOCATION_CACHE_TTL)) {
      selectedCityId.value = CURRENT_LOCATION_ID
      selectedCityInfo.value = `${cachedLocation.name} 현재 위치 날씨를 다시 표시했습니다.`
      return cachedLocation
    }

    const activeRequestId = ++requestId
    const locationConfig = {
      id: CURRENT_LOCATION_ID,
      name: '현재 위치',
      fullName: '내 위치',
      countryCode: '',
      countryName: '현재 위치',
      region: 'current',
      latitude,
      longitude,
      isCurrentLocation: true,
    }

    isLoading.value = true
    errorMessage.value = ''
    selectedCityInfo.value = '현재 위치의 날씨를 확인하고 있습니다.'

    try {
      const currentWeather = await fetchCityWeather(locationConfig)
      if (activeRequestId !== requestId) return null

      upsertWeather(currentWeather)
      selectedCityId.value = CURRENT_LOCATION_ID
      selectedCityInfo.value = `${currentWeather.name} 현재 위치 날씨를 표시하고 있습니다.`
      updateLastUpdated()
      homeWeatherStore.markCityWeatherLoaded(CURRENT_LOCATION_ID)
      return currentWeather
    } finally {
      if (activeRequestId === requestId) isLoading.value = false
    }
  }

  const selectCity = (city) => {
    selectedCityId.value = city.id
    selectedCityInfo.value = formatKoreanSelectionMessage(city.displayName || city.name, city.name)
  }

  onBeforeUnmount(() => {
    requestId += 1
  })

  return {
    errorMessage,
    failedCityCount,
    initializeWeather,
    isWorldDrawerOpen,
    isLoading,
    isWorldLoading,
    lastUpdated,
    loadCurrentLocation,
    loadWeather,
    loadWorldWeather,
    selectedCityId,
    selectedCityInfo,
    selectedWeather,
    selectCity,
    weatherList,
    worldErrorMessage,
  }
}
