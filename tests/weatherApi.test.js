import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'

import {
  fetchCityForecast,
  fetchCityWeather,
  fetchWeatherBatch,
  fetchWeatherList,
  mapForecastResponse,
  mapWeatherResponse,
  mapWmoWeatherCode,
  WEATHER_LIST_CONCURRENCY,
} from '../src/services/weatherApi.js'

const cities = [
  { id: 'city_01', name: '서울', latitude: 37.5665, longitude: 126.978 },
  { id: 'city_02', name: '수원', latitude: 37.2636, longitude: 127.0286 },
  { id: 'city_03', name: '부산', latitude: 35.1796, longitude: 129.0756 },
]

const createHourlyPayload = (startTimestamp, count = 24) => ({
  time: Array.from({ length: count }, (_, index) => startTimestamp + index * 60 * 60),
  temperature_2m: Array.from({ length: count }, (_, index) => 10 + index),
  apparent_temperature: Array.from({ length: count }, (_, index) => 9 + index),
  relative_humidity_2m: Array.from({ length: count }, (_, index) => 50 + index),
  precipitation_probability: Array.from({ length: count }, (_, index) => index),
  weather_code: Array.from({ length: count }, (_, index) => (index === 12 ? 63 : 0)),
  rain: Array.from({ length: count }, () => 1),
  snowfall: Array.from({ length: count }, () => 0.5),
  wind_speed_10m: Array.from({ length: count }, (_, index) => 2 + index / 10),
  is_day: Array.from({ length: count }, (_, index) => (index < 7 || index >= 19 ? 0 : 1)),
})

test('Open-Meteo WMO 코드를 기존 conditionId, 상태, 아이콘 계약으로 변환한다', () => {
  assert.deepEqual(mapWmoWeatherCode(0, 1), {
    conditionId: 800,
    condition: 'Clear',
    status: '맑음',
    iconCode: '01d',
  })
  assert.deepEqual(mapWmoWeatherCode(63, 0), {
    conditionId: 501,
    condition: 'Rain',
    status: '보통 비',
    iconCode: '10n',
  })
  assert.deepEqual(mapWmoWeatherCode(99, 1), {
    conditionId: 202,
    condition: 'Thunderstorm',
    status: '강한 우박을 동반한 뇌우',
    iconCode: '11d',
  })
  assert.deepEqual(mapWmoWeatherCode(999), {
    conditionId: null,
    condition: null,
    status: null,
    iconCode: null,
  })
})

