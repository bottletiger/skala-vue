import assert from 'node:assert/strict'
import test from 'node:test'

import { formatWeatherDateTime, formatWeatherTime, getWeatherCategory, getWeatherTheme, isNightObservation } from '../src/utils/weatherTheme.js'

const relativeLuminance = (hexColor) => {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hexColor.slice(index, index + 2), 16) / 255).map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

const contrastRatio = (foreground, background) => {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)

  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

test('날씨 condition, id, icon을 우선순위에 따라 분류한다', () => {
  assert.equal(getWeatherCategory({ condition: 'Clear', conditionId: 501, iconCode: '11d' }), 'clear')
  assert.equal(getWeatherCategory({ conditionId: 202 }), 'thunderstorm')
  assert.equal(getWeatherCategory({ conditionId: 321 }), 'rain')
  assert.equal(getWeatherCategory({ conditionId: 601 }), 'snow')
  assert.equal(getWeatherCategory({ conditionId: 741 }), 'mist')
  assert.equal(getWeatherCategory({ conditionId: 803 }), 'clouds')
  assert.equal(getWeatherCategory({ iconCode: '10d' }), 'rain')
  assert.equal(getWeatherCategory({ condition: 'Unknown', conditionId: 999 }), 'neutral')
  assert.equal(getWeatherCategory(null), 'neutral')
})

test('일출과 일몰 epoch 경계로 밤을 판정한다', () => {
  const daylight = { sunrise: 200, sunset: 300, iconCode: '01n' }

  assert.equal(isNightObservation({ ...daylight, observedAt: 199 }), true)
  assert.equal(isNightObservation({ ...daylight, observedAt: 200 }), false)
  assert.equal(isNightObservation({ ...daylight, observedAt: 299 }), false)
  assert.equal(isNightObservation({ ...daylight, observedAt: 300 }), true)
})

test('epoch 정보가 불완전할 때만 야간 iconCode를 보조 판정에 사용한다', () => {
  assert.equal(isNightObservation({ iconCode: '01n' }), true)
  assert.equal(isNightObservation({ observedAt: 250, sunrise: 200, sunset: 300, iconCode: '01n' }), false)
  assert.equal(isNightObservation({ iconCode: '01d' }), false)
  assert.equal(isNightObservation({}), false)
})

test('밤에는 실제 기상 category를 유지하면서 night 팔레트를 우선한다', () => {
  const theme = getWeatherTheme({ condition: 'Thunderstorm', iconCode: '11n' })

  assert.deepEqual(theme, {
    name: 'night',
    category: 'thunderstorm',
    isNight: true,
    label: '밤',
    cssVariables: {
      '--hero-start': '#1E2B36',
      '--hero-end': '#354653',
      '--weather-accent': '#D5B56B',
      '--hero-text': '#F2F4F2',
      '--hero-muted': '#C8D0D1',
    },
  })
})

test('누락 날씨에는 neutral 테마를 반환한다', () => {
  assert.deepEqual(getWeatherTheme(), {
    name: 'neutral',
    category: 'neutral',
    isNight: false,
    label: '현재 날씨',
    cssVariables: {
      '--hero-start': '#B7C4C1',
      '--hero-end': '#DDE0DA',
      '--weather-accent': '#60736D',
      '--hero-text': '#1C292F',
      '--hero-muted': '#3F4F55',
    },
  })
})

test('모든 주간 Hero 테마의 작은 보조 글자가 양쪽 배경에서 4.5:1 대비를 유지한다', () => {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Mist', 'Thunderstorm']

  for (const condition of conditions) {
    const { cssVariables } = getWeatherTheme({ condition })
    const muted = cssVariables['--hero-muted']

    assert.ok(contrastRatio(muted, cssVariables['--hero-start']) >= 4.5, `${condition} 시작색 대비`)
    assert.ok(contrastRatio(muted, cssVariables['--hero-end']) >= 4.5, `${condition} 끝색 대비`)
  }
})

test('모든 Hero 테마의 주요 버튼 전경과 배경이 4.5:1 대비를 유지한다', () => {
  const themes = [
    getWeatherTheme(),
    ...['Clear', 'Clouds', 'Rain', 'Snow', 'Mist', 'Thunderstorm'].map((condition) => getWeatherTheme({ condition })),
    getWeatherTheme({ condition: 'Clear', iconCode: '01n' }),
  ]

  for (const theme of themes) {
    const foreground = theme.cssVariables['--hero-start']
    const background = theme.cssVariables['--hero-text']

    assert.ok(contrastRatio(foreground, background) >= 4.5, `${theme.name} 주요 버튼 대비`)
  }
})

test('도시 timezone offset을 적용해 날짜 경계를 고정 형식으로 표시한다', () => {
  const midnightUtc = 1_704_067_200

  assert.equal(formatWeatherDateTime(midnightUtc, 9 * 60 * 60), '2024. 01. 01. 09:00')
  assert.equal(formatWeatherDateTime(midnightUtc, -5 * 60 * 60), '2023. 12. 31. 19:00')
  assert.equal(formatWeatherTime(midnightUtc, 5.5 * 60 * 60), '05:30')
})

test('timestamp 또는 timezone offset이 누락되거나 유효하지 않으면 명시적으로 표시한다', () => {
  assert.equal(formatWeatherDateTime(undefined, 0), '정보 없음')
  assert.equal(formatWeatherDateTime(1_704_067_200, null), '정보 없음')
  assert.equal(formatWeatherTime(Number.NaN, 0), '정보 없음')
  assert.equal(formatWeatherTime(1_704_067_200, Number.POSITIVE_INFINITY), '정보 없음')
})
