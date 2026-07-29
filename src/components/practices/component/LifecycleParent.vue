<script setup>
import { ref } from 'vue'
import LifecycleChild from '@/components/practices/component/LifecycleChild.vue'

const isShow = ref(true)
</script>

<template>
  <div class="practice-section">
    <h2>Lifecycle Hook</h2>
    <button @click="isShow = !isShow" class="toggle-btn">
      {{ isShow ? '🛑 실습 컴포넌트 파괴하기 (v-if="false")' : '🟢 실습 컴포넌트 다시 살리기' }}
    </button>
    <hr />

    <LifecycleChild v-if="isShow" />
  </div>
</template>

<style scoped>
.toggle-btn {
  padding: 10px 15px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-bottom: 15px;
}
</style>
