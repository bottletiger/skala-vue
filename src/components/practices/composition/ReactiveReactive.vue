<script setup>
import { reactive } from 'vue'

const userReactive = reactive({
  name: '이순신',
  age: 30,
})
const celebrateReactive = () => {
  userReactive.age++
}
</script>

<template>
  <div style="padding: 20px">
    <h2>1-2. 반응형 상태 reactive() 특징 및 주의점</h2>
    <div>
      <h3>reactive로 만든 객체 (스크립트방에서 .value 생략)</h3>
      <p>이름: {{ userReactive.name }} / 나이: {{ userReactive.age }}세</p>
      <button @click="celebrateReactive">reactive 나이 한 살 추가</button>
    </div>
  </div>
</template>
