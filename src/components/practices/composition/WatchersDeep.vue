<script setup>
import { ref, watch } from 'vue'

// 감시 대상이 될 ref 객체
const user = ref({
  name: '홍길동',
  age: 20,
})

const logDeep = ref('아직 반응 없음')
const logTarget = ref('아직 반응 없음')

// ❌ 실패하는 예시 (수강생들이 가장 많이 범하는 오류)
// watch(user, () => { console.log('이 로그는 영원히 안 찍힙니다.') })

// 🟢 해결책 1: deep 옵션을 켜서 객체 하위 속성 전체 감시하기
watch(
  user,
  (newVal) => {
    // newVal과 oldVal의 주소값이 같아서 두 인자가 똑같은 값을 가집니다.
    logDeep.value = `[deep 감지] 누군가 변경됨! 현재 이름: ${newVal.name}, 나이: ${newVal.age}`
  },
  { deep: true },
)

// 🟢 해결책 2: 화살표 함수로 특정 속성(age)만 콕 집어 감시하기 (★이전 값 추적 가능!)
watch(
  () => user.value.age,
  (newAge, oldAge) => {
    // 특정 원시값만 추적하므로 이전 값(oldAge)이 칼같이 보존됩니다.
    logTarget.value = `[타겟 감지] 나이가 ${oldAge}세 ➡️ ${newAge}세로 변경됨!`
  },
)
</script>

<template>
  <div style="padding: 20px">
    <h2>1-6. ref 객체/배열 감시의 정석</h2>
    <div class="box">
      <h3>👨‍💻 회원 데이터 조작 panel</h3>
      <p>이름: {{ user.name }} / 나이: {{ user.age }}세</p>
      <button @click="user.name = '이순신'">이름만 변경</button> &nbsp;
      <button @click="user.age++">나이만 변경 (age++)</button>
    </div>

    <div class="box monitor">
      <h3>👁️‍🗨️ 1) deep: true 모니터 (전체 감시)</h3>
      <p>{{ logDeep }}</p>
    </div>

    <div class="box monitor target">
      <h3>🎯 2) 화살표 함수 모니터 (나이만 타겟 감시)</h3>
      <p>{{ logTarget }}</p>
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
  border-color: #0984e3;
  background: #e3fafc;
  font-weight: bold;
}
.target {
  border-color: #6c5ce7;
  background: #efe5ff;
}
button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
