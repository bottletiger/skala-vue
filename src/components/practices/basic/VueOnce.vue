<script setup>
import { ref } from 'vue'
const count = ref(1)
</script>

<template>
  <div style="padding: 20px">
    <h2>2-9. v-once 디렉티브 학습</h2>
    <p>일반 변수 (실시간): {{ count }}</p>
    <p v-once>v-once 변수 (최초 고정): {{ count }}</p>
    <br />
    <button @click="count++">숫자 증가 버튼</button>
  </div>
</template>
