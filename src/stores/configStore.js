import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius');

  const unitSymbol = computed(() =>
    unit.value === 'celsius' ? '°C' : '°F',
  )

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius';
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

  return { unit, unitSymbol, toggleUnit, convertTemp, formatTemp }
})