import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'

import { HOME_WEATHER_CACHE_TTL, useHomeWeatherStore } from '../src/stores/homeWeatherStore.js'

const worldWeather = {
  id: 'city_01',
  name: 'Seoul',
  latitude: 37.5665,
  longitude: 126.978,
  observedAt: 1_785_890_400,
}

test('세계 날씨 cache는 실제 응답이 있고 30분 이내일 때만 fresh하다', () => {
  setActivePinia(createPinia())
  const store = useHomeWeatherStore()
  const loadedAt = 1_000

  assert.equal(store.hasFreshWeather(loadedAt), false)

  store.weatherList = [worldWeather]
  store.persistWorldWeather([worldWeather], loadedAt)

  assert.equal(store.hasFreshWeather(loadedAt), true)
  assert.equal(store.hasFreshWeather(loadedAt + HOME_WEATHER_CACHE_TTL), true)
  assert.equal(store.hasFreshWeather(loadedAt + HOME_WEATHER_CACHE_TTL + 1), false)
  assert.equal(store.hasFreshWeather(loadedAt - 1), false)
})

test('날씨 cache를 비워도 세계 날씨 서랍의 펼침 상태는 유지한다', () => {
  setActivePinia(createPinia())
  const store = useHomeWeatherStore()

  store.weatherList = [worldWeather]
  store.selectedCityId = 'city_02'
  store.lastUpdated = '2026. 8. 4. 오전 10:00'
  store.isWorldDrawerOpen = true
  store.persistWorldWeather([worldWeather], 2_000)
  store.clearWeatherData()

  assert.deepEqual(store.weatherList, [])
  assert.equal(store.selectedCityId, '')
  assert.equal(store.lastUpdated, '')
  assert.equal(store.weatherLoadedAt, 0)
  assert.equal(store.isWorldDrawerOpen, true)
})

test('성공한 세계 날씨 응답만 localStorage에서 새 Pinia로 복원한다', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const values = new Map()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
      },
    },
  })

  try {
    const loadedAt = Date.now()
    setActivePinia(createPinia())
    const firstStore = useHomeWeatherStore()
    firstStore.weatherList = [worldWeather]
    assert.equal(firstStore.persistWorldWeather([worldWeather], loadedAt), true)

    setActivePinia(createPinia())
    const restoredStore = useHomeWeatherStore()
    assert.deepEqual(restoredStore.weatherList, [worldWeather])
    assert.equal(restoredStore.hasFreshWeather(loadedAt), true)
    assert.equal(restoredStore.hasFreshCityWeather(worldWeather.id, loadedAt), true)
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else delete globalThis.window
  }
})
