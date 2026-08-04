import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const iconSource = readFileSync(new URL('../src/components/weather/WeatherConditionIcon.vue', import.meta.url), 'utf8')

test('공통 날씨 아이콘은 기존 SVG 접근성과 고유 ID 없는 반복 렌더링 구조를 유지한다', () => {
  assert.match(iconSource, /<svg class="weather-condition-icon" viewBox="0 0 96 96" fill="none" aria-hidden="true">/)
  assert.match(iconSource, /stroke:\s*currentcolor;/)
  assert.doesNotMatch(iconSource, /<(?:linearGradient|radialGradient)\b|\sid=/)
  assert.doesNotMatch(iconSource, /@keyframes|animation:|transition:/)
})

test('해·구름·비·눈·번개·달·별·안개 요소를 구분된 색상 클래스로 표시한다', () => {
  const elementClasses = [
    'weather-element--sun',
    'weather-element--cloud',
    'weather-element--rain',
    'weather-element--snow',
    'weather-element--lightning',
    'weather-element--moon',
    'weather-element--star',
    'weather-element--mist-primary',
    'weather-element--mist-secondary',
  ]

  for (const className of elementClasses) {
    assert.match(iconSource, new RegExp(`class="[^"]*${className}`))
    assert.match(iconSource, new RegExp(`\\.${className}\\s*\\{`))
  }

  assert.match(iconSource, /--weather-icon-sun:[^;]*#d5a13d[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-cloud-outline:[^;]*#718d9b[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-cloud-fill:[^;]*#a8bbc4[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-rain:[^;]*#4f9ec8[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-snow:[^;]*#82cedd[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-lightning:[^;]*#e1ae3f[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-moon:[^;]*#bbb9de[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-star:[^;]*#f0d89c[^;]*currentcolor[^;]*;/)
})

test('구름은 cool tone fill과 outline을 겹치고 안개선은 두 cool tone으로 교차한다', () => {
  assert.match(iconSource, /\.weather-element--cloud\s*\{[^}]*fill:[^}]*--weather-icon-cloud-fill[^}]*stroke:[^}]*--weather-icon-cloud-outline/s)
  assert.match(iconSource, /class="weather-element--mist-primary" d="M20 32h48M20 58h48"/)
  assert.match(iconSource, /class="weather-element--mist-secondary" d="M28 45h48M28 71h48"/)
  assert.match(iconSource, /--weather-icon-mist-primary:[^;]*currentcolor[^;]*;/)
  assert.match(iconSource, /--weather-icon-mist-secondary:[^;]*currentcolor[^;]*;/)
})