test('Open-Meteo 현재 응답을 기존 화면의 날씨 모델로 매핑한다', () => {
  const result = mapWeatherResponse(cities[0], {
    utc_offset_seconds: 32_400,
    current: {
      time: 1_704_067_200,
      temperature_2m: 21.4,
      apparent_temperature: 22.1,
      relative_humidity_2m: 81,
      surface_pressure: 1008,
      wind_speed_10m: 3.6,
      weather_code: 63,
      is_day: 1,
    },
    hourly: { visibility: [7500] },
    daily: { sunrise: [1_704_040_000], sunset: [1_704_080_000] },
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

test('누락되거나 잘못된 Open-Meteo 필드는 임의 값 없이 null로 매핑한다', () => {
  assert.deepEqual(mapWeatherResponse(cities[0], { current: { temperature_2m: '21', relative_humidity_2m: Number.NaN } }), {
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

test('국내 현재 위치는 공개 역지오코딩 결과의 도시명과 국가로 보강한다', () => {
  const result = mapWeatherResponse(
    {
      id: 'current-location',
      name: '현재 위치',
      fullName: '내 위치',
      countryName: '현재 위치',
      isCurrentLocation: true,
    },
    {},
    { city: 'Seongnam-si', countryCode: 'KR' },
  )

  assert.equal(result.name, 'Seongnam')
  assert.equal(result.displayName, 'SEONGNAM')
  assert.equal(result.countryCode, 'KR')
  assert.equal(result.countryName, '대한민국')
  assert.equal(result.fullName, '내 위치 · Seongnam')
})

test('해외 현재 위치는 공개 역지오코딩 결과의 영어 도시명을 사용한다', () => {
  const result = mapWeatherResponse({ id: 'current-location', name: '현재 위치', isCurrentLocation: true }, {}, { city: 'Munich', countryCode: 'DE' })

  assert.equal(result.name, 'Munich')
  assert.equal(result.displayName, 'MUNICH')
  assert.equal(result.countryCode, 'DE')
  assert.equal(result.countryName, '독일')
})

test('Open-Meteo 시간별 값을 3시간 간격 8개와 5일 예보로 매핑한다', () => {
  const startTimestamp = Date.parse('2024-01-01T00:00:00Z') / 1000
  const dailyTimes = Array.from({ length: 6 }, (_, index) => startTimestamp + index * 24 * 60 * 60)
  const result = mapForecastResponse({
    utc_offset_seconds: 0,
    hourly: createHourlyPayload(startTimestamp),
    daily: {
      time: dailyTimes,
      weather_code: [0, 63, 3, 95, 71, 0],
      temperature_2m_min: [1, 2, 3, 4, 5, 6],
      temperature_2m_max: [11, 12, 13, 14, 15, 16],
      precipitation_probability_max: [0, 60, 20, 80, 40, 0],
    },
  })

  assert.equal(result.timezoneOffset, 0)
  assert.equal(result.hourly.length, 8)
  assert.deepEqual(result.hourly[4], {
    timestamp: startTimestamp + 12 * 60 * 60,
    localDate: '2024-01-01',
    temperature: 22,
    feelsLike: 21,
    humidity: 62,
    weatherId: 501,
    weatherMain: 'Rain',
    weatherDescription: '보통 비',
    icon: '10d',
    precipitationProbability: 12,
    rainVolume: 3,
    snowVolume: 1.5,
    windSpeed: 3.2,
  })
  assert.deepEqual(
    result.hourly.map(({ timestamp }) => timestamp),
    Array.from({ length: 8 }, (_, index) => startTimestamp + index * 3 * 60 * 60),
  )
  assert.equal(result.daily.length, 5)
  assert.deepEqual(result.daily[1], {
    date: '2024-01-02',
    timestamp: startTimestamp + 24 * 60 * 60,
    minTemperature: 2,
    maxTemperature: 12,
    precipitationProbability: 60,
    weatherId: 501,
    weatherMain: 'Rain',
    weatherDescription: '보통 비',
    icon: '10d',
  })
})

test('utc_offset_seconds를 시간별 및 일간 현지 날짜 계산에 적용한다', () => {
  const firstTimestamp = Date.parse('2024-01-01T14:00:00Z') / 1000
  const result = mapForecastResponse({
    utc_offset_seconds: 9 * 60 * 60,
    hourly: createHourlyPayload(firstTimestamp, 7),
    daily: {
      time: [Date.parse('2024-01-01T15:00:00Z') / 1000],
      weather_code: [0],
      temperature_2m_min: [1],
      temperature_2m_max: [10],
      precipitation_probability_max: [0],
    },
  })

  assert.deepEqual(
    result.hourly.map(({ localDate }) => localDate),
    ['2024-01-01', '2024-01-02', '2024-01-02'],
  )
  assert.equal(result.daily[0].date, '2024-01-02')
})

test('예보 필드 결측과 잘못된 배열 값을 임의 값 없이 안전하게 처리한다', () => {
  assert.deepEqual(mapForecastResponse({ utc_offset_seconds: 32_400, hourly: null, daily: null }), {
    timezoneOffset: 32_400,
    hourly: [],
    daily: [],
  })

  const result = mapForecastResponse({
    utc_offset_seconds: 0,
    hourly: { time: ['invalid'], temperature_2m: ['21'], relative_humidity_2m: [Number.NaN] },
  })

  assert.deepEqual(result.hourly[0], {
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
  })
})

test('현재 날씨를 키 없이 Open-Meteo Forecast API에서 요청한다', async () => {
  const originalGet = axios.get
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return { data: {} }
  }

  try {
    await fetchCityWeather(cities[0])
  } finally {
    axios.get = originalGet
  }

  assert.equal(capturedRequest.url, 'https://api.open-meteo.com/v1/forecast')
  assert.equal(capturedRequest.config.params.latitude, 37.5665)
  assert.equal(capturedRequest.config.params.longitude, 126.978)
  assert.match(capturedRequest.config.params.current, /weather_code/)
  assert.equal(capturedRequest.config.params.forecast_hours, 1)
  assert.equal(capturedRequest.config.params.wind_speed_unit, 'ms')
  assert.equal('appid' in capturedRequest.config.params, false)
})

test('예보를 키 없이 Open-Meteo 시간별·일간 변수로 요청한다', async () => {
  const originalGet = axios.get
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return { data: { utc_offset_seconds: 0, hourly: { time: [] }, daily: { time: [] } } }
  }

  try {
    assert.deepEqual(await fetchCityForecast(cities[0]), { timezoneOffset: 0, hourly: [], daily: [] })
  } finally {
    axios.get = originalGet
  }

  assert.equal(capturedRequest.url, 'https://api.open-meteo.com/v1/forecast')
  assert.match(capturedRequest.config.params.hourly, /precipitation_probability/)
  assert.match(capturedRequest.config.params.daily, /temperature_2m_max/)
  assert.equal(capturedRequest.config.params.forecast_days, 5)
  assert.equal(capturedRequest.config.params.forecast_hours, 24)
  assert.equal('appid' in capturedRequest.config.params, false)
})

test('여행 예보 옵션은 최대 16일까지 매핑하고 기존 기본값은 5일로 유지한다', async () => {
  const originalGet = axios.get
  const startTimestamp = Date.parse('2024-01-01T00:00:00Z') / 1000
  const controller = new AbortController()
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return {
      data: {
        utc_offset_seconds: 0,
        hourly: { time: [] },
        daily: {
          time: Array.from({ length: 16 }, (_, index) => startTimestamp + index * 24 * 60 * 60),
          weather_code: Array.from({ length: 16 }, () => 0),
          temperature_2m_min: Array.from({ length: 16 }, () => 1),
          temperature_2m_max: Array.from({ length: 16 }, () => 10),
          precipitation_probability_max: Array.from({ length: 16 }, () => 0),
        },
      },
    }
  }

  let result
  try {
    result = await fetchCityForecast(cities[0], { forecastDays: 99, signal: controller.signal })
  } finally {
    axios.get = originalGet
  }

  assert.equal(capturedRequest.config.params.forecast_days, 16)
  assert.equal(capturedRequest.config.signal, controller.signal)
  assert.equal(result.daily.length, 16)
  assert.equal(result.daily[15].date, '2024-01-16')
})

test('여러 도시 현재 날씨는 Open-Meteo 다중 좌표 한 번으로 요청하고 입력 순서를 유지한다', async () => {
  const originalGet = axios.get
  let requestCount = 0
  let capturedRequest
  axios.get = async (url, config) => {
    requestCount += 1
    capturedRequest = { url, config }
    return {
      data: cities.map((city, index) => ({
        latitude: city.latitude,
        longitude: city.longitude,
        utc_offset_seconds: 32_400,
        current: {
          time: 1_704_067_200,
          temperature_2m: 20 + index,
          weather_code: index === 1 ? 63 : 0,
          is_day: 1,
        },
      })),
    }
  }

  let requestSummary
  let result
  try {
    result = await fetchWeatherList(cities, undefined, (summary) => {
      requestSummary = summary
    })
  } finally {
    axios.get = originalGet
  }

  assert.equal(requestCount, 1)
  assert.equal(capturedRequest.url, 'https://api.open-meteo.com/v1/forecast')
  assert.equal(capturedRequest.config.params.latitude, '37.5665,37.2636,35.1796')
  assert.equal(capturedRequest.config.params.longitude, '126.978,127.0286,129.0756')
  assert.deepEqual(
    result.map(({ id, temp }) => ({ id, temp })),
    [
      { id: 'city_01', temp: 20 },
      { id: 'city_02', temp: 21 },
      { id: 'city_03', temp: 22 },
    ],
  )
  assert.deepEqual(requestSummary, { failedCount: 0, totalCount: 3 })
})

test('동일한 다중 좌표 요청이 진행 중이면 하나의 Open-Meteo 응답을 함께 사용한다', async () => {
  const originalGet = axios.get
  let requestCount = 0
  let resolveRequest
  axios.get = () => {
    requestCount += 1
    return new Promise((resolve) => {
      resolveRequest = resolve
    })
  }

  try {
    const firstRequest = fetchWeatherBatch(cities)
    const secondRequest = fetchWeatherBatch(cities)
    assert.equal(firstRequest, secondRequest)
    assert.equal(requestCount, 1)

    resolveRequest({
      data: cities.map((city) => ({
        latitude: city.latitude,
        longitude: city.longitude,
        utc_offset_seconds: 32_400,
        current: { time: 1_704_067_200, temperature_2m: 20, weather_code: 0, is_day: 1 },
      })),
    })

    const [firstResult, secondResult] = await Promise.all([firstRequest, secondRequest])
    assert.deepEqual(firstResult, secondResult)
  } finally {
    axios.get = originalGet
  }
})

test('다중 좌표 응답 수가 다르면 잘못된 도시 매핑 대신 요청을 실패시킨다', async () => {
  const originalGet = axios.get
  axios.get = async () => ({ data: [{}] })

  try {
    await assert.rejects(fetchWeatherBatch(cities), /응답 수가 요청한 도시 수와 일치하지 않습니다/)
  } finally {
    axios.get = originalGet
  }
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

test('도시 목록 요청은 최대 동시 요청 수를 제한하면서 입력 순서를 유지한다', async () => {
  assert.equal(WEATHER_LIST_CONCURRENCY, 6)

  const expandedCities = Array.from({ length: WEATHER_LIST_CONCURRENCY * 2 + 1 }, (_, index) => ({ id: `city_${String(index + 1).padStart(2, '0')}` }))
  let releaseRequests
  const requestGate = new Promise((resolve) => {
    releaseRequests = resolve
  })
  const startedCityIds = []
  let activeRequestCount = 0
  let maxActiveRequestCount = 0

  const resultPromise = fetchWeatherList(expandedCities, async (city) => {
    startedCityIds.push(city.id)
    activeRequestCount += 1
    maxActiveRequestCount = Math.max(maxActiveRequestCount, activeRequestCount)
    await requestGate
    activeRequestCount -= 1
    return city
  })

  assert.equal(startedCityIds.length, WEATHER_LIST_CONCURRENCY)
  releaseRequests()

  const result = await resultPromise
  assert.equal(maxActiveRequestCount, WEATHER_LIST_CONCURRENCY)
  assert.ok(maxActiveRequestCount <= 6)
  assert.deepEqual(
    result.map((city) => city.id),
    expandedCities.map((city) => city.id),
  )
})

test('모든 도시 요청이 실패하면 첫 번째 요청 오류를 전달하고 빈 입력은 빈 배열을 반환한다', async () => {
  const fetchWeather = async (city) => {
    throw new Error(`${city.id} 요청 실패`)
  }

  await assert.rejects(fetchWeatherList(cities, fetchWeather), /city_01 요청 실패/)
  assert.deepEqual(await fetchWeatherList([], fetchWeather), [])
})

test('Forecast 일일 한도 초과 뒤에는 같은 페이지에서 추가 Open-Meteo 요청을 보내지 않는다', async () => {
  const originalGet = axios.get
  let requestCount = 0
  axios.get = async () => {
    requestCount += 1
    const error = new Error('Request failed with status code 429')
    error.response = {
      status: 429,
      data: { error: true, reason: 'Daily API request limit exceeded. Please try again tomorrow.' },
    }
    throw error
  }

  try {
    await assert.rejects(fetchCityWeather(cities[0]), /Request failed with status code 429/)
    await assert.rejects(fetchCityWeather(cities[1]), /Daily API request limit exceeded/)
    assert.equal(requestCount, 1)
  } finally {
    axios.get = originalGet
  }
})
