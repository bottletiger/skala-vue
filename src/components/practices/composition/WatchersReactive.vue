<script setup>
import { reactive, ref, watch } from 'vue'

// reactive로 선언한 묶음 상품 데이터
const state = reactive({
  productName: '노트북',
  price: 1000,
})

const logAutoDeep = ref('대기 중...')
const logTarget = ref('대기 중...')

// 🟢 1) 변수명 쌩으로 넣기 (자동 deep: true 작동)
watch(state, (newVal, oldVal) => {
  // ⚠️ 대반전: newVal.price와 oldVal.price가 똑같이 2000으로 나옵니다!
  logAutoDeep.value = `[자동 deep] 가격 변동! 이전가격인척하는:${oldVal.price}원 ➡️ 현재가격:${newVal.price}원`
})

// 🟢 2) 화살표 함수로 특정 속성만 조준경 락온 (이전 값 추적 가능!)
watch(
  () => state.price,
  (newPrice, oldPrice) => {
    // 🔥 특정 알맹이 값만 추출했으므로 진짜 과거 가격(1000)이 정상 보존됩니다.
    logTarget.value = `[타겟 조준] 가격이 진짜 올랐음! 옛날값:${oldPrice}원 ➡️ 바뀐값:${newPrice}원`
  },
)
</script>

<template>
  <div style="padding: 20px">
    <h2>1-7. reactive() 데이터 watch 감시 규칙</h2>
    <div class="box">
      <h3>🛒 상품 정보 관리 (reactive)</h3>
      <p>상품명: {{ state.productName }} / 가격: {{ state.price }}원</p>
      <button @click="state.price += 500">가격 500원 인상</button>
    </div>

    <div class="box monitor auto">
      <h3>👁️‍🗨️ 1) state 변수 통째로 감시 (deep 자동화)</h3>
      <p>{{ logAutoDeep }}</p>
      <small>※ 주의: 이전 값과 현재 값이 똑같이 찍힙니다.</small>
    </div>

    <div class="box monitor target">
      <h3>🎯 2) () => state.price 콕 집어 감시 (과거 추적)</h3>
      <p>{{ logTarget }}</p>
      <small>※ 성공: 과거의 원본 가격이 칼같이 보존됩니다.</small>
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
  font-weight: bold;
}
.auto {
  border-color: #ff7675;
  background: #fff5f5;
  color: #c0392b;
}
.target {
  border-color: #00b894;
  background: #e8f5e9;
  color: #27ae60;
}
button {
  padding: 6px 12px;
  cursor: pointer;
  background: #2d3436;
  color: white;
  border: none;
  border-radius: 4px;
}
small {
  color: #7f8c8d;
  font-weight: normal;
}
</style>
