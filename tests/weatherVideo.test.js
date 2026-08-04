import assert from 'node:assert/strict'
import test from 'node:test'

import { getWeatherVideoKey } from '../src/utils/weatherVideo.js'

test('OpenWeather 상태 코드를 세분화된 배경 영상 키로 변환한다', () => {
  const cases = [
    [201, 'thunderstorm'],
    [301, 'drizzle'],
    [500, 'rain'],
    [502, 'heavy-rain'],
    [520, 'rain'],
    [522, 'heavy-rain'],
    [511, 'snow'],
    [601, 'snow'],
    [741, 'fog'],
    [771, 'thunderstorm'],
    [801, 'few-clouds'],
    [802, 'few-clouds'],
    [803, 'overcast'],
    [804, 'overcast'],
  ]

  for (const [conditionId, expectedKey] of cases) {
    assert.equal(getWeatherVideoKey({ conditionId }), expectedKey)
  }
})

test('맑음만 낮과 밤 영상을 나누고 악천후는 시간과 관계없이 상태 영상을 유지한다', () => {
  assert.equal(getWeatherVideoKey({ conditionId: 800, iconCode: '01d' }), 'clear-day')
  assert.equal(getWeatherVideoKey({ conditionId: 800, iconCode: '01n' }), 'clear-night')
  assert.equal(getWeatherVideoKey({ conditionId: 501, iconCode: '10n' }), 'rain')
  assert.equal(getWeatherVideoKey({ conditionId: 804, iconCode: '04n' }), 'overcast')
})

test('상태 코드가 없으면 날씨 분류를 사용하고 유효한 정보가 없으면 영상을 끈다', () => {
  assert.equal(getWeatherVideoKey({ condition: 'Drizzle' }), 'rain')
  assert.equal(getWeatherVideoKey({ condition: 'Mist' }), 'fog')
  assert.equal(getWeatherVideoKey({ condition: 'Clear', iconCode: '01n' }), 'clear-night')
  assert.equal(getWeatherVideoKey({}), '')
  assert.equal(getWeatherVideoKey(null), '')
})
