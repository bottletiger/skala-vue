import assert from 'node:assert/strict'
import test from 'node:test'

import { getWeatherRequestErrorMessage } from '../src/services/weatherErrors.js'

test('날씨 요청 오류를 사용자가 대응할 수 있는 안내 문구로 변환한다', () => {
  assert.equal(getWeatherRequestErrorMessage({ response: { status: 429 } }, 'fallback'), '날씨 데이터 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
  assert.equal(
    getWeatherRequestErrorMessage(
      {
        response: {
          status: 429,
          data: { reason: 'Daily API request limit exceeded. Please try again tomorrow.' },
        },
      },
      'fallback',
    ),
    '오늘 사용할 수 있는 날씨 데이터 요청량을 모두 사용했습니다. 내일 다시 확인해 주세요.',
  )
  assert.equal(getWeatherRequestErrorMessage({ code: 'ECONNABORTED' }, 'fallback'), '날씨 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.')
  assert.equal(getWeatherRequestErrorMessage({ code: 'ERR_NETWORK' }, 'fallback'), '날씨 서비스에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.')
  assert.equal(getWeatherRequestErrorMessage(new Error('unknown'), 'fallback'), 'fallback')
})
