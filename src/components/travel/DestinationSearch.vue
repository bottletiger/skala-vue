<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'

const props = defineProps({
  query: {
    type: String,
    default: '',
  },
  results: {
    type: Array,
    default: () => [],
  },
  selectedDestination: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:query', 'search', 'select', 'clear'])
const componentId = useId()
const listboxId = `${componentId}-destination-listbox`
const activeIndex = ref(-1)
const isDismissed = ref(false)
const optionElements = ref([])

const hasQuery = computed(() => props.query.trim().length > 0)
const isListboxOpen = computed(() => !props.disabled && !props.isLoading && !props.selectedDestination && !isDismissed.value && props.results.length > 0)
const activeOptionId = computed(() => {
  if (!isListboxOpen.value || activeIndex.value < 0) return undefined
  return `${componentId}-destination-option-${activeIndex.value}`
})
const statusMessage = computed(() => {
  if (props.isLoading) return '도시를 찾고 있습니다.'
  if (props.errorMessage) return props.errorMessage
  if (props.query.trim().length > 1 && props.results.length === 0 && !props.selectedDestination) return '검색 결과가 없습니다.'
  return ''
})

const getOptionId = (index) => `${componentId}-destination-option-${index}`
const updateQuery = (event) => {
  isDismissed.value = false
  activeIndex.value = -1
  emit('update:query', event.target.value)
}
const clearSearch = () => {
  if (props.disabled) return
  isDismissed.value = true
  activeIndex.value = -1
  emit('clear')
}
const submitSearch = () => {
  if (!props.disabled) emit('search')
}
const scrollActiveOptionIntoView = () => {
  void nextTick(() => {
    optionElements.value[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
  })
}
const setActiveIndex = (index) => {
  if (!props.results.length) {
    activeIndex.value = -1
    return
  }

  activeIndex.value = Math.min(Math.max(index, 0), props.results.length - 1)
  scrollActiveOptionIntoView()
}
const selectDestination = (destination) => {
  if (props.disabled || props.isLoading || !destination) return
  isDismissed.value = true
  activeIndex.value = -1
  emit('select', destination)
}
const handleKeydown = (event) => {
  if (props.disabled) return

  const hasAvailableResults = !props.isLoading && !props.selectedDestination && props.results.length > 0

  if (event.key === 'Escape') {
    if (!isListboxOpen.value && activeIndex.value < 0) return
    event.preventDefault()
    isDismissed.value = true
    activeIndex.value = -1
    return
  }

  if (!hasAvailableResults) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    isDismissed.value = false
    setActiveIndex(activeIndex.value < 0 ? 0 : activeIndex.value + 1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    isDismissed.value = false
    setActiveIndex(activeIndex.value < 0 ? props.results.length - 1 : activeIndex.value - 1)
    return
  }

  if (event.key === 'Enter' && isListboxOpen.value && activeIndex.value >= 0) {
    event.preventDefault()
    selectDestination(props.results[activeIndex.value])
  }
}

watch(
  () => props.results,
  () => {
    activeIndex.value = -1
    optionElements.value = []
  },
  { deep: true },
)

watch(
  () => [props.isLoading, props.selectedDestination, props.disabled],
  ([isLoading, selectedDestination, disabled]) => {
    if (isLoading || selectedDestination || disabled) activeIndex.value = -1
  },
)

watch(
  () => props.query,
  () => {
    isDismissed.value = false
    activeIndex.value = -1
  },
)
</script>

<template>
  <section class="destination-search" aria-labelledby="destination-search-title">
    <div class="section-heading">
      <div>
        <span>DESTINATION</span>
        <h2 id="destination-search-title">어디로 떠날까요?</h2>
      </div>
      <p>도시 이름을 한글이나 영문으로 검색하세요.</p>
    </div>

    <form class="search-field" role="search" :aria-busy="isLoading" @submit.prevent="submitSearch">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <label class="sr-only" for="travel-destination-query">여행할 도시</label>
      <input
        id="travel-destination-query"
        :value="query"
        name="destination"
        type="search"
        role="combobox"
        inputmode="search"
        autocomplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-controls="listboxId"
        :aria-expanded="isListboxOpen"
        :aria-activedescendant="activeOptionId"
        :aria-busy="isLoading"
        placeholder=""
        :disabled="disabled"
        :aria-describedby="statusMessage ? 'destination-search-status' : undefined"
        @input="updateQuery"
        @keydown="handleKeydown"
      />
      <button v-if="hasQuery" class="clear-button" type="button" aria-label="검색어 지우기" :disabled="disabled" @click="clearSearch">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8 8 8M16 8l-8 8" /></svg>
      </button>
      <span v-if="isLoading" class="search-spinner" aria-hidden="true"></span>
    </form>

    <p v-if="statusMessage" id="destination-search-status" class="search-status" :class="{ 'is-error': errorMessage }" aria-live="polite">
      {{ statusMessage }}
    </p>

    <div v-if="selectedDestination" class="selected-destination">
      <div>
        <strong>{{ selectedDestination.name }}</strong>
        <span>{{ selectedDestination.countryName || selectedDestination.admin1 || selectedDestination.fullName }}</span>
      </div>
      <button type="button" :disabled="disabled" @click="clearSearch">도시 변경</button>
    </div>

    <ul :id="listboxId" v-show="isListboxOpen" class="destination-results" role="listbox" aria-label="도시 검색 결과">
      <li
        v-for="(destination, index) in results"
        :id="getOptionId(index)"
        ref="optionElements"
        :key="destination.id || `${destination.latitude}-${destination.longitude}`"
        class="destination-option"
        :class="{ 'is-active': index === activeIndex }"
        role="option"
        :aria-selected="index === activeIndex"
        @mousedown.prevent
        @mouseenter="setActiveIndex(index)"
        @click="selectDestination(destination)"
      >
        <span class="destination-option-content">
          <span class="result-marker" aria-hidden="true"></span>
          <span class="result-copy">
            <strong>{{ destination.name }}</strong>
            <small>{{ [destination.admin1, destination.countryName].filter(Boolean).join(' · ') || destination.fullName }}</small>
          </span>
          <svg class="result-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.destination-search {
  display: grid;
  gap: 15px;
}

.section-heading {
  display: block;
}

.section-heading span {
  display: block;
  margin-bottom: 4px;
  color: var(--weather-accent);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.14em;
}

.section-heading h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(24px, 4vw, 34px);
  line-height: 1.1;
  letter-spacing: -0.045em;
}

.section-heading > p {
  max-width: none;
  margin: 7px 0 0;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 700;
  text-align: left;
}

.search-field {
  position: relative;
  display: flex;
  height: 52px;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  border-radius: 13px;
  background: color-mix(in srgb, white 14%, transparent);
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.search-field:focus-within {
  border-color: color-mix(in srgb, var(--weather-accent) 58%, transparent);
  background: color-mix(in srgb, white 22%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 11%, transparent);
}

.search-field > svg {
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
  fill: none;
  stroke: var(--hero-muted);
  stroke-linecap: round;
  stroke-width: 1.8;
}

.search-field input {
  min-width: 0;
  height: 100%;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--hero-text);
  font-size: 14px;
  font-weight: 720;
}

.search-field input::-webkit-search-cancel-button {
  display: none;
}

.search-field input::placeholder {
  color: color-mix(in srgb, var(--hero-muted) 72%, transparent);
}

.clear-button {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--hero-text) 8%, transparent);
  color: var(--hero-muted);
  cursor: pointer;
}

