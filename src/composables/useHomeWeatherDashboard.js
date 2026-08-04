import { computed, onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { CITY_CONFIG } from '@/data/cities'
import { fetchWeatherList, hasWeatherApiKey } from '@/services/weatherApi'
import { getWeatherRequestErrorMessage, HOME_MISSING_WEATHER_API_KEY_MESSAGE } from '@/services/weatherErrors'
import { useHomeWeatherStore } from '@/stores/homeWeatherStore'

export const useHomeWeatherDashboard = (getRouteSelectedCityId) => {
  const apiReady = hasWeatherApiKey()
  const homeWeatherStore = useHomeWeatherStore()
  const { weatherList, selectedCityId, lastUpdated, isCityListOpen } = storeToRefs(homeWeatherStore)
  const selectedCityInfo = ref(apiReady ? '도시 카드를 선택해 보세요.' : '날씨 데이터를 표시할 수 없습니다.')
  const isLoading = ref(apiReady && !homeWeatherStore.hasFreshWeather())
  const errorMessage = ref(apiReady ? '' : HOME_MISSING_WEATHER_API_KEY_MESSAGE)
  const failedCityCount = ref(0)
  let requestId = 0

  const selectedWeather = computed(() => {
    return weatherList.value.find((item) => item.id === selectedCityId.value) ?? null
  })

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
    const previousSelectedCityId = routeSelectedCityId || selectedCityId.value

    if (!apiReady) {
      homeWeatherStore.clearWeatherData()
      failedCityCount.value = 0
      errorMessage.value = HOME_MISSING_WEATHER_API_KEY_MESSAGE
      selectedCityInfo.value = '날씨 데이터를 표시할 수 없습니다.'
      isLoading.value = false
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    failedCityCount.value = 0
    selectedCityInfo.value = '날씨 데이터를 갱신하는 중입니다.'

    try {
      const nextWeatherList = await fetchWeatherList(CITY_CONFIG, undefined, ({ failedCount }) => {
        if (activeRequestId === requestId) failedCityCount.value = failedCount
      })
      if (activeRequestId !== requestId) return

      weatherList.value = nextWeatherList
      const nextSelectedWeather = nextWeatherList.find((item) => item.id === previousSelectedCityId) ?? nextWeatherList[0] ?? null
      selectedCityId.value = nextSelectedWeather?.id ?? ''
      selectedCityInfo.value = nextSelectedWeather ? `${nextSelectedWeather.name} 날씨를 표시하고 있습니다.` : '표시할 도시가 없습니다.'
      lastUpdated.value = new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date())
      homeWeatherStore.markWeatherLoaded()
      onSuccess?.()
    } catch (error) {
      if (activeRequestId !== requestId) return

      homeWeatherStore.clearWeatherData()
      failedCityCount.value = 0
      errorMessage.value = getWeatherRequestErrorMessage(error, '날씨 데이터를 불러오지 못했습니다. 네트워크와 API 사용량을 확인해 주세요.', HOME_MISSING_WEATHER_API_KEY_MESSAGE)
      selectedCityInfo.value = '날씨 데이터를 표시할 수 없습니다.'
      onError?.()
    } finally {
      if (activeRequestId === requestId) isLoading.value = false
    }
  }

  const initializeWeather = () => {
    if (apiReady && homeWeatherStore.hasFreshWeather()) {
      restoreCachedWeather()
      return
    }
    void loadWeather()
  }

  const selectCity = (city) => {
    selectedCityId.value = city.id
    selectedCityInfo.value = `${city.name}이 선택되었습니다.`
  }

  onBeforeUnmount(() => {
    requestId += 1
  })

  return {
    apiReady,
    errorMessage,
    failedCityCount,
    initializeWeather,
    isCityListOpen,
    isLoading,
    lastUpdated,
    loadWeather,
    selectedCityId,
    selectedCityInfo,
    selectedWeather,
    selectCity,
    weatherList,
  }
}
