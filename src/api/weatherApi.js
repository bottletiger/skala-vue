import axios from 'axios'
import { cities } from '@/data/cities'

const CACHE_KEY = 'weather-list'
const CACHE_DURATION = 60 * 60 * 1000 // 60분

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

  // 유효한 캐시가 있으면 API를 호출하지 않음
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
