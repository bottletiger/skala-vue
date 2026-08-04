<template>
    <div class="unit-toggle">
        <p>날씨단위: {{ configStore.unitSymbol}}</p>
        <button type="button" @click="configStore.toggleUnit">단위변경</button>
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

.unit-toggle p {
  margin: 0;
}

.unit-toggle button {
  padding: 5px 9px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.unit-toggle button:hover {
  background: #f3f4f6;
}
</style>
