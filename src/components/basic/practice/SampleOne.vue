<script setup>
import { ref } from 'vue';

let normalCount = 0;
const vueCount = ref(Math.round(Math.random() * 10000));

</script>

<template>
<div>
    <h3>{{ normalCount }}</h3>
    <button @click="normalCount++">normalCount</button>
    <h3>{{ vueCount }}</h3>
    <button @click="vueCount++">vueCount</button>
</div>

</template>