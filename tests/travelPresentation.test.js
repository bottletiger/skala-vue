import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('여행 기후 참고는 목적지 현지 기준으로 예보가 빠진 미래 날짜에만 사용한다', () => {
  const planner = readSource('../src/views/TravelPlannerView.vue')
  const summary = readSource('../src/components/travel/TravelWeatherSummary.vue')

  assert.match(planner, /const destinationToday = computed\(\(\) => formatDateInTimezone\(selectedDestination\.value\?\.timezone\)\)/)
  assert.match(planner, /const missingForecastDates = computed\(\(\) => plannedDates\.value\.filter/)
  assert.match(planner, /missingForecastDates\.value\.every\(\(date\) => date > destinationToday\.value\)/)
  assert.match(planner, /new Set\(missingForecastDates\.value\.map\(\(date\) => Number\(date\.slice\(5, 7\)\)\)\)/)
  assert.match(planner, /const hasCompleteWeatherContext = computed/)
  assert.match(planner, /plannedDates\.value\.length &&[\s\S]*hasCompleteWeatherContext\.value/)
  assert.match(planner, /:climate="climateReference"/)
  assert.match(planner, /:climate-dates="missingForecastDates"/)
  assert.match(planner, /:error-message="weatherContextError"/)
  assert.match(planner, /@retry="retryDestinationContext"/)
  assert.match(summary, /defineEmits\(\['retry'\]\)/)
  assert.match(summary, /예보가 없는 \{\{ climateDateLabel \}\}에만 과거 기후 참고를 사용합니다\./)
  assert.match(summary, /aria-label="여행지 예보 다시 불러오기"/)
})

test('날씨 준비 기본 안내는 빈 수치를 0으로 바꾸지 않는다', () => {
  const source = readSource('../src/components/weather/WeatherAdvicePanel.vue')

  assert.match(source, /if \(value === null \|\| value === undefined\) return null/)
  assert.match(source, /typeof value === 'string' && !value\.trim\(\)/)
  assert.match(source, /return Number\.isFinite\(number\) \? number : null/)
  assert.match(source, /temperature: firstFiniteNumber\(/)
  assert.match(source, /outfit\.push\('기온 변화에 대응하기 쉬운 겹쳐 입기'\)/)
  assert.doesNotMatch(source, /temperature:\s*Number\(props\.weather/)
  assert.doesNotMatch(source, /humidity:\s*Number\(props\.weather/)
})

test('웹 여행 정보는 문장 바로 옆에 검증된 출처 링크를 표시하고 이전 캐시는 구분한다', () => {
  const source = readSource('../src/components/travel/ItineraryResult.vue')

  assert.match(source, /const sourceTitleMap = computed/)
  assert.match(source, /const sourceUrls = item\.sourceUrls \?\? item\.source_urls/)
  assert.match(source, /return text && sourceLinks\.length \? \{ text, sourceLinks, isLegacy: false \} : null/)
  assert.match(source, /이전 저장 결과 · 출처 연결 없음/)
  assert.match(source, /class="claim-citations" aria-label="이 문장의 출처"/)
  assert.match(source, /rel="noopener noreferrer"/)
  assert.match(source, /:aria-label="`\$\{source\.title\} 출처를 새 창에서 열기`"/)
  assert.match(source, /const footerSources = computed/)

  const briefStart = source.indexOf('class="travel-brief"')
  const inlineSource = source.indexOf('class="claim-citations"')
  const footer = source.indexOf('class="itinerary-sources"')
  assert.ok(briefStart >= 0 && inlineSource > briefStart && footer > inlineSource)
})
