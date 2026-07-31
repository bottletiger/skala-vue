<script setup>
import { ref } from 'vue'

const name = ref('홍길동')
const age = ref(20)
</script>

<template>
  <div class="practice-section">
    <h2>v-memo 디렉티브 학습</h2>
    <div v-memo="[name]" style="padding: 20px; border: 1px solid #42b883; margin-bottom: 10px">
      <p>📦 v-memo 적용 영역 (기준: name)</p>
      <p>이름: {{ name }}</p>
      <p>나이: {{ age }} (name이 바뀌어야 얘도 갱신됨)</p>
    </div>
    <button @click="name = '이순신'">1. 이름 변경 (이순신)</button> &nbsp;
    <button @click="age++">2. 나이 한 살 추가 (age++)</button>
  </div>
</template>
