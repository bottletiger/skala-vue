const roundToDisplayPrecision = (temperature) => Math.round(temperature * 10) / 10

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
