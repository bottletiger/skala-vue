import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('여행 날짜는 브라우저 기본 입력 대신 접근 가능한 서비스 달력을 사용한다', () => {
  const form = readSource('../src/components/travel/TravelPreferencesForm.vue')
  const calendar = readSource('../src/components/travel/TravelDateRangePicker.vue')

  assert.match(form, /import TravelDateRangePicker/)
  assert.match(form, /<TravelDateRangePicker/)
  assert.doesNotMatch(form, /type="date"/)
  assert.match(calendar, /const MAX_TRIP_DAYS = 14/)
  assert.match(calendar, /role="dialog" aria-label="여행 날짜 선택"/)
  assert.match(calendar, /role="grid"/)
  assert.match(calendar, /class="calendar-week" role="row"/)
  assert.match(calendar, /role="gridcell"/)
  assert.match(calendar, /:tabindex="date\.iso === focusedDate \? 0 : -1"/)
  assert.match(calendar, /@keydown="moveDayFocus\(\$event, date\.iso\)"/)
  assert.match(calendar, /@keydown\.esc\.stop="closeCalendar"/)
  assert.match(calendar, /prefers-reduced-motion: reduce/)
})

test('여행 속도 선택 배경은 선택 위치로 슬라이드한다', () => {
  const form = readSource('../src/components/travel/TravelPreferencesForm.vue')

  assert.match(form, /const paceIndex = computed/)
  assert.match(form, /class="pace-indicator" aria-hidden="true"/)
  assert.match(form, /role="group" aria-label="여행 속도"/)
  assert.match(form, /--pace-index/)
  assert.match(form, /transform: translateX\(calc\(var\(--pace-index\) \* 100%\)\)/)
  assert.match(form, /cubic-bezier\(0\.22, 1, 0\.36, 1\)/)
  assert.match(form, /\.pace-indicator,[\s\S]*transition: none/)
})

test('429 원문 오류를 서비스별 사용자 문구로 정규화한다', () => {
  const planner = readSource('../src/views/TravelPlannerView.vue')
  const tripsService = readSource('../src/services/tripsService.js')

  assert.match(planner, /getWeatherRequestErrorMessage\(/)
  assert.match(planner, /error\?\.code === 'AI_PROVIDER_RATE_LIMITED' \|\| error\?\.status === 429/)
  assert.match(tripsService, /code === 'AI_PROVIDER_RATE_LIMITED' \|\| status === 429/)
  assert.match(tripsService, /typeof response\.clone === 'function'/)
  assert.match(planner, /return fallback/)
  assert.doesNotMatch(tripsService, /let message = error\?\.message/)
  assert.doesNotMatch(planner, /Request failed with status code 429/)
})

test('직접 실행한 여행지 검색은 예약된 debounce 요청을 취소한다', () => {
  const planner = readSource('../src/views/TravelPlannerView.vue')

  assert.match(planner, /const runDestinationSearch = async \(\) => \{\s*window\.clearTimeout\(searchTimer\)\s*searchTimer = 0/)
})
