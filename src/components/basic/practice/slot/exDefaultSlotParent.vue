<template>
    <div class="practice-section">
        <h2>Default Slot 레이아웃 주입 실습</h2>
        <SlotDefaultChild>
            <p>Inject Simple Sentence</p>
        </SlotDefaultChild>
        <SlotDefaultChild>
            <h2 style="color: red;">Warning</h2>
            <button>confirm</button>
        </SlotDefaultChild>
        <SlotDefaultChild></SlotDefaultChild>
    </div>
</template>

<script setup>
import SlotDefaultChild from '../../../../../old/components/practices/component/SlotDefaultChild.vue';


</script>

<style lang="scss" scoped>

</style>