<script setup>
import { ref, onMounted, onUpdated, onUnmounted } from 'vue'

const count = ref(0)
const logList = ref([])
let timerId = null // 실시간 타이머 메모리 주소를 담을 변수

// 🟢 [1 단계] 생성 (Creation) 단계 = <script setup> 본문 그 자체
logList.value.push('🏁 1. [setup] 컴포넌트가 메모리에 생성되었습니다. (DOM 접근 불가능)')

// 🟢 [2 단계] 부착 (Mounting) 단계
onMounted(() => {
  logList.value.push('🖥️ 2. [onMounted] 화면에 완벽히 부착되었습니다! (API 호출/DOM 조작 적기)')

  // 🔥 실무 활용 시뮬레이션: 1초마다 숫자가 자동으로 올라가는 타이머 가동
  timerId = setInterval(() => {
    count.value++
  }, 1000)
})

// 🟢 [3 단계] 갱신 (Updating) 단계
// count 변수가 바뀌어서 화면이 리렌더링(새로고침)될 때마다 매번 실행됩니다.
onUpdated(() => {
  console.log(`🔄 3. [onUpdated] 데이터가 변경되어 화면을 새로 그렸습니다. (현재 count: ${count.value})`)
})

// 🟢 [4 단계] 소멸 (Unmounting) 단계
// v-if="false" 등으로 이 컴포넌트가 화면에서 완전히 파괴되어 사라질 때 실행됩니다.
onUnmounted(() => {
  // ❌ 주의: 여기서 타이머를 안 꺼주면 컴포넌트가 사라져도 백그라운드에서 영원히 타이머가 돕니다! (메모리 누수)
  clearInterval(timerId)
  alert('💀 4. [onUnmounted] 컴포넌트가 소멸했습니다. 타이머 청소 완료!')
})
</script>

<template>
  <div class="lifecycle-box">
    <h3>⏱️ 라이프사이클 훅 흐름 탐색기</h3>
    <hr />

    <div class="counter-display">
      <p>
        실시간 타이머 카운트: <strong>{{ count }}</strong>
      </p>
      <button @click="count++">수동으로 숫자 올리기</button>
    </div>

    <div class="log-screen">
      <h4>📜 수명 주기 연대기 기록:</h4>
      <ul>
        <li v-for="(log, index) in logList" :key="index">{{ log }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.lifecycle-box {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 20px;
  border-radius: 12px;
}
.counter-display {
  background: #e3fafc;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #99e9f2;
  text-align: center;
}
.counter-display strong {
  font-size: 20px;
  color: #0b7285;
}
.log-screen {
  margin-top: 20px;
  background: #2d3436;
  color: #1dd1a1;
  padding: 15px;
  border-radius: 8px;
  font-family: monospace;
}
.log-screen h4 {
  margin-top: 0;
  color: #fff;
}
ul {
  padding-left: 20px;
}
li {
  margin-bottom: 8px;
}
small {
  color: #b2bec3;
  display: block;
  margin-top: 10px;
}
button {
  padding: 5px 10px;
  cursor: pointer;
  margin-top: 5px;
}
</style>
