<script setup>
import { computed } from 'vue'

import TravelDateRangePicker from './TravelDateRangePicker.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
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

const emit = defineEmits(['update:modelValue'])

const paceOptions = Object.freeze([
  { value: 'relaxed', label: '여유롭게' },
  { value: 'balanced', label: '균형 있게' },
  { value: 'full', label: '알차게' },
])

const interestOptions = Object.freeze([
  { value: 'culture', label: '문화 · 역사' },
  { value: 'food', label: '음식' },
  { value: 'nature', label: '자연' },
  { value: 'shopping', label: '쇼핑' },
  { value: 'rest', label: '휴식' },
])

const paceIndex = computed(() =>
  Math.max(
    paceOptions.findIndex((option) => option.value === props.modelValue.pace),
    0,
  ),
)

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  })
}

const updateDateRange = ({ startDate, endDate }) => {
  emit('update:modelValue', {
    ...props.modelValue,
    startDate,
    endDate,
  })
}

const toggleInterest = (interest) => {
  const interests = Array.isArray(props.modelValue.interests) ? props.modelValue.interests : []
  const next = interests.includes(interest) ? interests.filter((item) => item !== interest) : [...interests, interest]
  updateField('interests', next)
}
</script>

<template>
  <fieldset class="preferences-form" :disabled="disabled">
    <legend>여행 조건</legend>

    <TravelDateRangePicker
      :start-date="modelValue.startDate"
      :end-date="modelValue.endDate"
      :min-date="minDate"
      :max-date="maxDate"
      :max-end-date="maxEndDate"
      :disabled="disabled"
      @update:range="updateDateRange"
    />

    <div class="preference-group">
      <span class="group-label">여행 속도</span>
      <div class="segmented-control" role="group" aria-label="여행 속도" :style="{ '--pace-index': paceIndex }">
        <span class="pace-indicator" aria-hidden="true"></span>
        <button
          v-for="option in paceOptions"
          :key="option.value"
          type="button"
          :class="{ 'is-selected': modelValue.pace === option.value }"
          :aria-pressed="modelValue.pace === option.value"
          @click="updateField('pace', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="preference-group">
      <span class="group-label">관심사</span>
      <div class="interest-options">
        <label v-for="option in interestOptions" :key="option.value">
          <input type="checkbox" :checked="modelValue.interests?.includes(option.value)" @change="toggleInterest(option.value)" />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.preferences-form {
  display: grid;
  gap: 21px;
  margin: 0;
  padding: 0;
  border: 0;
}

.preferences-form > legend {
  margin-bottom: 13px;
  color: var(--hero-text);
  font-size: 15px;
  font-weight: 830;
}

.group-label {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 800;
}

.preference-group {
  display: grid;
  gap: 8px;
}

.segmented-control {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--hero-text) 4%, transparent);
}

.pace-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / 3);
  border-radius: 9px;
  background: color-mix(in srgb, var(--hero-text) 86%, transparent);
  box-shadow: 0 5px 14px color-mix(in srgb, var(--hero-end) 26%, transparent);
  transform: translateX(calc(var(--pace-index) * 100%));
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.segmented-control button {
  position: relative;
  z-index: 1;
  min-height: 38px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  transition:
    color 180ms ease,
    transform 180ms ease;
}

.segmented-control button.is-selected {
  color: var(--hero-start);
}

.segmented-control button:active {
  transform: scale(0.98);
}

.interest-options {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.interest-options label {
  position: relative;
  cursor: pointer;
}

.interest-options input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.interest-options span {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, white 7%, transparent);
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 800;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;
}

.interest-options input:checked + span {
  border-color: color-mix(in srgb, var(--weather-accent) 46%, transparent);
  background: color-mix(in srgb, var(--weather-accent) 12%, transparent);
  color: var(--hero-text);
}

.interest-options input:focus-visible + span {
  outline: 2px solid currentcolor;
  outline-offset: 2px;
}

.preferences-form:disabled {
  opacity: 0.54;
}

@media (prefers-reduced-motion: reduce) {
  .segmented-control button,
  .pace-indicator,
  .interest-options span {
    transition: none;
  }
}
</style>
