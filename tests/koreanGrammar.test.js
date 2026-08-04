import assert from 'node:assert/strict'
import test from 'node:test'

import { formatKoreanSelectionMessage, getKoreanSubjectParticle } from '../src/utils/koreanGrammar.js'

test('도시 한글 이름의 마지막 음절 받침에 따라 주격 조사 이·가를 선택한다', () => {
  assert.equal(getKoreanSubjectParticle('두바이'), '가')
  assert.equal(getKoreanSubjectParticle('런던'), '이')
  assert.equal(getKoreanSubjectParticle('도쿄'), '가')
  assert.equal(getKoreanSubjectParticle('뉴욕'), '이')
  assert.equal(getKoreanSubjectParticle('서울  '), '이')
  assert.equal(getKoreanSubjectParticle('도쿄'), '가')
})

test('영문 표시명에는 한글 발음을 기준으로 조사를 붙인다', () => {
  assert.equal(formatKoreanSelectionMessage('DUBAI', '두바이'), 'DUBAI가 선택되었습니다.')
  assert.equal(formatKoreanSelectionMessage('LONDON', '런던'), 'LONDON이 선택되었습니다.')
  assert.equal(formatKoreanSelectionMessage('TOKYO', '도쿄'), 'TOKYO가 선택되었습니다.')
  assert.equal(formatKoreanSelectionMessage('NEW YORK', '뉴욕'), 'NEW YORK이 선택되었습니다.')
})

test('현재 위치처럼 한글 발음이 없는 이름은 조사 없는 안전한 문장으로 표시한다', () => {
  assert.equal(getKoreanSubjectParticle('Seongnam'), '')
  assert.equal(formatKoreanSelectionMessage('SEONGNAM', 'Seongnam'), 'SEONGNAM 선택을 완료했습니다.')
  assert.equal(formatKoreanSelectionMessage('현재 위치', ''), '현재 위치 선택을 완료했습니다.')
})
