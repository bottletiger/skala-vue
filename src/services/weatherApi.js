import axios from 'axios'

const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast'
const REVERSE_GEOCODING_API_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'
const REQUEST_TIMEOUT = 8000
const FORECAST_ITEM_LIMIT = 8
const DAILY_FORECAST_LIMIT = 5
const MAX_FORECAST_DAYS = 16
const FORECAST_INTERVAL_HOURS = 3
const WEATHER_BATCH_SIZE = 50
const weatherBatchRequests = new Map()
let forecastDailyLimitExceeded = false

export const WEATHER_LIST_CONCURRENCY = 6

const DAILY_LIMIT_REASON = 'Daily API request limit exceeded'

const createDailyLimitError = () => {
  const error = new Error(DAILY_LIMIT_REASON)
  error.code = 'OPEN_METEO_DAILY_LIMIT'
  error.response = {
    status: 429,
    data: { error: true, reason: `${DAILY_LIMIT_REASON}. Please try again tomorrow.` },
  }
  return error
}

const requestForecast = async (config) => {
  if (forecastDailyLimitExceeded) throw createDailyLimitError()

  try {
    return await axios.get(FORECAST_API_URL, config)
  } catch (error) {
    const reason = String(error?.response?.data?.reason || '')
    if (error?.response?.status === 429 && reason.includes(DAILY_LIMIT_REASON)) forecastDailyLimitExceeded = true
    throw error
  }
}

const CURRENT_VARIABLES = ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day', 'weather_code', 'surface_pressure', 'wind_speed_10m']
const FORECAST_HOURLY_VARIABLES = ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation_probability', 'weather_code', 'rain', 'snowfall', 'wind_speed_10m', 'is_day']
const FORECAST_DAILY_VARIABLES = ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max']

const WMO_WEATHER = Object.freeze({
  0: { conditionId: 800, condition: 'Clear', status: '맑음', icon: '01' },
  1: { conditionId: 801, condition: 'Clouds', status: '대체로 맑음', icon: '02' },
  2: { conditionId: 802, condition: 'Clouds', status: '구름 조금', icon: '03' },
  3: { conditionId: 804, condition: 'Clouds', status: '흐림', icon: '04' },
  45: { conditionId: 741, condition: 'Mist', status: '안개', icon: '50' },
  48: { conditionId: 741, condition: 'Mist', status: '서리 안개', icon: '50' },
  51: { conditionId: 300, condition: 'Drizzle', status: '약한 이슬비', icon: '09' },
  53: { conditionId: 301, condition: 'Drizzle', status: '이슬비', icon: '09' },
  55: { conditionId: 302, condition: 'Drizzle', status: '강한 이슬비', icon: '09' },
  56: { conditionId: 311, condition: 'Drizzle', status: '약한 어는 이슬비', icon: '09' },
  57: { conditionId: 312, condition: 'Drizzle', status: '강한 어는 이슬비', icon: '09' },
  61: { conditionId: 500, condition: 'Rain', status: '약한 비', icon: '10' },
  63: { conditionId: 501, condition: 'Rain', status: '보통 비', icon: '10' },
  65: { conditionId: 502, condition: 'Rain', status: '강한 비', icon: '10' },
  66: { conditionId: 511, condition: 'Rain', status: '약한 어는 비', icon: '13' },
  67: { conditionId: 511, condition: 'Rain', status: '강한 어는 비', icon: '13' },
  71: { conditionId: 600, condition: 'Snow', status: '약한 눈', icon: '13' },
  73: { conditionId: 601, condition: 'Snow', status: '눈', icon: '13' },
  75: { conditionId: 602, condition: 'Snow', status: '강한 눈', icon: '13' },
  77: { conditionId: 615, condition: 'Snow', status: '싸락눈', icon: '13' },
  80: { conditionId: 520, condition: 'Rain', status: '약한 소나기', icon: '09' },
  81: { conditionId: 521, condition: 'Rain', status: '소나기', icon: '09' },
  82: { conditionId: 522, condition: 'Rain', status: '강한 소나기', icon: '09' },
  85: { conditionId: 620, condition: 'Snow', status: '약한 눈 소나기', icon: '13' },
  86: { conditionId: 622, condition: 'Snow', status: '강한 눈 소나기', icon: '13' },
  95: { conditionId: 211, condition: 'Thunderstorm', status: '뇌우', icon: '11' },
  96: { conditionId: 200, condition: 'Thunderstorm', status: '우박을 동반한 뇌우', icon: '11' },
  99: { conditionId: 202, condition: 'Thunderstorm', status: '강한 우박을 동반한 뇌우', icon: '11' },
})

