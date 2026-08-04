import assert from 'node:assert/strict'
import test from 'node:test'

import { formatForecastDateParts, formatForecastDay, getForecastVisual, toIsoDateTime } from '../src/utils/forecastPresentation.js'

test('시간대별·일별 예보가 같은 날씨 표현 규칙을 사용한다', () => {
  assert.deepEqual(
    getForecastVisual({
      weatherMain: 'Rain',
      weatherId: 500,
      icon: '10n',
      weatherDescription: '약한 비',
      precipitationProbability: 40,
    }),
    {
      category: 'rain',
      isNight: true,
      conditionLabel: '약한 비',
      precipitation: 40,
    },
  )

  assert.deepEqual(getForecastVisual({ precipitationProbability: Number.NaN }), {
    category: 'neutral',
    isNight: false,
    conditionLabel: '현재 날씨',
    precipitation: null,
  })
})

test('예보 날짜는 도시 timezone offset을 적용하고 잘못된 값은 기존 대체 문구로 표시한다', () => {
  const timestamp = Date.parse('2024-01-01T23:30:00Z') / 1000

  assert.match(formatForecastDay(timestamp, 9 * 60 * 60), /1\.\s*2\./)
  assert.deepEqual(formatForecastDateParts(timestamp, 9 * 60 * 60), {
    weekday: '화',
    dateLabel: '1. 2.',
    dateTime: '2024-01-02',
  })
  assert.equal(formatForecastDay(null, 0), '날짜 정보 없음')
  assert.deepEqual(formatForecastDateParts(null, 0), {
    weekday: '날짜 없음',
    dateLabel: '',
    dateTime: undefined,
  })
  assert.equal(toIsoDateTime(null), undefined)
})
