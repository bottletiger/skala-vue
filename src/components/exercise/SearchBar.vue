<script setup>
defineProps({
  currentQuery: {
    type: String,
    default: '',
  },
})

const emit = defineEmits({
  'update-query': (value) => typeof value === 'string',
})

const handleInput = (event) => {
  emit('update-query', event.currentTarget.value)
}
</script>

<template>
  <div class="search-box">
    <label class="search-label" for="city-search">도시명 검색</label>
    <div class="input-row dashboard-surface dashboard-surface--search">
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </svg>
      <input id="city-search" type="search" :value="currentQuery" placeholder="도시 검색" autocomplete="off" @input="handleInput" />
      <button v-if="currentQuery" type="button" aria-label="검색어 지우기" @click="emit('update-query', '')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
  white-space: nowrap;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 10px 0 14px;
}

.input-row:focus-within {
  border-color: color-mix(in srgb, var(--weather-accent, var(--accent)) 64%, white);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent, var(--accent)) 16%, transparent);
}

.search-icon {
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 2;
}

.input-row input {
  min-width: 0;
  flex: 1;
  padding: 12px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font-size: 14px;
  font-weight: 650;
}

.input-row input::placeholder {
  color: var(--hero-muted, var(--muted));
  opacity: 0.86;
}

.input-row input::-webkit-search-cancel-button,
.input-row input::-webkit-search-decoration {
  appearance: none;
  -webkit-appearance: none;
}

.input-row input::-ms-clear {
  display: none;
}

.input-row button {
  display: grid;
  width: 44px;
  min-height: 44px;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.input-row button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 2;
}
</style>
