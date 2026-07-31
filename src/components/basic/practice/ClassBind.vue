<template>
    <div class="practice-section">
        <h2>v-bind 디렉티브 고급 (클래스 바인딩)</h2>
        <h3>클래스 바인딩 (객체 형식)</h3>
        <p :class="{ 'text-danger': isWarning}">현재 경고 상태 {{ isWarning }}</p>
        <button @click="isWarning = !isWarning">경고 상태 토글</button>
        <br>
        <h3>클래스 바인딩 (배열 형식)</h3>
        <div :class="[themeClass, isWarning? 'border-red' : 'border-gary']">다중 클래스가 조립된 박스 구역</div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const isWarning = ref(false);
const themeClass = ref('bg-dark');
</script>

<style scoped>
.text-danger {color: red; font-weight: bold;}
.bg-dark {background-color: #333; color: white; padding: 15px;}
.border-red {border: 3px solid red;}
.border-gray {border: 3px solid #ccc;}
</style>