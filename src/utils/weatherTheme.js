const CATEGORY_LABELS = Object.freeze({
  clear: '맑음',
  clouds: '구름',
  rain: '비',
  snow: '눈',
  mist: '안개',
  thunderstorm: '뇌우',
  neutral: '현재 날씨',
  night: '밤',
})

const WEATHER_PALETTES = Object.freeze({
  neutral: Object.freeze({
    '--hero-start': '#B7C4C1',
    '--hero-end': '#DDE0DA',
    '--weather-accent': '#60736D',
    '--hero-text': '#1C292F',
    '--hero-muted': '#3F4F55',
  }),
  clear: Object.freeze({
    '--hero-start': '#B8D2DC',
    '--hero-end': '#E8BE9F',
    '--weather-accent': '#A66F2E',
    '--hero-text': '#243139',
    '--hero-muted': '#3F4F55',
  }),
  clouds: Object.freeze({
    '--hero-start': '#B9C2C8',
    '--hero-end': '#D7C4C7',
    '--weather-accent': '#607077',
    '--hero-text': '#253239',
    '--hero-muted': '#3F4F55',
  }),
  rain: Object.freeze({
    '--hero-start': '#91A9B3',
    '--hero-end': '#BEC9C8',
    '--weather-accent': '#3E6572',
    '--hero-text': '#20323A',
    '--hero-muted': '#2B3E45',
  }),
  snow: Object.freeze({
    '--hero-start': '#D1E1E5',
    '--hero-end': '#F1E9E2',
    '--weather-accent': '#6C8790',
    '--hero-text': '#26343A',
    '--hero-muted': '#3F4F55',
  }),
  mist: Object.freeze({
    '--hero-start': '#B8C8C3',
    '--hero-end': '#D9DBD0',
    '--weather-accent': '#667B72',
    '--hero-text': '#273530',
    '--hero-muted': '#3F4F55',
  }),
  thunderstorm: Object.freeze({
    '--hero-start': '#35434C',
    '--hero-end': '#657278',
    '--weather-accent': '#D0AA67',
    '--hero-text': '#FFFFFF',
    '--hero-muted': '#F4F5F2',
  }),
  night: Object.freeze({
    '--hero-start': '#1E2B36',
    '--hero-end': '#354653',
    '--weather-accent': '#D5B56B',
    '--hero-text': '#F2F4F2',
    '--hero-muted': '#C8D0D1',
  }),
})

const CONDITION_CATEGORIES = Object.freeze({
  clear: 'clear',
  clouds: 'clouds',
  drizzle: 'rain',
  rain: 'rain',
  snow: 'snow',
  mist: 'mist',
  smoke: 'mist',
  haze: 'mist',
  dust: 'mist',
  fog: 'mist',
  sand: 'mist',
  ash: 'mist',
  squall: 'mist',
  tornado: 'mist',
  thunderstorm: 'thunderstorm',
})

const ICON_CATEGORIES = Object.freeze({
  '01': 'clear',
  '02': 'clouds',
  '03': 'clouds',
  '04': 'clouds',
  '09': 'rain',
  10: 'rain',
  11: 'thunderstorm',
  13: 'snow',
  50: 'mist',
})

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)

const getCategoryFromId = (conditionId) => {
  if (!isFiniteNumber(conditionId)) return null
  if (conditionId >= 200 && conditionId < 300) return 'thunderstorm'
  if (conditionId >= 300 && conditionId < 600) return 'rain'
  if (conditionId >= 600 && conditionId < 700) return 'snow'
  if (conditionId >= 700 && conditionId < 800) return 'mist'
  if (conditionId === 800) return 'clear'
  if (conditionId > 800 && conditionId < 900) return 'clouds'
  return null
}

const getCategoryFromIcon = (iconCode) => {
  if (typeof iconCode !== 'string') return null
  return ICON_CATEGORIES[iconCode.trim().slice(0, 2)] ?? null
}

export const getWeatherCategory = (weather) => {
  if (!weather || typeof weather !== 'object') return 'neutral'

  if (typeof weather.condition === 'string') {
    const conditionCategory = CONDITION_CATEGORIES[weather.condition.trim().toLowerCase()]
    if (conditionCategory) return conditionCategory
  }

  return getCategoryFromId(weather.conditionId) ?? getCategoryFromIcon(weather.iconCode) ?? 'neutral'
}

export const isNightObservation = (weather) => {
  if (!weather || typeof weather !== 'object') return false

  if (isFiniteNumber(weather.observedAt) && isFiniteNumber(weather.sunrise) && isFiniteNumber(weather.sunset)) {
    return weather.observedAt < weather.sunrise || weather.observedAt >= weather.sunset
  }

  return typeof weather.iconCode === 'string' && weather.iconCode.trim().toLowerCase().endsWith('n')
}

export const getWeatherTheme = (weather) => {
  const category = getWeatherCategory(weather)
  const isNight = isNightObservation(weather)
  const name = isNight ? 'night' : category

  return {
    name,
    category,
    isNight,
    label: CATEGORY_LABELS[name],
    cssVariables: { ...WEATHER_PALETTES[name] },
  }
}

const getOffsetDate = (timestamp, offsetSeconds) => {
  if (!isFiniteNumber(timestamp) || !isFiniteNumber(offsetSeconds)) return null

  const date = new Date((timestamp + offsetSeconds) * 1000)
  return Number.isNaN(date.getTime()) ? null : date
}

const padDatePart = (value) => String(value).padStart(2, '0')

export const formatWeatherDateTime = (timestamp, offsetSeconds) => {
  const date = getOffsetDate(timestamp, offsetSeconds)
  if (!date) return '정보 없음'

  const year = date.getUTCFullYear()
  const month = padDatePart(date.getUTCMonth() + 1)
  const day = padDatePart(date.getUTCDate())
  const time = `${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}`

  return `${year}. ${month}. ${day}. ${time}`
}

export const formatWeatherTime = (timestamp, offsetSeconds) => {
  const date = getOffsetDate(timestamp, offsetSeconds)
  if (!date) return '정보 없음'

  return `${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}`
}
