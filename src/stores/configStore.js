import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const THEME_STORAGE_KEY = 'weather-theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'

  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
    ? 'dark'
    : 'light'
}

export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius');
  const theme = ref(getInitialTheme());

  const unitSymbol = computed(() =>
    unit.value === 'celsius' ? '°C' : '°F',
  )
  const isDark = computed(() => theme.value === 'dark')

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius';
  }

  function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark';
  }

  function convertTemp(celsius) {
    if (unit.value === 'fahrenheit') {
      return celsius * 9 / 5 + 32;
    }

    return celsius;
  }

  function formatTemp(celsius) {
    return `${Math.round(convertTemp(celsius))}${unitSymbol.value}`;
  }

  return {
    unit,
    unitSymbol,
    theme,
    isDark,
    toggleUnit,
    toggleTheme,
    convertTemp,
    formatTemp,
  }
})
