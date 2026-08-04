<script setup>
import WeatherParent from '@/components/exercise/weatherParent.vue';
// import WeatherMockup from '../components/exercise/WeatherMockup.vue'
</script>

<template>
  <main class="assignment-page">
    <WeatherParent></WeatherParent>
  </main>
</template>

<style scoped>

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