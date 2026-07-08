<script setup>
import SlotNamedChild from './SlotNamedChild.vue'
</script>

<template>
  <div style="padding: 20px">
    <h2>2-4. Named Slot</h2>
    <SlotNamedChild>
      <template v-slot:header>
        <h2>시작점 주입 제목</h2>
      </template>
      <p>본문 텍스트 데이터 영역 매프 내용 기입</p>
    </SlotNamedChild>
  </div>
</template>
