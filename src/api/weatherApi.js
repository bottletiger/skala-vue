import axios from 'axios'
import { cities } from '@/data/cities'

const CACHE_KEY = 'weather-list'
const CACHE_DURATION = 60 * 60 * 1000
const FORECAST_CACHE_PREFIX = 'weekly-forecast'

const getCachedWeather = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))

    if (!cached) return null

    const isValid = Date.now() - cached.savedAt < CACHE_DURATION

    if (isValid) return cached.weatherList

    localStorage.removeItem(CACHE_KEY)
    return null
  } catch {
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}

export const getWeatherList = async () => {
  const cachedWeather = getCachedWeather()

  if (cachedWeather) {
    return cachedWeather
  }

  const weatherList = await Promise.all(
    cities.map(async (city) => {
      const { data } = await axios.get(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            q: `${city.name},KR`,
            appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
            units: 'metric',
            lang: 'kr',
          },
        },
      )

      return {
        ...city,
        temp: Math.round(data.main.temp),
        status: data.weather[0].description,
        main: data.main,
        visibility: data.visibility,
        wind: data.wind,
        clouds: data.clouds,
        detail: data,
      }
    }),
  )

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      weatherList,
    }),
  )

  return weatherList
}

const getForecastCacheKey = (cityId) =>
  `${FORECAST_CACHE_PREFIX}-${cityId}`

const getCachedForecast = (cityId) => {
  const cacheKey = getForecastCacheKey(cityId)

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey))

    if (!cached) return null

    const isValid = Date.now() - cached.savedAt < CACHE_DURATION

    if (isValid) return cached.forecast

    localStorage.removeItem(cacheKey)
    return null
  } catch {
    localStorage.removeItem(cacheKey)
    return null
  }
}

export const getWeeklyForecast = async ({ cityId, latitude, longitude }) => {
  const cachedForecast = getCachedForecast(cityId)

  if (cachedForecast) {
    return cachedForecast
  }

  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude,
      longitude,
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
      ].join(','),
      timezone: 'auto',
      forecast_days: 7,
      temperature_unit: 'celsius',
    },
  })

  const forecast = data.daily.time.map((date, index) => ({
    date,
    weatherCode: data.daily.weather_code[index],
    tempMax: data.daily.temperature_2m_max[index],
    tempMin: data.daily.temperature_2m_min[index],
    precipitationProbability:
      data.daily.precipitation_probability_max[index] ?? 0,
  }))

  localStorage.setItem(
    getForecastCacheKey(cityId),
    JSON.stringify({
      savedAt: Date.now(),
      forecast,
    }),
  )

  return forecast
}
