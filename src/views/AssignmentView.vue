<script setup>
import WeatherMockup from '../components/basic/exercise/WeatherMockup.vue'
</script>

<template>
  <main class="assignment-page">
    <RouterLink class="back-link" to="/">← 처음으로</RouterLink>
    <p class="eyebrow">과제</p>
    <WeatherMockup />
  </main>
</template>

<style scoped>
.assignment-page {
  width: min(100%, 900px);
  margin: 0 auto;
  padding-top: clamp(2rem, 8vh, 5rem);
}

.back-link {
  display: inline-block;
  margin-bottom: 3rem;
  color: #335c67;
  font-weight: 700;
}

.eyebrow {
  color: #c44536;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

h1 {
  margin: 0.5rem 0 1rem;
  color: #14213d;
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
}
</style>