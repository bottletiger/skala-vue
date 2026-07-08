<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const dummy = ref(0) // computed와 아무 상관 없는 외톨이 변수

// 1. 일반 함수로 글자 가공하기 (호출할 때마다 실행됨)
const getMethodResult = () => {
  console.log('🏃‍♂️ 일반 함수가 실행되었습니다! (캐싱 없음)')
  return count.value % 2 === 0 ? '짝수' : '홀수'
}

// 2. computed로 글자 가공하기 (원본 count가 바뀔 때만 실행됨)
const getComputedResult = computed(() => {
  console.log('🧠 computed 연산기가 작동했습니다! (캐싱 작동)')
  return count.value % 2 === 0 ? '짝수' : '홀수'
})
</script>

<template>
  <div style="padding: 20px">
    <h2>1-3. 계산된 속성 computed()와 캐싱 최적화</h2>
    <div class="box">
      <h3>🔢 변수 제어</h3>
      <p>
        count 숫자: <strong>{{ count }}</strong
        >, dummy 숫자: <strong>{{ dummy }}</strong>
      </p>
      <button @click="count++">숫자 올리기 (재료 변경)</button>
      <button @click="dummy++">상관없는 dummy 변수 올리기</button>
    </div>

    <div class="box">
      <h3>📊 연산 결과 대조 (콘솔창을 확인하세요)</h3>
      <p>1) 일반 함수 결과: {{ getMethodResult() }}</p>
      <p>2) Computed 결과: {{ getComputedResult }}</p>
    </div>
  </div>
</template>

<style scoped>
.box {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px solid #e9ecef;
}
.dummy {
  border-color: #fab1a0;
}
strong {
  color: #0984e3;
  font-size: 18px;
}
</style>
