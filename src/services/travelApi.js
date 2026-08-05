import axios from 'axios'

import { fetchCityForecast } from './weatherApi.js'

const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const AIR_QUALITY_API_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const NASA_POWER_CLIMATE_API_URL = 'https://power.larc.nasa.gov/api/temporal/climatology/point'
const NASA_POWER_SOURCE_URL = 'https://power.larc.nasa.gov/'
const REQUEST_TIMEOUT = 8000
const CLIMATE_REQUEST_TIMEOUT = 30_000
const DEFAULT_DESTINATION_COUNT = 8
const DEFAULT_PLACE_LIMIT = 8
const DEFAULT_PLACE_RADIUS = 10_000
const DEFAULT_CLIMATE_START_YEAR = 2001
const DEFAULT_CLIMATE_END_YEAR = 2020
const CLIMATE_PARAMETERS = ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'RH2M', 'WS10M']
const CLIMATE_MONTHS = Object.freeze([
  { key: 'JAN', month: 1, label: '1월' },
  { key: 'FEB', month: 2, label: '2월' },
  { key: 'MAR', month: 3, label: '3월' },
  { key: 'APR', month: 4, label: '4월' },
  { key: 'MAY', month: 5, label: '5월' },
  { key: 'JUN', month: 6, label: '6월' },
  { key: 'JUL', month: 7, label: '7월' },
  { key: 'AUG', month: 8, label: '8월' },
  { key: 'SEP', month: 9, label: '9월' },
  { key: 'OCT', month: 10, label: '10월' },
  { key: 'NOV', month: 11, label: '11월' },
  { key: 'DEC', month: 12, label: '12월' },
])
const CLIMATE_METRICS = Object.freeze([
  { parameter: 'T2M', property: 'temperature' },
  { parameter: 'T2M_MAX', property: 'maxTemperature' },
  { parameter: 'T2M_MIN', property: 'minTemperature' },
  { parameter: 'PRECTOTCORR', property: 'precipitation' },
  { parameter: 'RH2M', property: 'humidity' },
  { parameter: 'WS10M', property: 'windSpeed' },
])
const AIR_QUALITY_VARIABLES = ['us_aqi', 'european_aqi', 'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone', 'uv_index']

const finiteNumberOrNull = (value) => (Number.isFinite(value) ? value : null)
const nonEmptyStringOrNull = (value) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}
const clampInteger = (value, fallback, minimum, maximum) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(Math.max(Math.round(number), minimum), maximum)
}
const normalizeLanguage = (value) => {
  const language = nonEmptyStringOrNull(value)?.toLowerCase()
  return language && /^[a-z]{2,3}(?:-[a-z]{2,4})?$/.test(language) ? language : 'ko'
}
const uniqueText = (...values) => [...new Set(values.map(nonEmptyStringOrNull).filter(Boolean))]
const getCoordinates = (destination) => ({
  latitude: finiteNumberOrNull(destination?.latitude),
  longitude: finiteNumberOrNull(destination?.longitude),
})
const assertCoordinates = (destination) => {
  const coordinates = getCoordinates(destination)
  if (coordinates.latitude === null || coordinates.longitude === null) {
    throw new TypeError('유효한 위도와 경도가 필요합니다.')
  }
  return coordinates
}

const mapDestination = (result) => {
  const latitude = finiteNumberOrNull(result?.latitude)
  const longitude = finiteNumberOrNull(result?.longitude)
  if (latitude === null || longitude === null) return null

  const name = nonEmptyStringOrNull(result?.name)
  if (!name) return null

  const countryCode = nonEmptyStringOrNull(result?.country_code)
  const countryName = nonEmptyStringOrNull(result?.country)
  const admin1 = nonEmptyStringOrNull(result?.admin1)

  return {
    id: `open-meteo:${result.id ?? `${latitude},${longitude}`}`,
    name,
    fullName: uniqueText(name, admin1, countryName).join(', '),
    countryCode,
    countryName,
    admin1,
    latitude,
    longitude,
    timezone: nonEmptyStringOrNull(result?.timezone),
    population: finiteNumberOrNull(result?.population),
  }
}

