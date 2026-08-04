import { computed, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'

import { useHomeWeatherStore } from '@/stores/homeWeatherStore'
import { getWeatherTheme } from '@/utils/weatherTheme'

const activeSceneTheme = shallowRef(null)
let activeSceneOwner = null

export const setActiveSceneWeatherTheme = (theme, owner) => {
  activeSceneOwner = owner
  activeSceneTheme.value = theme
}

export const clearActiveSceneWeatherTheme = (owner) => {
  if (activeSceneOwner !== owner) return
  activeSceneOwner = null
  activeSceneTheme.value = null
}

export const useSharedWeatherTheme = () => {
  const homeWeatherStore = useHomeWeatherStore()
  const { selectedCityId, weatherList } = storeToRefs(homeWeatherStore)

  const selectedWeather = computed(() => {
    return weatherList.value.find((weather) => weather.id === selectedCityId.value) ?? null
  })

  const weatherTheme = computed(() => activeSceneTheme.value ?? getWeatherTheme(selectedWeather.value))

  return {
    selectedWeather,
    weatherTheme,
  }
}
