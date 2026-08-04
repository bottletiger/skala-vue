import axios from 'axios'

import { MissingWeatherApiKeyError } from './weatherErrors.js'

export { MissingWeatherApiKeyError } from './weatherErrors.js'

const API_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'
const REVERSE_GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/reverse'

const KOREAN_CITY_NAMES = Object.freeze({
  anyang: '안양',
  ansan: '안산',
  busan: '부산',
  bucheon: '부천',
  changwon: '창원',
  cheongju: '청주',
  chuncheon: '춘천',
  daegu: '대구',
  daejeon: '대전',
  gangneung: '강릉',
  gimhae: '김해',
  gimpo: '김포',
  goyang: '고양',
  gwangju: '광주',
  hanam: '하남',
  hwaseong: '화성',
  incheon: '인천',
  jeju: '제주',
  jeonju: '전주',
  namyangju: '남양주',
  pohang: '포항',
  pyeongtaek: '평택',
  sejong: '세종',
  seongnam: '성남',
  seoul: '서울',
  suwon: '수원',
  uijeongbu: '의정부',
  ulsan: '울산',
  wonju: '원주',
  yongin: '용인',
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
const stripKoreanAdministrativeSuffix = (value) => value.replace(/(?:특별자치시|특별시|광역시|특별자치도|시|군|구)$/u, '').trim()
const stripRomanizedKoreanSuffix = (value) => value.replace(/(?:[-\s](?:si|gun|gu|do))$/i, '').trim()
const resolveCurrentLocationName = (payload, locationPayload, countryCode) => {
  if (countryCode !== 'KR') {
    return nonEmptyStringOrNull(locationPayload?.local_names?.en) || nonEmptyStringOrNull(locationPayload?.name) || nonEmptyStringOrNull(payload?.name)
  }

  const koreanName = nonEmptyStringOrNull(locationPayload?.local_names?.ko)
  if (koreanName) return stripKoreanAdministrativeSuffix(koreanName)

  const apiName = nonEmptyStringOrNull(payload?.name) || nonEmptyStringOrNull(locationPayload?.name)
  if (!apiName) return null

  const normalizedName = stripRomanizedKoreanSuffix(apiName)
  return KOREAN_CITY_NAMES[normalizedName.toLocaleLowerCase('en-US')] || stripKoreanAdministrativeSuffix(normalizedName)
}
const FORECAST_ITEM_LIMIT = 8
const DAILY_FORECAST_LIMIT = 5
const SECONDS_PER_DAY = 24 * 60 * 60
const LOCAL_NOON_SECONDS = 12 * 60 * 60

const formatLocalDate = (timestamp, timezoneOffset) => {
  if (!Number.isFinite(timestamp) || !Number.isFinite(timezoneOffset)) return null

  const localDate = new Date((timestamp + timezoneOffset) * 1000)
  if (Number.isNaN(localDate.getTime())) return null

  const year = localDate.getUTCFullYear()
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(localDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toPrecipitationPercentage = (value) => {
  if (!Number.isFinite(value)) return null
  return Math.round(Math.min(Math.max(value, 0), 1) * 100)
}

const mapForecastItem = (item, timezoneOffset) => {
  const currentCondition = item?.weather?.[0]
  const timestamp = finiteNumberOrNull(item?.dt)

  return {
    timestamp,
    localDate: formatLocalDate(timestamp, timezoneOffset),
    temperature: finiteNumberOrNull(item?.main?.temp),
    feelsLike: finiteNumberOrNull(item?.main?.feels_like),
    humidity: finiteNumberOrNull(item?.main?.humidity),
    weatherId: finiteNumberOrNull(currentCondition?.id),
    weatherMain: nonEmptyStringOrNull(currentCondition?.main),
    weatherDescription: nonEmptyStringOrNull(currentCondition?.description),
    icon: nonEmptyStringOrNull(currentCondition?.icon),
    precipitationProbability: toPrecipitationPercentage(item?.pop),
    rainVolume: finiteNumberOrNull(item?.rain?.['3h']),
    snowVolume: finiteNumberOrNull(item?.snow?.['3h']),
    windSpeed: finiteNumberOrNull(item?.wind?.speed),
  }
}

const secondsFromLocalNoon = (timestamp, timezoneOffset) => {
  const localSeconds = (((timestamp + timezoneOffset) % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY
  return Math.abs(localSeconds - LOCAL_NOON_SECONDS)
}

const finiteValues = (items, selectValue) => items.map(selectValue).filter(Number.isFinite)

const mapDailyForecast = (entries, timezoneOffset) => {
  const mappedEntries = entries.map((item) => ({ source: item, mapped: mapForecastItem(item, timezoneOffset) }))
  const entriesByLocalDate = new Map()

  for (const entry of mappedEntries) {
    if (!entry.mapped.localDate || entry.mapped.timestamp === null) continue

    const dateEntries = entriesByLocalDate.get(entry.mapped.localDate) ?? []
    dateEntries.push(entry)
    entriesByLocalDate.set(entry.mapped.localDate, dateEntries)
  }

  return [...entriesByLocalDate.entries()].slice(0, DAILY_FORECAST_LIMIT).map(([date, dateEntries]) => {
    const representative = dateEntries.reduce((closest, candidate) => {
      const closestDistance = secondsFromLocalNoon(closest.mapped.timestamp, timezoneOffset)
      const candidateDistance = secondsFromLocalNoon(candidate.mapped.timestamp, timezoneOffset)
      return candidateDistance < closestDistance ? candidate : closest
    })
    const forecastTemperatures = finiteValues(dateEntries, ({ mapped }) => mapped.temperature)
    const precipitationProbabilities = finiteValues(dateEntries, ({ mapped }) => mapped.precipitationProbability)

    return {
      date,
      timestamp: representative.mapped.timestamp,
      minTemperature: forecastTemperatures.length ? Math.min(...forecastTemperatures) : null,
      maxTemperature: forecastTemperatures.length ? Math.max(...forecastTemperatures) : null,
      precipitationProbability: precipitationProbabilities.length ? Math.max(...precipitationProbabilities) : null,
      weatherId: representative.mapped.weatherId,
      weatherMain: representative.mapped.weatherMain,
      weatherDescription: representative.mapped.weatherDescription,
      icon: representative.mapped.icon,
    }
  })
}

const getWeatherApiKey = () => import.meta.env?.VITE_OPENWEATHER_API_KEY

export const hasWeatherApiKey = () => {
  const key = getWeatherApiKey()
  return Boolean(key && key !== 'replace_with_your_key')
}

export const mapWeatherResponse = (city, payload = {}, locationPayload = {}) => {
  const currentCondition = payload?.weather?.[0]
  const resolvedCountryCode = city?.isCurrentLocation ? nonEmptyStringOrNull(locationPayload?.country) || nonEmptyStringOrNull(payload?.sys?.country) : null
  const resolvedLocationName = city?.isCurrentLocation ? resolveCurrentLocationName(payload, locationPayload, resolvedCountryCode) : null
  const resolvedCountryName = getCountryName(resolvedCountryCode)

  return {
    ...city,
    ...(resolvedLocationName
      ? {
          name: resolvedLocationName,
          displayName: resolvedLocationName,
          fullName: `내 위치 · ${resolvedLocationName}`,
        }
      : {}),
    ...(resolvedCountryCode ? { countryCode: resolvedCountryCode, countryName: resolvedCountryName } : {}),
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

export const mapForecastResponse = (payload = {}) => {
  const timezoneOffset = finiteNumberOrNull(payload?.city?.timezone)
  const forecastEntries = Array.isArray(payload?.list) ? payload.list : []

  if (!forecastEntries.length) {
    return { timezoneOffset, hourly: [], daily: [] }
  }

  return {
    timezoneOffset,
    hourly: forecastEntries.slice(0, FORECAST_ITEM_LIMIT).map((item) => mapForecastItem(item, timezoneOffset)),
    daily: timezoneOffset === null ? [] : mapDailyForecast(forecastEntries, timezoneOffset),
  }
}

export const fetchCityWeather = async (city) => {
  if (!hasWeatherApiKey()) {
    throw new MissingWeatherApiKeyError()
  }

  const requestOptions = {
    params: {
      lat: city.latitude,
      lon: city.longitude,
      appid: getWeatherApiKey(),
      units: 'metric',
      lang: 'kr',
    },
    timeout: 8000,
  }
  const weatherRequest = axios.get(API_URL, requestOptions)
  const locationRequest = city?.isCurrentLocation
    ? axios
        .get(REVERSE_GEOCODING_API_URL, {
          params: {
            lat: city.latitude,
            lon: city.longitude,
            limit: 1,
            appid: getWeatherApiKey(),
          },
          timeout: 8000,
        })
        .catch(() => null)
    : Promise.resolve(null)

  const [response, locationResponse] = await Promise.all([weatherRequest, locationRequest])

  return mapWeatherResponse(city, response.data, locationResponse?.data?.[0])
}

export const fetchCityForecast = async (city, apiKey = getWeatherApiKey()) => {
  if (!apiKey || apiKey === 'replace_with_your_key') {
    throw new MissingWeatherApiKeyError()
  }

  const response = await axios.get(FORECAST_API_URL, {
    params: {
      lat: city.latitude,
      lon: city.longitude,
      appid: apiKey,
      units: 'metric',
      lang: 'kr',
    },
    timeout: 8000,
  })

  return mapForecastResponse(response.data)
}

export const fetchWeatherList = async (cities, fetchWeather = fetchCityWeather, onComplete) => {
  const results = await Promise.allSettled(cities.map(fetchWeather))
  const successfulCities = results.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  const failedCount = results.length - successfulCities.length

  onComplete?.({ failedCount, totalCount: results.length })

  if (successfulCities.length || results.length === 0) return successfulCities

  throw results[0].reason
}
