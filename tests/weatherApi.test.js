import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchWeatherList, mapWeatherResponse } from '../src/services/weatherApi.js'

const cities = [
  { id: 'city_01', name: '서울' },
  { id: 'city_02', name: '수원' },
  { id: 'city_03', name: '부산' },
]

test('OpenWeather Current Weather 응답을 실제 관측 필드로 매핑한다', () => {
  const result = mapWeatherResponse(cities[0], {
    weather: [{ id: 501, main: 'Rain', description: '보통 비', icon: '10d' }],
    main: { temp: 21.4, feels_like: 22.1, humidity: 81, pressure: 1008 },
    visibility: 7500,
    wind: { speed: 3.6 },
    dt: 1_704_067_200,
    sys: { sunrise: 1_704_040_000, sunset: 1_704_080_000 },
    timezone: 32_400,
  })

  assert.deepEqual(result, {
    ...cities[0],
    temp: 21.4,
    feelsLike: 22.1,
    humidity: 81,
    pressure: 1008,
    visibility: 7500,
    wind: 3.6,
    observedAt: 1_704_067_200,
    sunrise: 1_704_040_000,
    sunset: 1_704_080_000,
    timezoneOffset: 32_400,
    condition: 'Rain',
    conditionId: 501,
    iconCode: '10d',
    status: '보통 비',
  })
})

test('누락되거나 잘못된 OpenWeather 필드는 임의 값 없이 null로 매핑한다', () => {
  assert.deepEqual(mapWeatherResponse(cities[0], { main: { temp: '21', humidity: Number.NaN }, weather: [{}] }), {
    ...cities[0],
    temp: null,
    feelsLike: null,
    humidity: null,
    pressure: null,
    visibility: null,
    wind: null,
    observedAt: null,
    sunrise: null,
    sunset: null,
    timezoneOffset: null,
    condition: null,
    conditionId: null,
    iconCode: null,
    status: null,
  })
})

test('도시 목록 요청은 일부 실패가 있어도 성공한 도시를 입력 순서대로 반환한다', async () => {
  const fetchWeather = async (city) => {
    if (city.id === 'city_02') throw new Error('수원 요청 실패')
    return { ...city, temp: city.id === 'city_01' ? 20 : 25 }
  }

  let requestSummary
  const result = await fetchWeatherList(cities, fetchWeather, (summary) => {
    requestSummary = summary
  })

  assert.deepEqual(
    result.map((city) => city.id),
    ['city_01', 'city_03'],
  )
  assert.deepEqual(requestSummary, { failedCount: 1, totalCount: 3 })
})

test('모든 도시 요청이 실패하면 첫 번째 요청 오류를 전달하고 빈 입력은 빈 배열을 반환한다', async () => {
  const fetchWeather = async (city) => {
    throw new Error(`${city.id} 요청 실패`)
  }

  await assert.rejects(fetchWeatherList(cities, fetchWeather), /city_01 요청 실패/)
  assert.deepEqual(await fetchWeatherList([], fetchWeather), [])
})
