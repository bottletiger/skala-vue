import assert from 'node:assert/strict'
import test from 'node:test'

import { toFiniteMetric } from '../src/utils/metrics.js'
import { matchesSearchQuery, normalizeSearchQuery } from '../src/utils/search.js'
import { convertTemperature, getTemperatureCondition } from '../src/utils/temperature.js'

test('섭씨와 화씨 온도를 화면 표시용 한 자리 소수로 변환한다', () => {
  assert.equal(convertTemperature(25, 'celsius'), 25)
  assert.equal(convertTemperature(25, 'fahrenheit'), 77)
  assert.equal(convertTemperature(24.6, 'celsius'), 24.6)
  assert.equal(convertTemperature(24.6, 'fahrenheit'), 76.3)
  assert.equal(convertTemperature(undefined, 'celsius'), null)
  assert.equal(convertTemperature(null, 'celsius'), null)
  assert.equal(convertTemperature('', 'celsius'), null)
  assert.equal(convertTemperature(false, 'celsius'), null)
})

test('화면에 표시되는 섭씨 25도를 기준으로 더움과 선선함을 구분한다', () => {
  assert.equal(getTemperatureCondition(24.6)?.key, 'cool')
  assert.equal(getTemperatureCondition(24.96)?.key, 'hot')
  assert.equal(getTemperatureCondition(25)?.key, 'hot')
  assert.equal(getTemperatureCondition(null), null)
  assert.equal(getTemperatureCondition(''), null)
})

test('상세 지표는 숫자와 숫자 문자열만 유한한 값으로 정규화한다', () => {
  assert.equal(toFiniteMetric(0), 0)
  assert.equal(toFiniteMetric('21.5'), 21.5)
  assert.equal(toFiniteMetric(null), null)
  assert.equal(toFiniteMetric(''), null)
  assert.equal(toFiniteMetric(Number.POSITIVE_INFINITY), null)
})

test('한글 검색어를 NFC로 정규화하고 바깥 공백을 제거한다', () => {
  assert.equal(normalizeSearchQuery('  서울  '), '서울')
  assert.equal(normalizeSearchQuery(null), '')
})

test('한글 도시명을 초성·미완성 음절·두벌식 영문 오타로도 검색한다', () => {
  assert.equal(matchesSearchQuery('부산', 'ㅂ'), true)
  assert.equal(matchesSearchQuery('부산', '부'), true)
  assert.equal(matchesSearchQuery('부산', '부사'), true)
  assert.equal(matchesSearchQuery('부산', 'qntks'), true)
  assert.equal(matchesSearchQuery('광주', 'rhkdwn'), true)
  assert.equal(matchesSearchQuery('서울', 'qntks'), false)
})

test('기존 포함 검색과 빈 검색어 처리를 유지한다', () => {
  assert.equal(matchesSearchQuery('대한민국 서울', '서울'), true)
  assert.equal(matchesSearchQuery('대한민국 서울', '민국'), true)
  assert.equal(matchesSearchQuery('대한민국 서울', ''), true)
  assert.equal(matchesSearchQuery(null, '서울'), false)
})
