<script setup>
import { ref, watchEffect } from 'vue'

const username = ref('홍길동')
const age = ref(20)
const logMessage = ref('대기 중...')

// 🟢 watchEffect 가동: 감시 대상을 지정하는 파라미터가 없습니다!
watchEffect(() => {
  // Vue가 이 내부 코드를 읽고 'username'과 'age'를 자동으로 감시 리스트에 등록합니다.
  logMessage.value = `[자동 감지] 이름: ${username.value} / 나이: ${age.value}세`

  // 화면이 처음 켜질 때 1등으로 즉시 실행되는 증거를 콘솔에서 확인합니다.
  console.log('🤖 watchEffect가 내부 변수 변경을 감지하여 실행되었습니다.')
})
</script>

<template>
  <div style="padding: 20px">
    <h2>1-10. 자동 감시자 watchEffect()의 특징</h2>
    <div class="box">
      <h3>👨‍💻 데이터 제어판</h3>
      <p>이름: {{ username }} / 나이: {{ age }}세</p>

      <button @click="username = '이순신'">이름을 '이순신'으로 변경</button> &nbsp;
      <button @click="age++">나이 한 살 추가 (age++)</button>
    </div>

    <div class="box monitor">
      <h3>👁️‍🗨️ watchEffect 자동 모니터링 시스템</h3>
      <p>{{ logMessage }}</p>
      <small style="color: gray">※ 새로고침하자마자 버튼을 안 눌러도 로그가 이미 찍혀있는 특징을 주목하세요!</small>
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
.monitor {
  border-color: #e74c3c;
  background: #fff5f5;
  font-weight: bold;
}
button {
  padding: 6px 12px;
  cursor: pointer;
}
small {
  color: #7f8c8d;
  display: block;
  margin-top: 5px;
}
</style>
