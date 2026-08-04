import { ref } from 'vue'

import { getGeolocationErrorMessage, getGeolocationPermissionState, requestCurrentCoordinates } from '@/services/geolocation'

const LOCATION_PROMPT_SESSION_KEY = 'weather-location-prompt-dismissed'

export const useCurrentLocationWeather = ({
  initializeWeather,
  loadCurrentLocation,
  onLocationLoaded,
  getPermissionState = getGeolocationPermissionState,
  requestCoordinates = requestCurrentCoordinates,
}) => {
  const locationPromptState = ref('')
  const locationPromptMessage = ref('')
  let weatherInitialization = Promise.resolve()

  const withSessionStorage = (callback) => {
    try {
      return callback(globalThis.sessionStorage)
    } catch {
      return undefined
    }
  }

  const dismissLocationPrompt = () => {
    withSessionStorage((storage) => storage.setItem(LOCATION_PROMPT_SESSION_KEY, 'true'))
    locationPromptState.value = ''
    locationPromptMessage.value = ''
  }

  const requestLocationWeather = async () => {
    if (locationPromptState.value === 'unsupported') {
      dismissLocationPrompt()
      return
    }

    locationPromptState.value = 'requesting'
    locationPromptMessage.value = ''

    try {
      await weatherInitialization
      const coordinates = await requestCoordinates()
      const currentWeather = await loadCurrentLocation(coordinates)
      if (!currentWeather) return

      locationPromptState.value = ''
      withSessionStorage((storage) => storage.removeItem(LOCATION_PROMPT_SESSION_KEY))
      await onLocationLoaded?.(currentWeather)
    } catch (error) {
      locationPromptMessage.value = getGeolocationErrorMessage(error)
      locationPromptState.value = error?.code === 1 ? 'denied' : 'error'
    }
  }

  const initializeLocationExperience = async () => {
    const permissionState = await getPermissionState()

    if (permissionState === 'granted') {
      await requestLocationWeather()
      return
    }

    if (permissionState === 'denied') {
      locationPromptState.value = 'denied'
      return
    }

    if (permissionState === 'unsupported') {
      locationPromptState.value = 'unsupported'
      return
    }

    const wasDismissed = withSessionStorage((storage) => storage.getItem(LOCATION_PROMPT_SESSION_KEY) === 'true')
    if (!wasDismissed) locationPromptState.value = 'prompt'
  }

  const startLocationExperience = () => {
    weatherInitialization = Promise.resolve(initializeWeather())
    void initializeLocationExperience()
    return weatherInitialization
  }

  return {
    dismissLocationPrompt,
    locationPromptMessage,
    locationPromptState,
    requestLocationWeather,
    startLocationExperience,
  }
}
