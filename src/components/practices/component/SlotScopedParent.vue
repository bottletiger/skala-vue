<script setup>
import SlotScopedChild from './SlotScopedChild.vue'
</script>

<template>
  <div style="padding: 20px">
    <h2>2-5. Scoped Slot</h2>
    <div class="parent-box">
      <h2>📡 상위 컴포넌트 (Parent)</h2>
      <hr />

      <SlotScopedChild v-slot="slotBag">
        <div class="display-panel">
          <p>
            알림 메시지: <strong>{{ slotBag.text }}</strong>
          </p>
          <p>
            접속자 수: <span class="number-badge">{{ slotBag.count }}명</span>
          </p>
        </div>
        <button>상위 전용 관리자 버튼</button>
      </SlotScopedChild>
    </div>
  </div>
</template>

<style scoped>
.parent-box {
  border: 2px solid #2c3e50;
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
}
.display-panel {
  background-color: #fdf2e9;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
}
.display-panel strong {
  color: #e67e22;
}
.number-badge {
  background-color: #e67e22;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
</style>
