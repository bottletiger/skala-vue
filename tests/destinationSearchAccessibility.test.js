import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/components/travel/DestinationSearch.vue', import.meta.url), 'utf8')

test('여행지 검색 입력과 결과를 ARIA combobox·listbox·option 관계로 연결한다', () => {
  assert.match(source, /role="combobox"/)
  assert.match(source, /aria-autocomplete="list"/)
  assert.match(source, /aria-haspopup="listbox"/)
  assert.match(source, /:aria-controls="listboxId"/)
  assert.match(source, /:aria-expanded="isListboxOpen"/)
  assert.match(source, /:aria-activedescendant="activeOptionId"/)
  assert.match(source, /:id="listboxId"[^>]*role="listbox"/s)
  assert.match(source, /role="option"[^>]*:aria-selected="index === activeIndex"/s)

  const optionStart = source.indexOf('role="option"')
  const optionEnd = source.indexOf('</li>', optionStart)
  assert.ok(optionStart >= 0 && optionEnd > optionStart)
  assert.doesNotMatch(source.slice(optionStart, optionEnd), /<button\b/)
})

test('DOM 포커스를 검색 입력에 둔 채 화살표·Enter·Escape로 결과를 탐색하고 선택한다', () => {
  assert.match(source, /@keydown="handleKeydown"/)
  assert.match(source, /event\.key === 'ArrowDown'[\s\S]*event\.preventDefault\(\)[\s\S]*setActiveIndex\(activeIndex\.value < 0 \? 0 : activeIndex\.value \+ 1\)/)
  assert.match(source, /event\.key === 'ArrowUp'[\s\S]*event\.preventDefault\(\)[\s\S]*setActiveIndex\(activeIndex\.value < 0 \? props\.results\.length - 1 : activeIndex\.value - 1\)/)
  assert.match(source, /event\.key === 'Enter'[\s\S]*selectDestination\(props\.results\[activeIndex\.value\]\)/)
  assert.match(source, /event\.key === 'Escape'[\s\S]*isDismissed\.value = true[\s\S]*activeIndex\.value = -1/)
  assert.match(source, /scrollIntoView\(\{ block: 'nearest' \}\)/)
})

test('결과·검색어·loading·disabled 변화에서 활성 옵션을 초기화하고 기존 emit 계약을 유지한다', () => {
  assert.match(source, /disabled:\s*\{[\s\S]*type:\s*Boolean[\s\S]*default:\s*false/)
  assert.match(source, /!props\.disabled && !props\.isLoading && !props\.selectedDestination/)
  assert.match(source, /watch\(\s*\(\) => props\.results,[\s\S]*activeIndex\.value = -1/)
  assert.match(source, /\(\) => \[props\.isLoading, props\.selectedDestination, props\.disabled\]/)
  assert.match(source, /\(\) => props\.query,[\s\S]*isDismissed\.value = false[\s\S]*activeIndex\.value = -1/)
  assert.match(source, /emit\('update:query', event\.target\.value\)/)
  assert.match(source, /emit\('search'\)/)
  assert.match(source, /emit\('select', destination\)/)
  assert.match(source, /emit\('clear'\)/)
  assert.match(source, /@mousedown\.prevent/)
  assert.match(source, /@click="selectDestination\(destination\)"/)
})
