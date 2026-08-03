<script setup>
import ExNamedSlotChild from './exNamedSlotChild.vue';

</script>
<template>
    <div class="practice-section">
        <h2>Named Slot 주입 실습</h2>
        <ExNamedSlotChild>
            <template v-slot:header>
                <h3>Child 주입 제목</h3>
            </template>
            <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporincididunt..."</p>
        </ExNamedSlotChild>
    </div>
</template>