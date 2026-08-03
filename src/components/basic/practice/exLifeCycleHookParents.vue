<template>
  <div class="practice-section">
    <h2>Lifecycle Hook</h2>
    <button @click="isShow = !isShow" class="toggle-btn">
      {{ isShow ? '🛑 실습 컴포넌트 파괴하기 (v-if="false")' : '🟢 실습 컴포넌트 다시 살리기' }}
    </button>
    <hr />

    <ExLifeCycleHookChild v-if="isShow"></ExLifeCycleHookChild>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ExLifeCycleHookChild from './exLifeCycleHookChild.vue';

const isShow = ref(true)
</script>

<style scoped>
.toggle-btn {
  padding: 10px 15px;
  font-weight: bold;
  width: 100%;
  margin-bottom: 15px;
}
</style>
