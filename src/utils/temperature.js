const roundToDisplayPrecision = (temperature) => Math.round(temperature * 10) / 10

const TEMPERATURE_CONDITIONS = Object.freeze({
  hot: Object.freeze({ key: 'hot', label: '더움', rangeLabel: '25도 이상' }),
  cool: Object.freeze({ key: 'cool', label: '선선함', rangeLabel: '25도 미만' }),
})

const toFiniteTemperature = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && value.trim() === '') return null

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

export const convertTemperature = (celsius, unit) => {
  const numericCelsius = toFiniteTemperature(celsius)
  if (numericCelsius === null) return null

  const displayCelsius = roundToDisplayPrecision(numericCelsius)
  const converted = unit === 'fahrenheit' ? (displayCelsius * 9) / 5 + 32 : displayCelsius
  return roundToDisplayPrecision(converted)
}

export const getTemperatureCondition = (celsius) => {
  const displayCelsius = convertTemperature(celsius, 'celsius')
  if (displayCelsius === null) return null

  return displayCelsius >= 25 ? TEMPERATURE_CONDITIONS.hot : TEMPERATURE_CONDITIONS.cool
}
