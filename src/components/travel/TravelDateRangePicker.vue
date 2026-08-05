<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  startDate: {
    type: String,
    default: '',
  },
  endDate: {
    type: String,
    default: '',
  },
  minDate: {
    type: String,
    default: '',
  },
  maxDate: {
    type: String,
    default: '',
  },
  maxEndDate: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:range'])

const root = ref(null)
const startTrigger = ref(null)
const endTrigger = ref(null)
const isOpen = ref(false)
const activeField = ref('start')
const focusedDate = ref('')

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_IN_MS = 86_400_000
const MAX_TRIP_DAYS = 14
const weekdays = Object.freeze(['일', '월', '화', '수', '목', '금', '토'])

const localToday = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseIsoDate = (value) => {
  if (!ISO_DATE_PATTERN.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

const toIsoDate = (date) => date.toISOString().slice(0, 10)
const addDays = (value, amount) => {
  const date = parseIsoDate(value)
  return date ? toIsoDate(new Date(date.getTime() + amount * DAY_IN_MS)) : ''
}
const startOfMonth = (value) => {
  const date = typeof value === 'string' ? parseIsoDate(value) : value
  if (!date) return parseIsoDate(localToday())
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}
const addMonths = (date, amount) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))

const initialDate = props.startDate || props.minDate || localToday()
const viewMonth = ref(startOfMonth(initialDate))

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(viewMonth.value),
)

const formatSelectedDate = (value) => {
  const date = parseIsoDate(value)
  if (!date) return '날짜 선택'
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(date)
}

const endLimit = computed(() => {
  if (!props.startDate) return props.maxDate
  const tripLimit = addDays(props.startDate, MAX_TRIP_DAYS - 1)
  return [props.maxEndDate, props.maxDate, tripLimit].filter(Boolean).sort()[0] || tripLimit
})

const calendarDays = computed(() => {
  const firstDayOffset = viewMonth.value.getUTCDay()
  const gridStart = new Date(viewMonth.value.getTime() - firstDayOffset * DAY_IN_MS)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getTime() + index * DAY_IN_MS)
    const iso = toIsoDate(date)
    return {
      iso,
      day: date.getUTCDate(),
      outsideMonth: date.getUTCMonth() !== viewMonth.value.getUTCMonth(),
    }
  })
})
const calendarWeeks = computed(() =>
  Array.from({ length: 6 }, (_, index) => calendarDays.value.slice(index * 7, index * 7 + 7)),
)

const selectionHint = computed(() => (activeField.value === 'start' ? '출발일을 선택하세요.' : `도착일을 선택하세요. 최대 ${MAX_TRIP_DAYS}일까지 계획할 수 있습니다.`))

const currentMonthIso = computed(() => toIsoDate(viewMonth.value))
const minMonthIso = computed(() => toIsoDate(startOfMonth(props.minDate || localToday())))
const maxMonthIso = computed(() => toIsoDate(startOfMonth(props.maxDate || addDays(localToday(), 365))))
const canGoPrevious = computed(() => currentMonthIso.value > minMonthIso.value)
const canGoNext = computed(() => currentMonthIso.value < maxMonthIso.value)

const isDateDisabled = (date) => {
  if (props.minDate && date < props.minDate) return true
  if (props.maxDate && date > props.maxDate) return true
  if (activeField.value === 'end' && props.startDate) {
    return date < props.startDate || (endLimit.value && date > endLimit.value)
  }
  return false
}

const isInRange = (date) => Boolean(props.startDate && props.endDate && date > props.startDate && date < props.endDate)

const openFor = (field) => {
  if (props.disabled) return
  activeField.value = field
  isOpen.value = true
  const selected = field === 'end' ? props.endDate || props.startDate : props.startDate
  viewMonth.value = startOfMonth(selected || props.minDate || localToday())
  focusedDate.value = selected || props.minDate || localToday()
  void nextTick(() => {
    root.value?.querySelector(`[data-calendar-date="${focusedDate.value}"]`)?.focus()
  })
}

