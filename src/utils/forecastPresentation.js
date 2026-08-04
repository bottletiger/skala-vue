import { getWeatherTheme } from './weatherTheme.js'

export const toForecastLocalDate = (timestamp, timezoneOffset) => {
  if (!Number.isFinite(timestamp) || !Number.isFinite(timezoneOffset)) return null

  const date = new Date((timestamp + timezoneOffset) * 1000)
  return Number.isNaN(date.getTime()) ? null : date
}

export const toIsoDateTime = (timestamp) => {
  if (!Number.isFinite(timestamp)) return undefined

  const date = new Date(timestamp * 1000)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export const getForecastVisual = (item) => {
  const theme = getWeatherTheme({
    condition: item?.weatherMain,
    conditionId: item?.weatherId,
    iconCode: item?.icon,
  })

  return {
    category: theme.category,
    isNight: theme.isNight,
    conditionLabel: item?.weatherDescription || theme.label || '날씨 정보 없음',
    precipitation: Number.isFinite(item?.precipitationProbability) ? item.precipitationProbability : null,
  }
}

export const formatForecastDay = (timestamp, timezoneOffset) => {
  const date = toForecastLocalDate(timestamp, timezoneOffset)
  if (!date) return '날짜 정보 없음'

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(date)
}

export const formatForecastDateParts = (timestamp, timezoneOffset) => {
  const date = toForecastLocalDate(timestamp, timezoneOffset)
  if (!date) return { weekday: '날짜 없음', dateLabel: '', dateTime: undefined }

  return {
    weekday: new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(date),
    dateLabel: new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', timeZone: 'UTC' }).format(date),
    dateTime: date.toISOString().slice(0, 10),
  }
}
