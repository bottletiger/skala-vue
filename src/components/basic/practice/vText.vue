<template>
    <div class="practice-section">
        <p>output: {{ content }}</p>
        <p v-text="'출력: ' + content"></p>
        <p v-html="content"></p>
    </div>
</template>

<script setup>
const content = 'helllo <strong> SKALA </strong>'

</script>

<style lang="scss" scoped>

</style>