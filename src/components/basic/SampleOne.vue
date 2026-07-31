<script setup>
import { ref } from 'vue';

let normalCount = 0;
const vueCount = ref(754619123751923);

</script>

<template>
<div>
    <h3>{{ normalCount }}</h3>
    <button @click="normalCount++">normalCount</button>
    <h3>{{ vueCount }}</h3>
    <button @click="vueCount++">vueCount</button>
</div>

</template>