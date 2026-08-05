import { computed, onBeforeUnmount, ref, toValue, watch } from 'vue'

import { findCityConfig } from '@/data/cities'
import { fetchCityForecast, fetchCityWeather } from '@/services/weatherApi'
import { getWeatherRequestErrorMessage } from '@/services/weatherErrors'
import { useHomeWeatherStore } from '@/stores/homeWeatherStore'
import { getWeatherTheme } from '@/utils/weatherTheme'

export const useCityWeatherDetail = (cityIdSource, redirectUnknownCity) => {
  const homeWeatherStore = useHomeWeatherStore()
  const resolveCityConfig = (cityId) => findCityConfig(cityId) ?? homeWeatherStore.weatherList.find((city) => city.id === cityId && city.isCurrentLocation)
  const cityConfig = computed(() => resolveCityConfig(toValue(cityIdSource)))
  const cityData = ref(null)
  const forecastData = ref(null)
  const isLoading = ref(true)
  const isForecastLoading = ref(true)
  const errorMessage = ref('')
  const forecastErrorMessage = ref('')
  let requestId = 0

  const weatherTheme = computed(() => {
    const firstForecast = forecastData.value?.hourly?.[0]
    return getWeatherTheme(
      cityData.value ?? {
        condition: firstForecast?.weatherMain,
        conditionId: firstForecast?.weatherId,
        iconCode: firstForecast?.icon,
      },
    )
  })

  const forecastTimezoneOffset = computed(() => {
    return forecastData.value?.timezoneOffset ?? cityData.value?.timezoneOffset ?? 0
  })

  const detailStatusMessage = computed(() => {
    if (isLoading.value) return '상세 날씨를 불러오는 중입니다.'
    if (errorMessage.value) return errorMessage.value
    if (cityData.value) return `${cityData.value.name} 상세 날씨를 표시했습니다.`
    return '수신된 상세 날씨 데이터가 없습니다.'
  })

  const forecastStatusMessage = computed(() => {
    if (isForecastLoading.value) return '시간대별 및 5일 예보를 불러오는 중입니다.'
    if (forecastErrorMessage.value) return forecastErrorMessage.value
    if (forecastData.value?.hourly?.length || forecastData.value?.daily?.length) {
      return '시간대별 및 5일 예보를 표시했습니다.'
    }
    return '수신된 예보 데이터가 없습니다.'
  })

  const syncSelectedWeather = (weather) => {
    const existingIndex = homeWeatherStore.weatherList.findIndex((item) => item.id === weather.id)
    if (existingIndex < 0) {
      homeWeatherStore.weatherList = [weather, ...homeWeatherStore.weatherList]
    } else {
      const nextWeatherList = [...homeWeatherStore.weatherList]
      nextWeatherList[existingIndex] = weather
      homeWeatherStore.weatherList = nextWeatherList
    }
    homeWeatherStore.selectedCityId = weather.id
  }

  const loadDetail = async (city) => {
    const activeRequestId = ++requestId

    cityData.value = null
    forecastData.value = null
    errorMessage.value = ''
    forecastErrorMessage.value = ''

    if (!city) {
      isLoading.value = true
      isForecastLoading.value = false
      try {
        await redirectUnknownCity?.()
      } catch {
        if (activeRequestId !== requestId) return
        errorMessage.value = '요청한 도시를 찾을 수 없고 오류 안내 화면으로 이동하지 못했습니다.'
        isLoading.value = false
      }
      return
    }

    isLoading.value = true
    isForecastLoading.value = true

    const currentWeatherRequest = fetchCityWeather(city)
      .then((nextCityData) => {
        if (activeRequestId === requestId) {
          cityData.value = nextCityData
          syncSelectedWeather(nextCityData)
        }
      })
      .catch((error) => {
        if (activeRequestId === requestId) {
          errorMessage.value = getWeatherRequestErrorMessage(error, '상세 날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        }
      })
      .finally(() => {
        if (activeRequestId === requestId) isLoading.value = false
      })

    const forecastRequest = fetchCityForecast(city)
      .then((nextForecastData) => {
        if (activeRequestId === requestId) forecastData.value = nextForecastData
      })
      .catch((error) => {
        if (activeRequestId === requestId) {
          forecastErrorMessage.value = getWeatherRequestErrorMessage(error, '예보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        }
      })
      .finally(() => {
        if (activeRequestId === requestId) isForecastLoading.value = false
      })

    await Promise.allSettled([currentWeatherRequest, forecastRequest])
  }

  const refreshDetail = () => loadDetail(cityConfig.value)

  watch(
    () => toValue(cityIdSource),
    (cityId) => void loadDetail(resolveCityConfig(cityId)),
    { immediate: true },
  )

  onBeforeUnmount(() => {
    requestId += 1
  })

  return {
    cityConfig,
    cityData,
    detailStatusMessage,
    errorMessage,
    forecastData,
    forecastErrorMessage,
    forecastStatusMessage,
    forecastTimezoneOffset,
    isForecastLoading,
    isLoading,
    refreshDetail,
    weatherTheme,
  }
}
