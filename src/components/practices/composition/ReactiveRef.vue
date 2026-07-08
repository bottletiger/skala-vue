<script setup>
import { ref } from 'vue'

const count = ref(0)
const name = ref('홍길동')
const isActive = ref(true)
const items = ref(['사과', '배'])
const increaseRef = () => {
  count.value++
}
</script>

<template>
  <div style="padding: 20px">
    <h2>1-1. 반응형 상태 ref() 기초</h2>
    <div>
      <h3>Vue ref 변수 (반응성 장착)</h3>
      <p>
        Ref 카운트: <strong>{{ count }}</strong>
      </p>
      <button @click="increaseRef">Ref 변수 증가</button>
      <p>이름: <input v-model="name" />{{ name }}</p>
      <p>활성 상태: {{ isActive ? '활성' : '비활성' }}</p>
      <button @click="isActive = !isActive">토글</button>    
      <p>과일 목록: {{ items.join(', ') }}</p>
      <button @click="items.push('귤')">과일 추가</button>    
    </div>
  </div>
</template>
