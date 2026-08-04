import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useConfigStore } from '@/stores/configStore'
import { convertTemperature } from '@/utils/temperature'

export const useTemperature = (getCelsius) => {
  const configStore = useConfigStore()
  const { unit, unitSymbol } = storeToRefs(configStore)

  const displayTemp = computed(() => {
    return convertTemperature(getCelsius(), unit.value) ?? '-'
  })

  return { displayTemp, unit, unitSymbol }
}