export const searchDestinations = async (query, { count = DEFAULT_DESTINATION_COUNT, language = 'ko', countryCode, signal } = {}) => {
  const normalizedQuery = nonEmptyStringOrNull(query)
  if (!normalizedQuery || normalizedQuery.length < 2) return []

  const normalizedCountryCode = nonEmptyStringOrNull(countryCode)?.toUpperCase()
  const response = await axios.get(GEOCODING_API_URL, {
    params: {
      name: normalizedQuery,
      count: clampInteger(count, DEFAULT_DESTINATION_COUNT, 1, 100),
      language: normalizeLanguage(language),
      format: 'json',
      ...(normalizedCountryCode ? { countryCode: normalizedCountryCode } : {}),
    },
    timeout: REQUEST_TIMEOUT,
    signal,
  })

  const results = Array.isArray(response?.data?.results) ? response.data.results : []
  return results.map(mapDestination).filter(Boolean)
}

export const fetchDestinationForecast = async (destination, { signal } = {}) => {
  assertCoordinates(destination)
  return fetchCityForecast(destination, { forecastDays: 16, signal })
}

const climateValueOrNull = (value, fillValue) => {
  if (!Number.isFinite(value) || value === fillValue) return null
  return value
}

const mapClimatePeriod = (parameters, periodKey, fillValue) => {
  return CLIMATE_METRICS.reduce(
    (result, metric) => ({
      ...result,
      [metric.property]: climateValueOrNull(parameters?.[metric.parameter]?.[periodKey], fillValue),
    }),
    {},
  )
}

const resolveClimatePeriod = (range) => {
  const normalizedRange = nonEmptyStringOrNull(range)
  const years = normalizedRange?.match(/\b(?:19|20)\d{2}\b/g)?.map(Number) ?? []
  const startYear = years[0] ?? DEFAULT_CLIMATE_START_YEAR
  const endYear = years.at(-1) ?? DEFAULT_CLIMATE_END_YEAR

  return {
    startYear,
    endYear,
    label: `${startYear}–${endYear}`,
    range: normalizedRange,
  }
}

export const mapClimateResponse = (payload = {}) => {
  const parameters = payload?.properties?.parameter ?? {}
  const fillValue = finiteNumberOrNull(payload?.header?.fill_value)
  const sourceDatasets = Array.isArray(payload?.header?.sources) ? payload.header.sources.map(nonEmptyStringOrNull).filter(Boolean) : []
  const units = CLIMATE_METRICS.reduce(
    (result, metric) => ({
      ...result,
      [metric.property]: nonEmptyStringOrNull(payload?.parameters?.[metric.parameter]?.units),
    }),
    {},
  )

  return {
    period: resolveClimatePeriod(payload?.header?.range),
    months: CLIMATE_MONTHS.map(({ key, month, label }) => ({
      key,
      month,
      label,
      ...mapClimatePeriod(parameters, key, fillValue),
    })),
    annual: {
      key: 'ANN',
      month: null,
      label: '연간',
      ...mapClimatePeriod(parameters, 'ANN', fillValue),
    },
    units,
    source: 'NASA POWER',
    sourceUrl: NASA_POWER_SOURCE_URL,
    apiUrl: NASA_POWER_CLIMATE_API_URL,
    sourceDatasets,
    timeStandard: nonEmptyStringOrNull(payload?.header?.time_standard),
    apiVersion: nonEmptyStringOrNull(payload?.header?.api?.version),
  }
}

export const fetchDestinationClimate = async (destination, { signal } = {}) => {
  const { latitude, longitude } = assertCoordinates(destination)
  const response = await axios.get(NASA_POWER_CLIMATE_API_URL, {
    params: {
      parameters: CLIMATE_PARAMETERS.join(','),
      community: 'RE',
      longitude,
      latitude,
      format: 'JSON',
    },
    timeout: CLIMATE_REQUEST_TIMEOUT,
    signal,
  })

  return mapClimateResponse(response?.data)
}

export const getAirQualityCategory = (usAqi) => {
  if (!Number.isFinite(usAqi)) return null
  if (usAqi <= 50) return '좋음'
  if (usAqi <= 100) return '보통'
  if (usAqi <= 150) return '민감군 나쁨'
  if (usAqi <= 200) return '나쁨'
  if (usAqi <= 300) return '매우 나쁨'
  return '위험'
}

