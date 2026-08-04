import { getWeatherCategory, isNightObservation } from './weatherTheme.js'

const isConditionId = (value) => typeof value === 'number' && Number.isFinite(value)

const getVideoKeyFromConditionId = (conditionId, weather) => {
  if (!isConditionId(conditionId)) return null

  if (conditionId >= 200 && conditionId <= 232) return 'thunderstorm'
  if (conditionId >= 300 && conditionId <= 321) return 'drizzle'
  if (conditionId === 500 || conditionId === 501 || conditionId === 520) return 'rain'
  if ((conditionId >= 502 && conditionId <= 504) || (conditionId >= 521 && conditionId <= 531)) return 'heavy-rain'
  if (conditionId === 511 || (conditionId >= 600 && conditionId <= 622)) return 'snow'
  if (conditionId >= 701 && conditionId <= 762) return 'fog'
  if (conditionId === 771 || conditionId === 781) return 'thunderstorm'
  if (conditionId === 800) return isNightObservation(weather) ? 'clear-night' : 'clear-day'
  if (conditionId === 801 || conditionId === 802) return 'few-clouds'
  if (conditionId === 803 || conditionId === 804) return 'overcast'

  return null
}

const FALLBACK_VIDEO_KEY_BY_CATEGORY = Object.freeze({
  clear: 'clear-day',
  clouds: 'overcast',
  rain: 'rain',
  snow: 'snow',
  mist: 'fog',
  thunderstorm: 'thunderstorm',
})

export const getWeatherVideoKey = (weather) => {
  if (!weather || typeof weather !== 'object') return ''

  const conditionVideoKey = getVideoKeyFromConditionId(weather.conditionId, weather)
  if (conditionVideoKey) return conditionVideoKey

  const category = getWeatherCategory(weather)
  if (category === 'clear' && isNightObservation(weather)) return 'clear-night'

  return FALLBACK_VIDEO_KEY_BY_CATEGORY[category] ?? ''
}