const closeCalendar = () => {
  isOpen.value = false
  void nextTick(() => {
    const trigger = activeField.value === 'end' ? endTrigger.value : startTrigger.value
    trigger?.focus()
  })
}

const selectDate = (date) => {
  if (isDateDisabled(date)) return

  if (activeField.value === 'start') {
    const latestEnd = [props.maxDate, addDays(date, MAX_TRIP_DAYS - 1)].filter(Boolean).sort()[0]
    const nextEnd = !props.endDate || props.endDate < date || props.endDate > latestEnd ? date : props.endDate
    emit('update:range', { startDate: date, endDate: nextEnd })
    activeField.value = 'end'
    return
  }

  emit('update:range', { startDate: props.startDate, endDate: date })
  closeCalendar()
}

const changeMonth = (amount) => {
  const nextMonth = addMonths(viewMonth.value, amount)
  const nextIso = toIsoDate(nextMonth)
  if (nextIso < minMonthIso.value || nextIso > maxMonthIso.value) return
  viewMonth.value = nextMonth
}

const focusDate = async (date) => {
  if (date < (props.minDate || date)) date = props.minDate
  const maximum = activeField.value === 'end' ? endLimit.value : props.maxDate
  if (maximum && date > maximum) date = maximum
  if (activeField.value === 'end' && props.startDate && date < props.startDate) date = props.startDate

  focusedDate.value = date
  viewMonth.value = startOfMonth(date)
  await nextTick()
  root.value?.querySelector(`[data-calendar-date="${date}"]`)?.focus()
}

const moveDayFocus = (event, date) => {
  const parsed = parseIsoDate(date)
  if (!parsed) return

  let target = ''
  if (event.key === 'ArrowLeft') target = addDays(date, -1)
  if (event.key === 'ArrowRight') target = addDays(date, 1)
  if (event.key === 'ArrowUp') target = addDays(date, -7)
  if (event.key === 'ArrowDown') target = addDays(date, 7)
  if (event.key === 'Home') target = addDays(date, -parsed.getUTCDay())
  if (event.key === 'End') target = addDays(date, 6 - parsed.getUTCDay())
  if (event.key === 'PageUp') {
    const previous = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() - 1, 1))
    const lastDay = new Date(Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth() + 1, 0)).getUTCDate()
    target = toIsoDate(new Date(Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth(), Math.min(parsed.getUTCDate(), lastDay))))
  }
  if (event.key === 'PageDown') {
    const following = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 1))
    const lastDay = new Date(Date.UTC(following.getUTCFullYear(), following.getUTCMonth() + 1, 0)).getUTCDate()
    target = toIsoDate(new Date(Date.UTC(following.getUTCFullYear(), following.getUTCMonth(), Math.min(parsed.getUTCDate(), lastDay))))
  }

  if (!target) return
  event.preventDefault()
  void focusDate(target)
}

const handleOutsidePointer = (event) => {
  if (isOpen.value && root.value && !root.value.contains(event.target)) isOpen.value = false
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) isOpen.value = false
  },
)

onMounted(() => document.addEventListener('pointerdown', handleOutsidePointer))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleOutsidePointer))
</script>