export const fetchAirQuality = async (destination, { signal } = {}) => {
  const { latitude, longitude } = assertCoordinates(destination)
  const response = await axios.get(AIR_QUALITY_API_URL, {
    params: {
      latitude,
      longitude,
      current: AIR_QUALITY_VARIABLES.join(','),
      timezone: 'auto',
      timeformat: 'unixtime',
    },
    timeout: REQUEST_TIMEOUT,
    signal,
  })
  const current = response?.data?.current ?? {}
  const usAqi = finiteNumberOrNull(current?.us_aqi)

  return {
    observedAt: finiteNumberOrNull(current?.time),
    timezone: nonEmptyStringOrNull(response?.data?.timezone),
    timezoneOffset: finiteNumberOrNull(response?.data?.utc_offset_seconds),
    usAqi,
    europeanAqi: finiteNumberOrNull(current?.european_aqi),
    pm10: finiteNumberOrNull(current?.pm10),
    pm2_5: finiteNumberOrNull(current?.pm2_5),
    carbonMonoxide: finiteNumberOrNull(current?.carbon_monoxide),
    nitrogenDioxide: finiteNumberOrNull(current?.nitrogen_dioxide),
    sulphurDioxide: finiteNumberOrNull(current?.sulphur_dioxide),
    ozone: finiteNumberOrNull(current?.ozone),
    uvIndex: finiteNumberOrNull(current?.uv_index),
    category: getAirQualityCategory(usAqi),
  }
}

const toRadians = (degrees) => (degrees * Math.PI) / 180
const getDistanceInMeters = (origin, target) => {
  const latitude = finiteNumberOrNull(target?.lat)
  const longitude = finiteNumberOrNull(target?.lon)
  if (latitude === null || longitude === null) return null

  const earthRadius = 6_371_000
  const latitudeDelta = toRadians(latitude - origin.latitude)
  const longitudeDelta = toRadians(longitude - origin.longitude)
  const originLatitude = toRadians(origin.latitude)
  const targetLatitude = toRadians(latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(originLatitude) * Math.cos(targetLatitude) * Math.sin(longitudeDelta / 2) ** 2

  return Math.round(2 * earthRadius * Math.asin(Math.sqrt(haversine)))
}

const mapNearbyPlace = (page, origin, language) => {
  const pageId = page?.pageid
  const title = nonEmptyStringOrNull(page?.title)
  if (!Number.isFinite(pageId) || !title) return null

  const coordinates = Array.isArray(page?.coordinates) ? page.coordinates[0] : null
  const distance = getDistanceInMeters(origin, coordinates)

  return {
    id: `wikipedia:${language}:${pageId}`,
    title,
    description: nonEmptyStringOrNull(page?.terms?.description?.[0]),
    thumbnailUrl: nonEmptyStringOrNull(page?.thumbnail?.source),
    pageUrl: nonEmptyStringOrNull(page?.fullurl) ?? `https://${language}.wikipedia.org/?curid=${pageId}`,
    latitude: finiteNumberOrNull(coordinates?.lat),
    longitude: finiteNumberOrNull(coordinates?.lon),
    distance,
    source: 'Wikipedia',
  }
}

export const fetchNearbyPlaces = async (destination, { limit = DEFAULT_PLACE_LIMIT, radius = DEFAULT_PLACE_RADIUS, language = 'ko', signal } = {}) => {
  const origin = assertCoordinates(destination)
  const normalizedLanguage = normalizeLanguage(language)
  const normalizedLimit = clampInteger(limit, DEFAULT_PLACE_LIMIT, 1, 20)
  const normalizedRadius = clampInteger(radius, DEFAULT_PLACE_RADIUS, 10, 10_000)
  const response = await axios.get(`https://${normalizedLanguage}.wikipedia.org/w/api.php`, {
    params: {
      action: 'query',
      generator: 'geosearch',
      ggsprimary: 'all',
      ggsnamespace: 0,
      ggscoord: `${origin.latitude}|${origin.longitude}`,
      ggsradius: normalizedRadius,
      ggslimit: normalizedLimit,
      prop: 'coordinates|pageimages|pageterms|info',
      piprop: 'thumbnail',
      pithumbsize: 480,
      pilimit: normalizedLimit,
      wbptterms: 'description',
      inprop: 'url',
      format: 'json',
      origin: '*',
    },
    timeout: REQUEST_TIMEOUT,
    signal,
  })

  const pages = Object.values(response?.data?.query?.pages ?? {})
  return pages
    .map((page) => mapNearbyPlace(page, origin, normalizedLanguage))
    .filter(Boolean)
    .sort((left, right) => (left.distance ?? Number.POSITIVE_INFINITY) - (right.distance ?? Number.POSITIVE_INFINITY))
    .slice(0, normalizedLimit)
}