.clear-button svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.search-spinner {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  border: 2px solid color-mix(in srgb, var(--hero-muted) 22%, transparent);
  border-top-color: var(--weather-accent);
  border-radius: 50%;
  animation: destination-search-spin 720ms linear infinite;
}

@keyframes destination-search-spin {
  to {
    transform: rotate(1turn);
  }
}

.search-status {
  margin: -6px 2px 0;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 700;
}

.search-status.is-error {
  color: color-mix(in srgb, #a34f48 82%, var(--hero-text));
}

.selected-destination {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 10px 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
}

.selected-destination > div {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.selected-destination strong {
  overflow: hidden;
  color: var(--hero-text);
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-destination span {
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-destination button {
  flex: 0 0 auto;
  padding: 7px 2px;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 30%, transparent);
  background: transparent;
  color: var(--hero-text);
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
}

.destination-results {
  max-height: 292px;
  margin: -3px 0 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  overflow-y: auto;
  scrollbar-width: none;
  list-style: none;
}

.destination-results::-webkit-scrollbar {
  display: none;
}

.destination-results li + li {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
}

.destination-option {
  cursor: pointer;
}

.destination-option-content {
  display: grid;
  width: 100%;
  min-height: 62px;
  grid-template-columns: 18px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 12px;
  padding: 8px 3px;
  color: var(--hero-text);
  text-align: left;
  transition: background-color 180ms ease;
}

.destination-option.is-active .destination-option-content,
.destination-option:hover .destination-option-content {
  background: color-mix(in srgb, var(--hero-text) 6%, transparent);
}

.result-marker {
  width: 8px;
  height: 8px;
  justify-self: center;
  border: 1.5px solid var(--weather-accent);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.result-copy {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.result-copy strong,
.result-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-copy strong {
  font-size: 14px;
}

.result-copy small {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 700;
}

.result-arrow {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--hero-muted);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

@media (hover: hover) and (pointer: fine) {
  .destination-option:hover .destination-option-content {
    background: color-mix(in srgb, var(--hero-text) 5%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-spinner {
    animation: none;
  }

  .search-field,
  .destination-option-content {
    transition: none;
  }
}
</style>
