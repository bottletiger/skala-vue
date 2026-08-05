<template>
    <div class="unit-toggle">
        <span>날씨단위: {{ configStore.unitSymbol }}</span>
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          size="xs"
          @click="configStore.toggleUnit">
          단위변경
        </UButton>
    </div>
</template>

<script setup>
import { useConfigStore } from '@/stores/configStore';

const configStore = useConfigStore();
</script>

<style scoped>
.unit-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  white-space: nowrap;
}

.unit-toggle span {
  margin: 0;
  color: var(--color-text-muted);
}

</style>
