<script setup>
import ExScopedSlotChild from './exScopedSlotChild.vue';


</script>
<template>
    <div class="practice-section">
        <h2>Scoped Slot 주입 실습</h2>
        <h3>상위 컴포넌트 (Parent)</h3>
        <ExScopedSlotChild v-slot="slotBag">
            <div class="display-panel">
                <p>알림 메시지: {{ slotBag.text }}</p>
                <p>접속자 수: {{ slotBag.count }}명</p>
            </div>
        </ExScopedSlotChild>
        <ExScopedSlotChild> </ExScopedSlotChild>
    </div>
</template>
<style lang="css">
.display-panel{
    
}
</style>