<template>
  <div ref="root" class="date-range-picker" :class="{ 'is-open': isOpen }">
    <div class="date-fields" role="group" aria-label="여행 날짜">
      <button
        ref="startTrigger"
        type="button"
        class="date-trigger"
        :class="{ 'is-active': isOpen && activeField === 'start' }"
        :disabled="disabled"
        :aria-expanded="isOpen && activeField === 'start'"
        aria-controls="travel-calendar"
        @click="openFor('start')"
      >
        <span>출발</span>
        <strong>{{ formatSelectedDate(startDate) }}</strong>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3m10-3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" /></svg>
      </button>

      <span class="date-divider" aria-hidden="true"></span>

      <button
        ref="endTrigger"
        type="button"
        class="date-trigger"
        :class="{ 'is-active': isOpen && activeField === 'end' }"
        :disabled="disabled"
        :aria-expanded="isOpen && activeField === 'end'"
        aria-controls="travel-calendar"
        @click="openFor('end')"
      >
        <span>도착</span>
        <strong>{{ formatSelectedDate(endDate) }}</strong>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3m10-3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" /></svg>
      </button>
    </div>

    <Transition name="calendar-reveal">
      <section v-if="isOpen" id="travel-calendar" class="calendar-panel" role="dialog" aria-label="여행 날짜 선택" @keydown.esc.stop="closeCalendar">
        <header class="calendar-header">
          <div>
            <span>DATE</span>
            <strong>{{ monthLabel }}</strong>
          </div>
          <div class="month-controls">
            <button type="button" :disabled="!canGoPrevious" aria-label="이전 달" @click="changeMonth(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7" /></svg>
            </button>
            <button type="button" :disabled="!canGoNext" aria-label="다음 달" @click="changeMonth(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 7 7-7 7" /></svg>
            </button>
          </div>
        </header>

        <p class="selection-hint" aria-live="polite">{{ selectionHint }}</p>

        <div class="weekday-row" aria-hidden="true">
          <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
        </div>

        <div class="calendar-grid" role="grid" :aria-label="monthLabel">
          <div v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex" class="calendar-week" role="row">
            <span
              v-for="date in week"
              :key="date.iso"
              class="calendar-cell"
              role="gridcell"
              :aria-selected="date.iso === startDate || date.iso === endDate || isInRange(date.iso)"
            >
              <button
                type="button"
                :data-calendar-date="date.iso"
                :disabled="isDateDisabled(date.iso)"
                :tabindex="date.iso === focusedDate ? 0 : -1"
                :class="{
                  'is-outside': date.outsideMonth,
                  'is-today': date.iso === localToday(),
                  'is-range-start': date.iso === startDate,
                  'is-range-end': date.iso === endDate,
                  'is-in-range': isInRange(date.iso),
                }"
                :aria-label="`${date.iso}${date.iso === startDate ? ', 출발일' : ''}${date.iso === endDate ? ', 도착일' : ''}`"
                :aria-current="date.iso === localToday() ? 'date' : undefined"
                @focus="focusedDate = date.iso"
                @click="selectDate(date.iso)"
                @keydown="moveDayFocus($event, date.iso)"
              >
                {{ date.day }}
              </button>
            </span>
          </div>
        </div>

        <footer class="calendar-footer">
          <span>출발일을 고른 뒤 도착일을 선택하세요.</span>
          <button type="button" @click="closeCalendar">완료</button>
        </footer>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.date-range-picker {
  display: grid;
  gap: 10px;
}

.date-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px minmax(0, 1fr);
  align-items: center;
}

.date-trigger {
  display: grid;
  grid-template-columns: 1fr 18px;
  min-width: 0;
  min-height: 58px;
  align-content: center;
  gap: 4px 8px;
  padding: 9px 12px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-radius: 12px;
  outline: none;
  background: color-mix(in srgb, white 8%, transparent);
  color: var(--hero-text);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.date-trigger > span {
  grid-column: 1;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 800;
}

.date-trigger > strong {
  grid-column: 1;
  overflow: hidden;
  font-size: 12px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-trigger svg {
  grid-row: 1 / 3;
  grid-column: 2;
  width: 17px;
  align-self: center;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
  opacity: 0.68;
}

.date-trigger:is(:hover, :focus-visible, .is-active) {
  border-color: color-mix(in srgb, var(--weather-accent) 54%, transparent);
  background: color-mix(in srgb, var(--hero-text) 9%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 9%, transparent);
}

.date-trigger:disabled {
  cursor: not-allowed;
}

.date-divider {
  width: 12px;
  height: 1px;
  justify-self: center;
  background: color-mix(in srgb, var(--hero-text) 28%, transparent);
}

.calendar-panel {
  width: min(100%, 420px);
  justify-self: start;
  padding: 15px;
  border: 1px solid color-mix(in srgb, white 22%, transparent);
  border-radius: 16px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--hero-start) 88%, white 12%), color-mix(in srgb, var(--hero-end) 90%, white 10%));
  box-shadow: 0 16px 34px color-mix(in srgb, var(--hero-end) 25%, transparent);
}

