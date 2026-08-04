import assert from 'node:assert/strict'
import test from 'node:test'

import { CITY_CONFIG, CITY_REGIONS, findCityConfig } from '../src/data/cities.js'

const EXPECTED_CITIES = [
  ['city_01', '서울', 'KR', 'asia'],
  ['city_02', '도쿄', 'JP', 'asia'],
  ['city_03', '싱가포르', 'SG', 'asia'],
  ['city_04', '시드니', 'AU', 'oceania'],
  ['city_05', '두바이', 'AE', 'middle-east'],
  ['city_06', '런던', 'GB', 'europe'],
  ['city_07', '파리', 'FR', 'europe'],
  ['city_08', '뉴욕', 'US', 'americas'],
  ['city_09', '밴쿠버', 'CA', 'americas'],
  ['city_10', '멕시코시티', 'MX', 'americas'],
  ['city_11', '상파울루', 'BR', 'americas'],
  ['city_12', '케이프타운', 'ZA', 'africa'],
  ['city_13', '베이징', 'CN', 'asia'],
  ['city_14', '상하이', 'CN', 'asia'],
  ['city_15', '홍콩', 'HK', 'asia'],
  ['city_16', '방콕', 'TH', 'asia'],
  ['city_17', '뭄바이', 'IN', 'asia'],
  ['city_18', '베를린', 'DE', 'europe'],
  ['city_19', '마드리드', 'ES', 'europe'],
  ['city_20', '로마', 'IT', 'europe'],
  ['city_21', '암스테르담', 'NL', 'europe'],
  ['city_22', '모스크바', 'RU', 'europe'],
  ['city_23', '이스탄불', 'TR', 'europe'],
  ['city_24', '로스앤젤레스', 'US', 'americas'],
  ['city_25', '토론토', 'CA', 'americas'],
  ['city_26', '부에노스아이레스', 'AR', 'americas'],
  ['city_27', '리마', 'PE', 'americas'],
  ['city_28', '아부다비', 'AE', 'middle-east'],
  ['city_29', '리야드', 'SA', 'middle-east'],
  ['city_30', '도하', 'QA', 'middle-east'],
  ['city_31', '뉴델리', 'IN', 'asia'],
  ['city_32', '자카르타', 'ID', 'asia'],
  ['city_33', '암만', 'JO', 'middle-east'],
  ['city_34', '텔아비브', 'IL', 'middle-east'],
  ['city_35', '멜버른', 'AU', 'oceania'],
  ['city_36', '브리즈번', 'AU', 'oceania'],
  ['city_37', '쿠알라룸푸르', 'MY', 'asia'],
  ['city_38', '오클랜드', 'NZ', 'oceania'],
  ['city_39', '마닐라', 'PH', 'asia'],
  ['city_40', '빈', 'AT', 'europe'],
  ['city_41', '리우데자네이루', 'BR', 'americas'],
  ['city_42', '카이로', 'EG', 'africa'],
  ['city_43', '라고스', 'NG', 'africa'],
  ['city_44', '나이로비', 'KE', 'africa'],
  ['city_45', '요하네스버그', 'ZA', 'africa'],
  ['city_46', '카사블랑카', 'MA', 'africa'],
  ['city_47', '시카고', 'US', 'americas'],
  ['city_48', '아디스아바바', 'ET', 'africa'],
]

test('세계 날씨 목록에 48개 주요 도시를 안정적인 순서와 지역으로 제공한다', () => {
  assert.deepEqual(
    CITY_CONFIG.map(({ id, name, countryCode, region }) => [id, name, countryCode, region]),
    EXPECTED_CITIES,
  )
})

test('각 세계 도시의 식별자·도시명·좌표가 고유하고 필터 지역이 유효하다', () => {
  const regionIds = new Set(CITY_REGIONS.map(({ id }) => id))
  const regionCounts = Object.fromEntries(CITY_REGIONS.filter(({ id }) => id !== 'all').map(({ id }) => [id, CITY_CONFIG.filter((city) => city.region === id).length]))

  assert.equal(new Set(CITY_CONFIG.map(({ id }) => id)).size, CITY_CONFIG.length)
  assert.equal(new Set(CITY_CONFIG.map(({ name }) => name)).size, CITY_CONFIG.length)
  assert.equal(new Set(CITY_CONFIG.map(({ displayName }) => displayName)).size, CITY_CONFIG.length)
  assert.equal(new Set(CITY_CONFIG.map(({ latitude, longitude }) => `${latitude},${longitude}`)).size, CITY_CONFIG.length)
  assert.deepEqual(regionCounts, {
    asia: 12,
    europe: 9,
    americas: 10,
    'middle-east': 6,
    oceania: 4,
    africa: 7,
  })

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
  assert.equal(findCityConfig('city_48')?.fullName, '에티오피아 아디스아바바')
  assert.equal(findCityConfig('city_99'), undefined)
})
