import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'

import { HOME_WEATHER_CACHE_TTL, useHomeWeatherStore } from '../src/stores/homeWeatherStore.js'

test('홈 날씨 cache는 데이터가 있고 5분 이내일 때만 fresh하다', () => {
  setActivePinia(createPinia())
  const store = useHomeWeatherStore()
  const loadedAt = 1_000

  assert.equal(store.hasFreshWeather(loadedAt), false)

  store.weatherList = [{ id: 'city_01' }]
  store.markWeatherLoaded(loadedAt)

  assert.equal(store.hasFreshWeather(loadedAt), true)
  assert.equal(store.hasFreshWeather(loadedAt + HOME_WEATHER_CACHE_TTL), true)
  assert.equal(store.hasFreshWeather(loadedAt + HOME_WEATHER_CACHE_TTL + 1), false)
  assert.equal(store.hasFreshWeather(loadedAt - 1), false)
})

test('날씨 cache를 비워도 세계 날씨 서랍의 펼침 상태는 유지한다', () => {
  setActivePinia(createPinia())
  const store = useHomeWeatherStore()

  store.weatherList = [{ id: 'city_02' }]
  store.selectedCityId = 'city_02'
  store.lastUpdated = '2026. 8. 4. 오전 10:00'
  store.isWorldDrawerOpen = true
  store.markWeatherLoaded(2_000)
  store.clearWeatherData()

  assert.deepEqual(store.weatherList, [])
  assert.equal(store.selectedCityId, '')
  assert.equal(store.lastUpdated, '')
  assert.equal(store.weatherLoadedAt, 0)
  assert.equal(store.isWorldDrawerOpen, true)
})
