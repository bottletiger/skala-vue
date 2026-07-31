<script setup>
import { ref } from 'vue'
const text1 = ref('') // v-model용 변수
const text2 = ref('') // 원리 이해용 변수
</script>

<template>
  <div class="practice-section">
    <h2>v-model 양방향 데이터 바인딩</h2>
    <h3>1) v-model 축약 문법 (양방향)</h3>
    <input type="text" v-model="text1" placeholder="여기에 입력하세요" />
    <p>
      입력된 값: <strong>{{ text1 }}</strong>
    </p>
    <h3>2) v-model의 내부 작동 원리 (단방향 + 이벤트)</h3>
    <input type="text" :value="text2" @input="(e) => (text2 = e.target.value)" placeholder="원리 파악용 입력창" />
    <p>
      입력된 값: <strong>{{ text2 }}</strong>
    </p>
  </div>
</template>
