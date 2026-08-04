import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useHomeWeatherStore } from '@/stores/homeWeatherStore'
import { getWeatherTheme } from '@/utils/weatherTheme'

export const useSharedWeatherTheme = () => {
  const homeWeatherStore = useHomeWeatherStore()
  const { selectedCityId, weatherList } = storeToRefs(homeWeatherStore)

  const selectedWeather = computed(() => {
    return weatherList.value.find((weather) => weather.id === selectedCityId.value) ?? null
  })

  const weatherTheme = computed(() => getWeatherTheme(selectedWeather.value))

  return {
    selectedWeather,
    weatherTheme,
  }
}
