<script setup>
// 1. 정의한 카운터 스토어 플러그인 import
import { useCounterStore } from '@/stores/counter.js'

// 2. 인스턴스 가동 (전역 저장소 포인터 확보)
const counterStore = useCounterStore()
</script>

<template>
  <div class="counter-box">
    <h2>1-1 전역 카운터 인프라 실습</h2>

    <p>
      원본 카운트 데이터(state): <strong>{{ counterStore.count }}</strong>
    </p>
    <p>
      2배 연산 데이터(getters): <span>{{ counterStore.doubleCount }}</span>
    </p>

    <button @click="counterStore.increment">숫자 1 증가 (actions)</button>
  </div>
</template>

<style scoped>
.counter-box {
  background: #fdfefe;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  text-align: center;
}
h4 {
  margin-top: 0;
  color: #475569;
}
strong {
  color: #3b82f6;
  font-size: 18px;
}
span {
  color: #ef4444;
  font-weight: bold;
}
button {
  margin-top: 10px;
  width: 100%;
  padding: 8px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
</style>
