import axios from 'axios'

const API_URL = 'https://api.openweathermap.org/data/2.5/weather'

const finiteNumberOrNull = (value) => (Number.isFinite(value) ? value : null)
const nonEmptyStringOrNull = (value) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

const getWeatherApiKey = () => import.meta.env?.VITE_OPENWEATHER_API_KEY

export class MissingWeatherApiKeyError extends Error {
  constructor() {
    super('OpenWeatherMap API 키가 설정되지 않았습니다.')
    this.name = 'MissingWeatherApiKeyError'
  }
}

export const hasWeatherApiKey = () => {
  const key = getWeatherApiKey()
  return Boolean(key && key !== 'replace_with_your_key')
}

export const mapWeatherResponse = (city, payload = {}) => {
  const currentCondition = payload?.weather?.[0]

  return {
    ...city,
    temp: finiteNumberOrNull(payload?.main?.temp),
    feelsLike: finiteNumberOrNull(payload?.main?.feels_like),
    humidity: finiteNumberOrNull(payload?.main?.humidity),
    pressure: finiteNumberOrNull(payload?.main?.pressure),
    visibility: finiteNumberOrNull(payload?.visibility),
    wind: finiteNumberOrNull(payload?.wind?.speed),
    observedAt: finiteNumberOrNull(payload?.dt),
    sunrise: finiteNumberOrNull(payload?.sys?.sunrise),
    sunset: finiteNumberOrNull(payload?.sys?.sunset),
    timezoneOffset: finiteNumberOrNull(payload?.timezone),
    condition: nonEmptyStringOrNull(currentCondition?.main),
    conditionId: finiteNumberOrNull(currentCondition?.id),
    iconCode: nonEmptyStringOrNull(currentCondition?.icon),
    status: nonEmptyStringOrNull(currentCondition?.description),
  }
}

export const fetchCityWeather = async (city) => {
  if (!hasWeatherApiKey()) {
    throw new MissingWeatherApiKeyError()
  }

  const response = await axios.get(API_URL, {
    params: {
      lat: city.latitude,
      lon: city.longitude,
      appid: getWeatherApiKey(),
      units: 'metric',
      lang: 'kr',
    },
    timeout: 8000,
  })

  return mapWeatherResponse(city, response.data)
}

export const fetchWeatherList = async (cities, fetchWeather = fetchCityWeather, onComplete) => {
  const results = await Promise.allSettled(cities.map(fetchWeather))
  const successfulCities = results.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  const failedCount = results.length - successfulCities.length

  onComplete?.({ failedCount, totalCount: results.length })

  if (successfulCities.length || results.length === 0) return successfulCities

  throw results[0].reason
}
