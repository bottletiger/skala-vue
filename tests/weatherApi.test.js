import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'

import { fetchCityForecast, fetchWeatherList, mapForecastResponse, mapWeatherResponse } from '../src/services/weatherApi.js'

const cities = [
  { id: 'city_01', name: '서울' },
  { id: 'city_02', name: '수원' },
  { id: 'city_03', name: '부산' },
]

const createForecastEntry = (timestamp, index = 0) => ({
  dt: timestamp,
  main: {
    temp: 10 + index,
    feels_like: 9 + index,
    temp_min: 8 + index,
    temp_max: 12 + index,
    humidity: 60 + index,
  },
  weather: [
    {
      id: index === 4 ? 500 : 800,
      main: index === 4 ? 'Rain' : 'Clear',
      description: index === 4 ? '약한 비' : '맑음',
      icon: index === 4 ? '10d' : '01d',
    },
  ],
  pop: index / 10,
  rain: { '3h': index / 10 },
  snow: { '3h': index / 20 },
  wind: { speed: 2 + index / 10 },
})

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

test('현재 위치 응답은 실제 도시명과 국가명을 같은 Hero 형식으로 보강한다', () => {
  const result = mapWeatherResponse(
    {
      id: 'current-location',
      name: '현재 위치',
      fullName: '내 위치',
      countryName: '현재 위치',
      isCurrentLocation: true,
    },
    {
      name: 'Seoul',
      sys: { country: 'KR' },
      weather: [{ description: '구름조금' }],
    },
  )

  assert.equal(result.name, 'Seoul')
  assert.equal(result.displayName, 'SEOUL')
  assert.equal(result.countryCode, 'KR')
  assert.equal(result.countryName, '대한민국')
  assert.equal(result.fullName, '내 위치 · Seoul')
})

test('OpenWeather 3시간 예보를 첫 8개 시간대와 현지 날짜별 일간 예보로 매핑한다', () => {
  const startTimestamp = Date.parse('2024-01-01T00:00:00Z') / 1000
  const list = Array.from({ length: 10 }, (_, index) => createForecastEntry(startTimestamp + index * 3 * 60 * 60, index))
  const result = mapForecastResponse({ city: { timezone: 0 }, list })

  assert.equal(result.timezoneOffset, 0)
  assert.equal(result.hourly.length, 8)
  assert.deepEqual(result.hourly[4], {
    timestamp: startTimestamp + 12 * 60 * 60,
    localDate: '2024-01-01',
    temperature: 14,
    feelsLike: 13,
    humidity: 64,
    weatherId: 500,
    weatherMain: 'Rain',
    weatherDescription: '약한 비',
    icon: '10d',
    precipitationProbability: 40,
    rainVolume: 0.4,
    snowVolume: 0.2,
    windSpeed: 2.4,
  })
  assert.deepEqual(
    result.hourly.map(({ timestamp }) => timestamp),
    list.slice(0, 8).map(({ dt }) => dt),
  )
  assert.deepEqual(result.daily, [
    {
      date: '2024-01-01',
      timestamp: startTimestamp + 12 * 60 * 60,
      minTemperature: 10,
      maxTemperature: 17,
      precipitationProbability: 70,
      weatherId: 500,
      weatherMain: 'Rain',
      weatherDescription: '약한 비',
      icon: '10d',
    },
    {
      date: '2024-01-02',
      timestamp: startTimestamp + 27 * 60 * 60,
      minTemperature: 18,
      maxTemperature: 19,
      precipitationProbability: 90,
      weatherId: 800,
      weatherMain: 'Clear',
      weatherDescription: '맑음',
      icon: '01d',
    },
  ])

  const sixDayList = Array.from({ length: 6 }, (_, index) => createForecastEntry(startTimestamp + index * 24 * 60 * 60 + 12 * 60 * 60, index))
  assert.deepEqual(
    mapForecastResponse({ city: { timezone: 0 }, list: sixDayList }).daily.map(({ date }) => date),
    ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
  )
})

test('city.timezone을 적용한 현지 날짜 경계와 현지 정오에 가장 가까운 대표 항목을 사용한다', () => {
  const firstTimestamp = Date.parse('2024-01-01T14:00:00Z') / 1000
  const list = [
    createForecastEntry(firstTimestamp, 0),
    createForecastEntry(firstTimestamp + 3 * 60 * 60, 1),
    createForecastEntry(firstTimestamp + 12 * 60 * 60, 2),
    createForecastEntry(firstTimestamp + 15 * 60 * 60, 3),
  ]
  const result = mapForecastResponse({ city: { timezone: 9 * 60 * 60 }, list })

  assert.deepEqual(
    result.hourly.map(({ localDate }) => localDate),
    ['2024-01-01', '2024-01-02', '2024-01-02', '2024-01-02'],
  )
  assert.deepEqual(
    result.daily.map(({ date, timestamp }) => ({ date, timestamp })),
    [
      { date: '2024-01-01', timestamp: firstTimestamp },
      { date: '2024-01-02', timestamp: firstTimestamp + 12 * 60 * 60 },
    ],
  )
})

test('예보 필드 결측과 잘못된 list를 임의 값 없이 안전하게 처리한다', () => {
  assert.deepEqual(mapForecastResponse({ city: { timezone: 32_400 }, list: null }), {
    timezoneOffset: 32_400,
    hourly: [],
    daily: [],
  })

  const result = mapForecastResponse({
    city: { timezone: 0 },
    list: [{ dt: 'invalid', main: { temp: '21', humidity: Number.NaN }, weather: [{}], pop: Number.POSITIVE_INFINITY, rain: { '3h': '1' } }],
  })

  assert.deepEqual(result, {
    timezoneOffset: 0,
    hourly: [
      {
        timestamp: null,
        localDate: null,
        temperature: null,
        feelsLike: null,
        humidity: null,
        weatherId: null,
        weatherMain: null,
        weatherDescription: null,
        icon: null,
        precipitationProbability: null,
        rainVolume: null,
        snowVolume: null,
        windSpeed: null,
      },
    ],
    daily: [],
  })
})

test('도시 좌표와 API 키로 OpenWeather forecast 요청을 보내고 응답을 매핑한다', async () => {
  const originalGet = axios.get
  let capturedRequest

  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return { data: { city: { timezone: 0 }, list: [] } }
  }

  try {
    assert.deepEqual(await fetchCityForecast({ latitude: 37.5665, longitude: 126.978 }, 'forecast-api-key'), {
      timezoneOffset: 0,
      hourly: [],
      daily: [],
    })
  } finally {
    axios.get = originalGet
  }

  assert.deepEqual(capturedRequest, {
    url: 'https://api.openweathermap.org/data/2.5/forecast',
    config: {
      params: {
        lat: 37.5665,
        lon: 126.978,
        appid: 'forecast-api-key',
        units: 'metric',
        lang: 'kr',
      },
      timeout: 8000,
    },
  })
  await assert.rejects(fetchCityForecast({ latitude: 37.5665, longitude: 126.978 }, ''), /OpenWeatherMap API 키가 설정되지 않았습니다/)
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
