<template>
  <UButton
    type="button"
    color="neutral"
    variant="outline"
    size="xs"
    square
    class="theme-toggle"
    :aria-label="buttonLabel"
    :title="buttonLabel"
    @click="configStore.toggleTheme">
    <span aria-hidden="true">{{ configStore.isDark ? '☀' : '☾' }}</span>
  </UButton>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()
const buttonLabel = computed(() =>
  configStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환',
)
</script>

<style scoped>
.theme-toggle {
  font-size: 16px;
  line-height: 1;
}
</style>