const finiteNumberOrNull = (value) => (Number.isFinite(value) ? value : null)
const nonEmptyStringOrNull = (value) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

const getCountryName = (countryCode) => {
  if (!countryCode) return null

  try {
    return new Intl.DisplayNames(['ko'], { type: 'region' }).of(countryCode) ?? countryCode
  } catch {
    return countryCode
  }
}

const stripRomanizedKoreanSuffix = (value) => value.replace(/(?:[-\s](?:si|gun|gu|do))$/i, '').trim()
const resolveCurrentLocationName = (locationPayload, countryCode) => {
  const name = nonEmptyStringOrNull(locationPayload?.city) || nonEmptyStringOrNull(locationPayload?.locality) || nonEmptyStringOrNull(locationPayload?.principalSubdivision)
  if (!name) return null
  return countryCode === 'KR' ? stripRomanizedKoreanSuffix(name) : name
}

const formatLocalDate = (timestamp, timezoneOffset) => {
  if (!Number.isFinite(timestamp) || !Number.isFinite(timezoneOffset)) return null

  const localDate = new Date((timestamp + timezoneOffset) * 1000)
  if (Number.isNaN(localDate.getTime())) return null

  const year = localDate.getUTCFullYear()
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(localDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const arrayValue = (values, index) => (Array.isArray(values) ? values[index] : undefined)
const finiteArrayValue = (values, index) => finiteNumberOrNull(arrayValue(values, index))
const sumFiniteWindow = (values, startIndex, size) => {
  if (!Array.isArray(values)) return null
  const windowValues = values.slice(startIndex, startIndex + size).filter(Number.isFinite)
  return windowValues.length ? windowValues.reduce((sum, value) => sum + value, 0) : null
}

export const mapWmoWeatherCode = (weatherCode, isDay = true) => {
  const mapped = WMO_WEATHER[weatherCode]
  if (!mapped) {
    return { conditionId: null, condition: null, status: null, iconCode: null }
  }

  const daySuffix = isDay === false || isDay === 0 ? 'n' : 'd'
  return {
    conditionId: mapped.conditionId,
    condition: mapped.condition,
    status: mapped.status,
    iconCode: `${mapped.icon}${daySuffix}`,
  }
}

export const mapWeatherResponse = (city, payload = {}, locationPayload = {}) => {
  const current = payload?.current ?? {}
  const mappedCondition = mapWmoWeatherCode(current?.weather_code, current?.is_day)
  const resolvedCountryCode = city?.isCurrentLocation ? nonEmptyStringOrNull(locationPayload?.countryCode) : null
  const resolvedLocationName = city?.isCurrentLocation ? resolveCurrentLocationName(locationPayload, resolvedCountryCode) : null
  const resolvedCountryName = getCountryName(resolvedCountryCode)

  return {
    ...city,
    ...(resolvedLocationName
      ? {
          name: resolvedLocationName,
          displayName: resolvedLocationName.toLocaleUpperCase('en-US'),
          fullName: `내 위치 · ${resolvedLocationName}`,
        }
      : {}),
    ...(resolvedCountryCode ? { countryCode: resolvedCountryCode, countryName: resolvedCountryName } : {}),
    temp: finiteNumberOrNull(current?.temperature_2m),
    feelsLike: finiteNumberOrNull(current?.apparent_temperature),
    humidity: finiteNumberOrNull(current?.relative_humidity_2m),
    pressure: finiteNumberOrNull(current?.surface_pressure),
    visibility: finiteArrayValue(payload?.hourly?.visibility, 0),
    wind: finiteNumberOrNull(current?.wind_speed_10m),
    observedAt: finiteNumberOrNull(current?.time),
    sunrise: finiteArrayValue(payload?.daily?.sunrise, 0),
    sunset: finiteArrayValue(payload?.daily?.sunset, 0),
    timezoneOffset: finiteNumberOrNull(payload?.utc_offset_seconds),
    condition: mappedCondition.condition,
    conditionId: mappedCondition.conditionId,
    iconCode: mappedCondition.iconCode,
    status: mappedCondition.status,
  }
}

const mapHourlyForecast = (payload, timezoneOffset) => {
  const hourly = payload?.hourly ?? {}
  const timestamps = Array.isArray(hourly?.time) ? hourly.time : []
  const result = []

  for (let index = 0; index < timestamps.length && result.length < FORECAST_ITEM_LIMIT; index += FORECAST_INTERVAL_HOURS) {
    const timestamp = finiteNumberOrNull(timestamps[index])
    const mappedCondition = mapWmoWeatherCode(arrayValue(hourly?.weather_code, index), arrayValue(hourly?.is_day, index))

    result.push({
      timestamp,
      localDate: formatLocalDate(timestamp, timezoneOffset),
      temperature: finiteArrayValue(hourly?.temperature_2m, index),
      feelsLike: finiteArrayValue(hourly?.apparent_temperature, index),
      humidity: finiteArrayValue(hourly?.relative_humidity_2m, index),
      weatherId: mappedCondition.conditionId,
      weatherMain: mappedCondition.condition,
      weatherDescription: mappedCondition.status,
      icon: mappedCondition.iconCode,
      precipitationProbability: finiteArrayValue(hourly?.precipitation_probability, index),
      rainVolume: sumFiniteWindow(hourly?.rain, index, FORECAST_INTERVAL_HOURS),
      snowVolume: sumFiniteWindow(hourly?.snowfall, index, FORECAST_INTERVAL_HOURS),
      windSpeed: finiteArrayValue(hourly?.wind_speed_10m, index),
    })
  }

  return result
}

const normalizeForecastDays = (value, fallback = DAILY_FORECAST_LIMIT) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(Math.max(Math.round(number), 1), MAX_FORECAST_DAYS)
}

const mapDailyForecast = (payload, timezoneOffset, dailyLimit = DAILY_FORECAST_LIMIT) => {
  const daily = payload?.daily ?? {}
  const timestamps = Array.isArray(daily?.time) ? daily.time : []

  return timestamps.slice(0, normalizeForecastDays(dailyLimit)).map((sourceTimestamp, index) => {
    const timestamp = finiteNumberOrNull(sourceTimestamp)
    const mappedCondition = mapWmoWeatherCode(arrayValue(daily?.weather_code, index), true)

    return {
      date: formatLocalDate(timestamp, timezoneOffset),
      timestamp,
      minTemperature: finiteArrayValue(daily?.temperature_2m_min, index),
      maxTemperature: finiteArrayValue(daily?.temperature_2m_max, index),
      precipitationProbability: finiteArrayValue(daily?.precipitation_probability_max, index),
      weatherId: mappedCondition.conditionId,
      weatherMain: mappedCondition.condition,
      weatherDescription: mappedCondition.status,
      icon: mappedCondition.iconCode,
    }
  })
}

export const mapForecastResponse = (payload = {}, { dailyLimit = DAILY_FORECAST_LIMIT } = {}) => {
  const timezoneOffset = finiteNumberOrNull(payload?.utc_offset_seconds)
  const hourly = mapHourlyForecast(payload, timezoneOffset)
  const daily = timezoneOffset === null ? [] : mapDailyForecast(payload, timezoneOffset, dailyLimit)

  return { timezoneOffset, hourly, daily }
}

const getCurrentWeatherRequestOptions = (cities) => ({
  params: {
    latitude: cities.length === 1 ? cities[0].latitude : cities.map((city) => city.latitude).join(','),
    longitude: cities.length === 1 ? cities[0].longitude : cities.map((city) => city.longitude).join(','),
    current: CURRENT_VARIABLES.join(','),
    hourly: 'visibility',
    daily: 'sunrise,sunset',
    forecast_days: 1,
    forecast_hours: 1,
    timezone: 'auto',
    timeformat: 'unixtime',
    wind_speed_unit: 'ms',
  },
  timeout: REQUEST_TIMEOUT,
})

const fetchReverseLocation = (city) => {
  if (!city?.isCurrentLocation) return Promise.resolve(null)

  return axios
    .get(REVERSE_GEOCODING_API_URL, {
      params: {
        latitude: city.latitude,
        longitude: city.longitude,
        localityLanguage: 'en',
      },
      timeout: REQUEST_TIMEOUT,
    })
    .catch(() => null)
}

const fetchWeatherBatchChunk = async (cities) => {
  const [weatherResponse, ...locationResponses] = await Promise.all([requestForecast(getCurrentWeatherRequestOptions(cities)), ...cities.map(fetchReverseLocation)])
  const weatherPayloads = Array.isArray(weatherResponse?.data) ? weatherResponse.data : [weatherResponse?.data]

  if (weatherPayloads.length !== cities.length) {
    throw new Error('Open-Meteo 다중 좌표 응답 수가 요청한 도시 수와 일치하지 않습니다.')
  }

  return cities.map((city, index) => mapWeatherResponse(city, weatherPayloads[index], locationResponses[index]?.data))
}

const getWeatherBatchKey = (cities) =>
  cities
    .map((city) => [city?.id, city?.latitude, city?.longitude, Boolean(city?.isCurrentLocation)].join(':'))
    .join('|')

export const fetchWeatherBatch = (cities) => {
  if (!Array.isArray(cities) || cities.length === 0) return Promise.resolve([])

  const requestKey = getWeatherBatchKey(cities)
  const activeRequest = weatherBatchRequests.get(requestKey)
  if (activeRequest) return activeRequest

  let request
  request = (async () => {
    try {
      const chunks = []
      for (let index = 0; index < cities.length; index += WEATHER_BATCH_SIZE) {
        chunks.push(cities.slice(index, index + WEATHER_BATCH_SIZE))
      }

      const results = await Promise.all(chunks.map(fetchWeatherBatchChunk))
      return results.flat()
    } finally {
      if (weatherBatchRequests.get(requestKey) === request) weatherBatchRequests.delete(requestKey)
    }
  })()

  weatherBatchRequests.set(requestKey, request)
  return request
}

export const fetchCityWeather = async (city) => {
  const [weather] = await fetchWeatherBatch([city])
  return weather
}

export const fetchCityForecast = async (city, { forecastDays = DAILY_FORECAST_LIMIT, signal } = {}) => {
  const normalizedForecastDays = normalizeForecastDays(forecastDays)
  const response = await requestForecast({
    params: {
      latitude: city.latitude,
      longitude: city.longitude,
      hourly: FORECAST_HOURLY_VARIABLES.join(','),
      daily: FORECAST_DAILY_VARIABLES.join(','),
      forecast_days: normalizedForecastDays,
      forecast_hours: FORECAST_ITEM_LIMIT * FORECAST_INTERVAL_HOURS,
      timezone: 'auto',
      timeformat: 'unixtime',
      wind_speed_unit: 'ms',
    },
    timeout: REQUEST_TIMEOUT,
    signal,
  })

  return mapForecastResponse(response.data, { dailyLimit: normalizedForecastDays })
}

export const fetchWeatherList = async (cities, fetchWeather = fetchCityWeather, onComplete) => {
  if (fetchWeather === fetchCityWeather && cities.length > 1) {
    try {
      const weatherList = await fetchWeatherBatch(cities)
      onComplete?.({ failedCount: 0, totalCount: cities.length })
      return weatherList
    } catch (reason) {
      onComplete?.({ failedCount: cities.length, totalCount: cities.length })
      throw reason
    }
  }

  const results = Array.from({ length: cities.length })
  let nextCityIndex = 0

  const runWorker = async () => {
    while (nextCityIndex < cities.length) {
      const cityIndex = nextCityIndex
      nextCityIndex += 1

      try {
        results[cityIndex] = { status: 'fulfilled', value: await fetchWeather(cities[cityIndex]) }
      } catch (reason) {
        results[cityIndex] = { status: 'rejected', reason }
      }
    }
  }

  const workerCount = Math.min(WEATHER_LIST_CONCURRENCY, cities.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))
  const successfulCities = results.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  const failedCount = results.length - successfulCities.length

  onComplete?.({ failedCount, totalCount: results.length })

  if (successfulCities.length || results.length === 0) return successfulCities

  throw results[0].reason
}
