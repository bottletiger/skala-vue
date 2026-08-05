import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'

import { fetchAirQuality, fetchDestinationClimate, fetchDestinationForecast, fetchNearbyPlaces, getAirQualityCategory, mapClimateResponse, searchDestinations } from '../src/services/travelApi.js'

const destination = {
  id: 'open-meteo:1835848',
  name: '서울',
  latitude: 37.5665,
  longitude: 126.978,
}

test('Open-Meteo Geocoding 결과를 여행지 모델로 매핑한다', async () => {
  const originalGet = axios.get
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return {
      data: {
        results: [
          {
            id: 1835848,
            name: '서울',
            latitude: 37.566,
            longitude: 126.9784,
            country_code: 'KR',
            country: '대한민국',
            admin1: '서울특별시',
            timezone: 'Asia/Seoul',
            population: 10_349_312,
          },
          { id: 1, name: '좌표 없음' },
        ],
      },
    }
  }

  let result
  try {
    result = await searchDestinations(' 서울 ', { count: 200, language: 'ko', countryCode: 'kr' })
  } finally {
    axios.get = originalGet
  }

  assert.deepEqual(result, [
    {
      id: 'open-meteo:1835848',
      name: '서울',
      fullName: '서울, 서울특별시, 대한민국',
      countryCode: 'KR',
      countryName: '대한민국',
      admin1: '서울특별시',
      latitude: 37.566,
      longitude: 126.9784,
      timezone: 'Asia/Seoul',
      population: 10_349_312,
    },
  ])
  assert.equal(capturedRequest.url, 'https://geocoding-api.open-meteo.com/v1/search')
  assert.deepEqual(capturedRequest.config.params, {
    name: '서울',
    count: 100,
    language: 'ko',
    format: 'json',
    countryCode: 'KR',
  })
})

test('검색어가 두 글자 미만이면 네트워크 요청 없이 빈 여행지 목록을 반환한다', async () => {
  const originalGet = axios.get
  let requestCount = 0
  axios.get = async () => {
    requestCount += 1
    return { data: {} }
  }

  try {
    assert.deepEqual(await searchDestinations('서'), [])
    assert.deepEqual(await searchDestinations('  '), [])
  } finally {
    axios.get = originalGet
  }

  assert.equal(requestCount, 0)
})

test('Open-Meteo Air Quality 현재값과 미국 AQI 상태를 매핑한다', async () => {
  const originalGet = axios.get
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return {
      data: {
        timezone: 'Asia/Seoul',
        utc_offset_seconds: 32_400,
        current: {
          time: 1_704_067_200,
          us_aqi: 112,
          european_aqi: 55,
          pm10: 42.1,
          pm2_5: 28.4,
          carbon_monoxide: 221,
          nitrogen_dioxide: 17.2,
          sulphur_dioxide: 4.8,
          ozone: 76.3,
          uv_index: 5.2,
        },
      },
    }
  }

  let result
  try {
    result = await fetchAirQuality(destination)
  } finally {
    axios.get = originalGet
  }

  assert.deepEqual(result, {
    observedAt: 1_704_067_200,
    timezone: 'Asia/Seoul',
    timezoneOffset: 32_400,
    usAqi: 112,
    europeanAqi: 55,
    pm10: 42.1,
    pm2_5: 28.4,
    carbonMonoxide: 221,
    nitrogenDioxide: 17.2,
    sulphurDioxide: 4.8,
    ozone: 76.3,
    uvIndex: 5.2,
    category: '민감군 나쁨',
  })
  assert.equal(capturedRequest.url, 'https://air-quality-api.open-meteo.com/v1/air-quality')
  assert.match(capturedRequest.config.params.current, /pm2_5/)
  assert.equal(capturedRequest.config.params.timeformat, 'unixtime')
})

test('미국 AQI 범위를 사용자용 한국어 상태로 분류한다', () => {
  assert.equal(getAirQualityCategory(50), '좋음')
  assert.equal(getAirQualityCategory(100), '보통')
  assert.equal(getAirQualityCategory(150), '민감군 나쁨')
  assert.equal(getAirQualityCategory(200), '나쁨')
  assert.equal(getAirQualityCategory(300), '매우 나쁨')
  assert.equal(getAirQualityCategory(301), '위험')
  assert.equal(getAirQualityCategory(null), null)
})

test('Wikimedia 지오서치 결과에 설명, 썸네일, 거리, 원문 링크를 제공한다', async () => {
  const originalGet = axios.get
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return {
      data: {
        query: {
          pages: {
            100: {
              pageid: 100,
              title: '먼 장소',
              coordinates: [{ lat: 37.58, lon: 126.99 }],
              fullurl: 'https://ko.wikipedia.org/wiki/Far',
            },
            200: {
              pageid: 200,
              title: '서울광장',
              coordinates: [{ lat: 37.5665, lon: 126.978 }],
              terms: { description: ['서울특별시청 앞 광장'] },
              thumbnail: { source: 'https://upload.wikimedia.org/seoul.jpg' },
              fullurl: 'https://ko.wikipedia.org/wiki/서울광장',
            },
          },
        },
      },
    }
  }

  let result
  try {
    result = await fetchNearbyPlaces(destination, { limit: 40, radius: 20_000, language: 'ko' })
  } finally {
    axios.get = originalGet
  }

  assert.equal(result.length, 2)
  assert.deepEqual(result[0], {
    id: 'wikipedia:ko:200',
    title: '서울광장',
    description: '서울특별시청 앞 광장',
    thumbnailUrl: 'https://upload.wikimedia.org/seoul.jpg',
    pageUrl: 'https://ko.wikipedia.org/wiki/서울광장',
    latitude: 37.5665,
    longitude: 126.978,
    distance: 0,
    source: 'Wikipedia',
  })
  assert.equal(capturedRequest.url, 'https://ko.wikipedia.org/w/api.php')
  assert.equal(capturedRequest.config.params.ggslimit, 20)
  assert.equal(capturedRequest.config.params.ggsradius, 10_000)
  assert.equal(capturedRequest.config.params.origin, '*')
  assert.match(capturedRequest.config.params.prop, /pageimages/)
})

