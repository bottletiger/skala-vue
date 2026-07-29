<script setup>
import SlotScopedChild from './SlotScopedChild.vue'
</script>

<template>
  <div class="practice-section">
    <h2>Scoped Slot 주입 실습</h2>
    <h3>상위 컴포넌트 (Parent)</h3>
    <SlotScopedChild v-slot="slotBag">
      <div class="display-panel">
        <p>알림 메시지: {{ slotBag.text }}</p>
        <p>접속자 수: {{ slotBag.count }}명</p>
      </div>
    </SlotScopedChild>
    <SlotScopedChild> </SlotScopedChild>
  </div>
</template>

<style scoped>
.display-panel {
  background-color: #fdf2e9;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
}
</style>
