export const MISSING_WEATHER_API_KEY_MESSAGE = 'VITE_OPENWEATHER_API_KEY를 설정해 주세요.'
export const HOME_MISSING_WEATHER_API_KEY_MESSAGE = '프로젝트 루트의 .env.local 파일에 VITE_OPENWEATHER_API_KEY를 설정해 주세요.'

export class MissingWeatherApiKeyError extends Error {
  constructor() {
    super('OpenWeatherMap API 키가 설정되지 않았습니다.')
    this.name = 'MissingWeatherApiKeyError'
  }
}

export const getWeatherRequestErrorMessage = (error, fallbackMessage, missingApiKeyMessage = MISSING_WEATHER_API_KEY_MESSAGE) => {
  if (error instanceof MissingWeatherApiKeyError) {
    return missingApiKeyMessage
  }
  if (error.response?.status === 401) {
    return 'API 키가 유효하지 않거나 아직 활성화되지 않았습니다.'
  }
  return fallbackMessage
}
