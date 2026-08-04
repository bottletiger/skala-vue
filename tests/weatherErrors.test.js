import assert from 'node:assert/strict'
import test from 'node:test'

import { getWeatherRequestErrorMessage, HOME_MISSING_WEATHER_API_KEY_MESSAGE, MissingWeatherApiKeyError, MISSING_WEATHER_API_KEY_MESSAGE } from '../src/services/weatherErrors.js'

test('날씨 요청 오류를 화면별 기존 안내 문구로 변환한다', () => {
  const missingApiKeyError = new MissingWeatherApiKeyError()

  assert.equal(getWeatherRequestErrorMessage(missingApiKeyError, 'fallback'), MISSING_WEATHER_API_KEY_MESSAGE)
  assert.equal(getWeatherRequestErrorMessage(missingApiKeyError, 'fallback', HOME_MISSING_WEATHER_API_KEY_MESSAGE), HOME_MISSING_WEATHER_API_KEY_MESSAGE)
  assert.equal(getWeatherRequestErrorMessage({ response: { status: 401 } }, 'fallback'), 'API 키가 유효하지 않거나 아직 활성화되지 않았습니다.')
  assert.equal(getWeatherRequestErrorMessage(new Error('network'), 'fallback'), 'fallback')
})
