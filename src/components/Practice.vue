<template>
    <main class="practice-page">
        <RouterLink class="back-link" to="/">← 처음으로</RouterLink>
        <h1>실습 페이지</h1>
        <SampleOne />
        <VHtml />
        <VText />
        <VBind />
        <ClassBind />
        <StyleBind />

        <h1>Day 2 Composition API</h1>
        <ExRef></ExRef> 
        <ExReactive></ExReactive>
        <ExComputed></ExComputed>
        <ExDeepWatch></ExDeepWatch>
    </main>
</template>

<script setup>
import ClassBind from './basic/practice/ClassBind.vue'
import SampleOne from './basic/practice/SampleOne.vue'
import VBind from './basic/practice/vBind.vue'
import VHtml from './basic/practice/vHtml.vue'
import VText from './basic/practice/vText.vue'
import StyleBind from './basic/practice/StyleBind.vue'
import ExRef from './basic/practice/exRef.vue'
import ExReactive from './basic/practice/exReactive.vue'
import ExComputed from './basic/practice/exComputed.vue'
import ExDeepWatch from './basic/practice/exDeepWatch.vue'
</script>

<style scoped>
.practice-page {
    width: min(100%, 900px);
    margin: 0 auto;
}

.practice-page h1 {
    margin: 1rem 0 1.5rem;
    font-size: 2rem;
    font-weight: 800;
}

.back-link {
    display: inline-block;
    color: #335c67;
    font-weight: 700;
}
</style>