<template>
    <div class="practice-section">
        <p v-html="rawHtmlData"> </p>
    </div>
</template>

<script setup>
const rawHtmlData = 'hello <span style="color: red;"> red </span>'
</script>

<style lang="scss" scoped>

</style>