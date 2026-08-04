import assert from 'node:assert/strict'
import test from 'node:test'

import { CITY_CONFIG, CITY_REGIONS, findCityConfig } from '../src/data/cities.js'

const EXPECTED_CITIES = [
  ['city_01', '서울', 'KR'],
  ['city_02', '도쿄', 'JP'],
  ['city_03', '싱가포르', 'SG'],
  ['city_04', '시드니', 'AU'],
  ['city_05', '두바이', 'AE'],
  ['city_06', '런던', 'GB'],
  ['city_07', '파리', 'FR'],
  ['city_08', '뉴욕', 'US'],
  ['city_09', '밴쿠버', 'CA'],
  ['city_10', '멕시코시티', 'MX'],
  ['city_11', '상파울루', 'BR'],
  ['city_12', '케이프타운', 'ZA'],
]

test('세계 날씨 목록에 12개국 주요 도시를 안정적인 순서로 제공한다', () => {
  assert.deepEqual(
    CITY_CONFIG.map(({ id, name, countryCode }) => [id, name, countryCode]),
    EXPECTED_CITIES,
  )
})

test('각 세계 도시의 식별자·국가·좌표가 고유하고 필터 지역이 유효하다', () => {
  const regionIds = new Set(CITY_REGIONS.map(({ id }) => id))

  assert.equal(new Set(CITY_CONFIG.map(({ id }) => id)).size, CITY_CONFIG.length)
  assert.equal(new Set(CITY_CONFIG.map(({ countryCode }) => countryCode)).size, CITY_CONFIG.length)
  assert.equal(new Set(CITY_CONFIG.map(({ latitude, longitude }) => `${latitude},${longitude}`)).size, CITY_CONFIG.length)

  for (const city of CITY_CONFIG) {
    assert.match(city.id, /^city_\d{2}$/)
    assert.match(city.countryCode, /^[A-Z]{2}$/)
    assert.match(city.displayName, /^[A-Z ]+$/)
    assert.ok(city.fullName.includes(city.name))
    assert.ok(regionIds.has(city.region))
    assert.ok(Number.isFinite(city.latitude) && city.latitude >= -90 && city.latitude <= 90)
    assert.ok(Number.isFinite(city.longitude) && city.longitude >= -180 && city.longitude <= 180)
  }
})

test('고유 도시 ID로 세계 도시 설정을 조회하고 알 수 없는 ID에는 undefined를 반환한다', () => {
  assert.equal(findCityConfig('city_02')?.name, '도쿄')
  assert.equal(findCityConfig('city_06')?.fullName, '영국 런던')
  assert.equal(findCityConfig('city_12')?.countryName, '남아프리카공화국')
  assert.equal(findCityConfig('city_99'), undefined)
})