test('여행지 좌표가 없으면 대기질과 주변 명소 요청 전에 명확히 실패한다', async () => {
  await assert.rejects(fetchAirQuality({ name: '좌표 없음' }), /유효한 위도와 경도/)
  await assert.rejects(fetchNearbyPlaces({ name: '좌표 없음' }), /유효한 위도와 경도/)
  await assert.rejects(fetchDestinationForecast({ name: '좌표 없음' }), /유효한 위도와 경도/)
  await assert.rejects(fetchDestinationClimate({ name: '좌표 없음' }), /유효한 위도와 경도/)
})

test('여행지 예보는 공용 Open-Meteo 모델로 최대 16일을 요청한다', async () => {
  const originalGet = axios.get
  const controller = new AbortController()
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return { data: { utc_offset_seconds: 0, hourly: { time: [] }, daily: { time: [] } } }
  }

  let result
  try {
    result = await fetchDestinationForecast(destination, { signal: controller.signal })
  } finally {
    axios.get = originalGet
  }

  assert.equal(capturedRequest.url, 'https://api.open-meteo.com/v1/forecast')
  assert.equal(capturedRequest.config.params.forecast_days, 16)
  assert.equal(capturedRequest.config.signal, controller.signal)
  assert.deepEqual(result, { timezoneOffset: 0, hourly: [], daily: [] })
})

test('NASA POWER 기후 응답을 12개월과 연간 지표·기간·출처로 안전하게 매핑한다', () => {
  const periodKeys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'ANN']
  const values = (base) => Object.fromEntries(periodKeys.map((key, index) => [key, base + index]))
  const payload = {
    properties: {
      parameter: {
        T2M: { ...values(1), FEB: -999 },
        T2M_MAX: values(11),
        T2M_MIN: values(-9),
        PRECTOTCORR: values(0.5),
        RH2M: values(60),
        WS10M: values(2),
      },
    },
    header: {
      api: { version: 'v2.9.7' },
      sources: ['MERRA2', 'POWER', null],
      fill_value: -999,
      time_standard: 'LST',
      range: '30-year Meteorological and Solar Monthly & Annual Climatologies (January 1991 - December 2020)',
    },
    parameters: {
      T2M: { units: 'C' },
      T2M_MAX: { units: 'C' },
      T2M_MIN: { units: 'C' },
      PRECTOTCORR: { units: 'mm/day' },
      RH2M: { units: '%' },
      WS10M: { units: 'm/s' },
    },
  }

  const result = mapClimateResponse(payload)

  assert.deepEqual(
    result.months.map(({ key }) => key),
    ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  )
  assert.deepEqual(result.months[0], {
    key: 'JAN',
    month: 1,
    label: '1월',
    temperature: 1,
    maxTemperature: 11,
    minTemperature: -9,
    precipitation: 0.5,
    humidity: 60,
    windSpeed: 2,
  })
  assert.equal(result.months[1].temperature, null)
  assert.deepEqual(result.annual, {
    key: 'ANN',
    month: null,
    label: '연간',
    temperature: 13,
    maxTemperature: 23,
    minTemperature: 3,
    precipitation: 12.5,
    humidity: 72,
    windSpeed: 14,
  })
  assert.deepEqual(result.period, {
    startYear: 1991,
    endYear: 2020,
    label: '1991–2020',
    range: payload.header.range,
  })
  assert.deepEqual(result.units, {
    temperature: 'C',
    maxTemperature: 'C',
    minTemperature: 'C',
    precipitation: 'mm/day',
    humidity: '%',
    windSpeed: 'm/s',
  })
  assert.equal(result.source, 'NASA POWER')
  assert.equal(result.sourceUrl, 'https://power.larc.nasa.gov/')
  assert.equal(result.apiUrl, 'https://power.larc.nasa.gov/api/temporal/climatology/point')
  assert.deepEqual(result.sourceDatasets, ['MERRA2', 'POWER'])
  assert.equal(result.timeStandard, 'LST')
  assert.equal(result.apiVersion, 'v2.9.7')
})

test('NASA POWER의 기본 Climatology 기간과 6개 기후 지표를 요청한다', async () => {
  const originalGet = axios.get
  const controller = new AbortController()
  let capturedRequest
  axios.get = async (url, config) => {
    capturedRequest = { url, config }
    return { data: {} }
  }

  let result
  try {
    result = await fetchDestinationClimate(destination, { signal: controller.signal })
  } finally {
    axios.get = originalGet
  }

  assert.equal(capturedRequest.url, 'https://power.larc.nasa.gov/api/temporal/climatology/point')
  assert.deepEqual(capturedRequest.config.params, {
    parameters: 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS10M',
    community: 'RE',
    longitude: 126.978,
    latitude: 37.5665,
    format: 'JSON',
  })
  assert.equal(capturedRequest.config.timeout, 30_000)
  assert.equal(capturedRequest.config.signal, controller.signal)
  assert.equal(result.months.length, 12)
  assert.equal(result.annual.temperature, null)
  assert.deepEqual(result.period, {
    startYear: 2001,
    endYear: 2020,
    label: '2001–2020',
    range: null,
  })
  assert.equal(result.sourceUrl, 'https://power.larc.nasa.gov/')
})