.calendar-header,
.calendar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.calendar-header > div:first-child {
  display: grid;
  gap: 2px;
}

.calendar-header span {
  color: var(--weather-accent);
  font-size: 8px;
  font-weight: 880;
  letter-spacing: 0.15em;
}

.calendar-header strong {
  color: var(--hero-text);
  font-size: 15px;
  font-weight: 840;
}

.month-controls {
  display: flex;
  gap: 5px;
}

.month-controls button,
.calendar-footer button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  background: color-mix(in srgb, var(--hero-text) 6%, transparent);
  color: var(--hero-text);
  cursor: pointer;
}

.month-controls button {
  width: 30px;
  height: 30px;
  border-radius: 9px;
}

.month-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.month-controls svg {
  width: 15px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.selection-hint {
  min-height: 15px;
  margin: 9px 0 10px;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 720;
  word-break: keep-all;
}

.weekday-row,
.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-grid {
  display: grid;
}

.calendar-cell {
  min-width: 0;
}

.weekday-row span {
  padding: 5px 0;
  color: var(--hero-muted);
  font-size: 8px;
  font-weight: 800;
  text-align: center;
}

.calendar-grid button {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 34px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--hero-text);
  cursor: pointer;
  font-size: 10px;
  font-weight: 760;
  transition:
    background-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.calendar-grid button:is(:hover, :focus-visible):not(:disabled):not(.is-range-start):not(.is-range-end) {
  z-index: 1;
  outline: none;
  background: color-mix(in srgb, var(--hero-text) 11%, transparent);
  transform: translateY(-1px);
}

.calendar-grid button.is-outside {
  opacity: 0.36;
}

.calendar-grid button.is-today::after {
  position: absolute;
  right: 50%;
  bottom: 4px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--weather-accent);
  content: '';
  transform: translateX(50%);
}

.calendar-grid button.is-in-range {
  border-radius: 0;
  background: color-mix(in srgb, var(--weather-accent) 13%, transparent);
}

.calendar-grid button:is(.is-range-start, .is-range-end) {
  z-index: 1;
  background: var(--hero-text);
  color: var(--hero-start);
  box-shadow: 0 5px 12px color-mix(in srgb, var(--hero-end) 25%, transparent);
}

.calendar-grid button:disabled {
  cursor: not-allowed;
  opacity: 0.18;
}

.calendar-footer {
  margin-top: 11px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
}

.calendar-footer > span {
  color: var(--hero-muted);
  font-size: 8px;
  font-weight: 700;
}

.calendar-footer button {
  min-height: 30px;
  padding: 0 11px;
  border-radius: 9px;
  font-size: 9px;
  font-weight: 820;
}

.calendar-reveal-enter-active,
.calendar-reveal-leave-active {
  overflow: hidden;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.calendar-reveal-enter-from,
.calendar-reveal-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 480px) {
  .date-fields {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .date-divider {
    display: none;
  }

  .calendar-panel {
    padding: 13px 10px;
  }

  .calendar-grid button {
    min-height: 38px;
  }

  .calendar-footer > span {
    max-width: 180px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .date-trigger,
  .calendar-grid button,
  .calendar-reveal-enter-active,
  .calendar-reveal-leave-active {
    transition: none;
  }
}
</style>
