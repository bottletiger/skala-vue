import assert from 'node:assert/strict'
import test from 'node:test'

import { CITY_CONFIG, findCityConfig } from '../src/data/cities.js'

const EXPECTED_CITIES = [
  ['city_01', '서울'],
  ['city_02', '수원'],
  ['city_10', '세종'],
  ['city_04', '인천'],
  ['city_03', '부산'],
  ['city_05', '대전'],
  ['city_06', '대구'],
  ['city_07', '광주'],
  ['city_08', '울산'],
  ['city_09', '제주'],
]

test('날씨 목록에 기존 도시와 추가 주요 도시를 안정적인 순서로 제공한다', () => {
  assert.deepEqual(
    CITY_CONFIG.map(({ id, name }) => [id, name]),
    EXPECTED_CITIES,
  )
})

test('각 도시의 식별자와 이름 및 좌표가 고유하고 OpenWeatherMap 좌표 범위에 들어간다', () => {
  assert.equal(new Set(CITY_CONFIG.map(({ id }) => id)).size, CITY_CONFIG.length)
  assert.equal(new Set(CITY_CONFIG.map(({ name }) => name)).size, CITY_CONFIG.length)
  assert.equal(new Set(CITY_CONFIG.map(({ latitude, longitude }) => `${latitude},${longitude}`)).size, CITY_CONFIG.length)

  for (const city of CITY_CONFIG) {
    assert.match(city.id, /^city_\d{2}$/)
    assert.ok(city.fullName.startsWith('대한민국 '))
    assert.ok(Number.isFinite(city.latitude) && city.latitude >= -90 && city.latitude <= 90)
    assert.ok(Number.isFinite(city.longitude) && city.longitude >= -180 && city.longitude <= 180)
  }
})

test('고유 도시 ID로 설정을 조회하고 알 수 없는 ID에는 undefined를 반환한다', () => {
  assert.equal(findCityConfig('city_04')?.name, '인천')
  assert.equal(findCityConfig('city_09')?.fullName, '대한민국 제주특별자치도 제주시')
  assert.equal(findCityConfig('city_10')?.fullName, '대한민국 세종특별자치시')
  assert.equal(findCityConfig('city_99'), undefined)
})
