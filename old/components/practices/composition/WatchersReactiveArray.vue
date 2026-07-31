<script setup>
import { reactive, ref, watch } from 'vue'

// reactive로 선언한 빈 배열 (날씨 앱의 즐겨찾기 도시 리스트 모형)
const cityList = reactive(['서울', '수원'])

const logAuto = ref('대기 중...')
const logCopy = ref('대기 중...')

// 🟢 1) 변수명 그대로 넣기 (배열 추가/삭제 자동 추적)
watch(cityList, (newArr, oldArr) => {
  // newArr.length와 oldArr.length가 똑같이 늘어난 상태로 출력됩니다.
  logAuto.value = `[자동 감시] 배열 변동 발생! 옛날길이인척하는:${oldArr.length} / 현재길이:${newArr.length}`
})

// 🟢 2) 화살표 함수로 스냅샷(복사본)을 만들어 감시 (과거 배열 완벽 보존!)
watch(
  () => [...cityList],
  (newArr, oldArr) => {
    // 🔥 구조 분해 복사본을 감시하므로 과거 배열의 원본 데이터와 길이가 그대로 살아있습니다.
    logCopy.value = `[스냅샷 감시] 진짜 과거 길이:${oldArr.length} (데이터: ${oldArr}) ➡️ 바뀐 길이:${newArr.length}`
  },
)
</script>

<template>
  <div class="practice-section">
    <h2>reactive() 배열의 특정 인덱스/요소 감시하기</h2>
    <h3>즐겨찾기 도시 목록 (reactive 배열)</h3>
    <p>
      현재 등록된 도시: <strong>{{ cityList }}</strong>
    </p>
    <button @click="cityList.push('부산')">부산 추가 (push)</button> &nbsp;
    <button @click="cityList.pop()">최근 도시 삭제 (pop)</button>

    <div class="monitor auto">
      <h3>👁️‍🗨️ 1) cityList 변수명 쌩으로 감시</h3>
      <p>{{ logAuto }}</p>
      <small>※ 주의: 이전 배열과 현재 배열의 내용물/길이가 똑같이 동기화되어 버립니다.</small>
    </div>

    <div class="monitor target">
      <h3>🎯 2) () => [...cityList] 복사본 감시</h3>
      <p>{{ logCopy }}</p>
      <small>※ 성공: 과거 배열에 들어있던 내용물이 지워지지 않고 정상 대조됩니다.</small>
    </div>
  </div>
</template>

<style scoped>
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
</style>
