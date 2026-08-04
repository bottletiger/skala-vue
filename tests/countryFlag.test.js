import assert from 'node:assert/strict'
import test from 'node:test'

import { getCountryFlagEmoji } from '../src/utils/countryFlag.js'

test('ISO 2자리 국가 코드를 지역 표시 국기 이모지로 변환한다', () => {
  assert.equal(getCountryFlagEmoji('kr'), '🇰🇷')
  assert.equal(getCountryFlagEmoji('US'), '🇺🇸')
  assert.equal(getCountryFlagEmoji(' ae '), '🇦🇪')
})

test('국가 코드가 없거나 유효하지 않으면 장식 국기를 표시하지 않는다', () => {
  assert.equal(getCountryFlagEmoji(), '')
  assert.equal(getCountryFlagEmoji('KOR'), '')
  assert.equal(getCountryFlagEmoji('1A'), '')
})
