<script setup>
import { ref } from 'vue'

let normalCount = 0
const vueCount = ref(0)
const welcomeMessage = 'Welcome to Skala-Vue'
</script>

<template>
  <div style="padding: 20px">
    <h2>1-2. {{ welcomeMessage }}</h2>
    <p>{{ welcomeMessage.toUpperCase() }}</p>
    <p>{{ 'Random number: ' + Math.ceil(Math.random() * 100) }}</p>
    <h3>일반 변수 클릭: {{ normalCount }}</h3>
    <button @click="normalCount++">일반 변수 증가</button>
    <br />
    <h3>Vue 반응성 변수 클릭: {{ vueCount }}</h3>
    <button @click="vueCount++">Vue 변수 증가</button>
  </div>
</template>
