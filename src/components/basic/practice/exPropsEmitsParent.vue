<template>
    <div class="practice-section">
        <h2>Props & Emits</h2>
        <div class="Parent-container">
            <h2>상위 컴포넌트 (Parent)</h2>
            <p>
                현재 로컬 데이터(State): <strong>{{ message }}</strong>
            </p>
            <br/>
            <ExPropsEmitsChild :parent-data="message" @update-request="handleUpdateRequest"></ExPropsEmitsChild>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import ExPropsEmitsChild from './exPropsEmitsChild.vue';

const message = ref('Parent 초기 메세지')
const handleUpdateRequest = (newValue) => {
    message.value = newValue;
}

</script>

<style lang="scss" scoped>

</style>