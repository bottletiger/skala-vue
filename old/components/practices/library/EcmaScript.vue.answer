<script setup>
import { ref } from 'vue'

// 실시간 화면 출력을 위한 Vue 상태값 (수정 금지)
const result1 = ref('')
const result2 = ref('')
const result3 = ref('')

const runTask1 = () => {
  const members = ['김수원', '이서울', '박부산', '최대전']
  const rawData = { id: 101, grade: 'VIP', details: { score: 95 } }

  // 1. includes() 활용
  const memberContainsPark = members.includes('박부산')

  // 2. 객체 심층 비구조화 할당 (한 줄로 추출)
  const {
    grade,
    details: { score },
  } = rawData

  // 3. 템플릿 리터럴 바인딩
  result1.value = `부산 포함 여부: ${memberContainsPark} / 등급: ${grade} / 점수: ${score}점`
}

const runTask2 = () => {
  const currentCart = ['Apple', 'Banana']
  const newProduct = { name: 'Orange', stock: 0, preview: null }

  // 1. 배열 스프레드 연산자 병합
  const updatedCart = [...currentCart, newProduct.name]

  // 2. 옵셔널 체이닝 및 Null 병합 연산자 콤보
  const imgStatus = newProduct?.preview ?? '이미지 준비중'

  // 3. 0값 안전 보존을 위한 ?? 연산자 검증 (|| 연산자를 쓰면 10이 되어 감점)
  const finalStock = newProduct.stock ?? 10

  // 4. 출력
  result2.value = `카트: ${updatedCart} / 이미지: ${imgStatus} / 수량: ${finalStock}개`
}

// =================================================================
// 📝 [과제 3] 서버 연쇄 데이터 요청 및 에러 통합 제어 (Async/Await)
// =================================================================
// 가상의 백엔드 API (수정 금지 - Promise 반환형 화살표 함수)
const fetchUserId = () => new Promise((res) => setTimeout(() => res({ uid: 777 }), 400))
const fetchUserProfile = (uid) => new Promise((res) => setTimeout(() => res({ uid, nick: 'Graves' }), 400))

const runTask3 = async () => {
  result3.value = '⏳ 데이터 동기화 중...'

  // 1. try-catch 예외 처리망 구축
  try {
    // 2. 1차 await 실행 및 비구조화 할당 추출
    const { uid } = await fetchUserId()

    // 3. 2차 연쇄 await 실행 및 데이터 주입
    const { nick } = await fetchUserProfile(uid)

    // 4. 결과 출력
    result3.value = `동기화 성공: ${nick}님 환영합니다.`
  } catch (error) {
    result3.value = '통신 실패'
  }
}
</script>

<template>
  <div class="practice-section">
    <h2>🎯 Modern JavaScript (ES6+) 실무 검증 과제룸</h2>

    <div class="card">
      <h3>과제 1. 데이터 추출 및 포맷팅</h3>
      <button @click="runTask1">과제 1 가동</button>
      <div class="console">결과창 1: {{ result1 }}</div>
    </div>

    <div class="card">
      <h3>과제 2. 불변성 복사 및 데이터 방어</h3>
      <button @click="runTask2">과제 2 가동</button>
      <div class="console">결과창 2: {{ result2 }}</div>
    </div>

    <div class="card">
      <h3>과제 3. 비동기 연쇄 파이프라인 (Async/Await)</h3>
      <button @click="runTask3">과제 3 가동</button>
      <div class="console">결과창 3: {{ result3 }}</div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}
button {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
button:hover {
  background: #66b1ff;
}
.console {
  background: #2d2d2d;
  color: #67c23a;
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
  font-family: monospace;
  font-size: 14px;
}
</style>
