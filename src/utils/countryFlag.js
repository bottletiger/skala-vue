const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 65

export const getCountryFlagEmoji = (countryCode) => {
  const normalizedCode = String(countryCode ?? '')
    .trim()
    .toUpperCase()

  if (!/^[A-Z]{2}$/.test(normalizedCode)) return ''

  return String.fromCodePoint(...[...normalizedCode].map((character) => character.codePointAt(0) + REGIONAL_INDICATOR_OFFSET))
}
