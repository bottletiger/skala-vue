<script setup>
import { ref } from 'vue'
// 하위 컴포넌트 내부에서 관리하는 2개의 서로 다른 기본형 데이터
const message = ref('현재 서버 상태 정상')
const userCount = ref(150)
</script>

<template>
    <div class="base-card">
        <h3>하위 컴포넌트 (Child)</h3>
        <slot :text="message" :count="userCount">
            <p>부모가 마크업을 주입하지 않았을 때의 디폴트 화면</p>
        </slot>
    </div>
</template>