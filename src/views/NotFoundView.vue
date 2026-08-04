<template>
  <section class="not-found" aria-labelledby="not-found-title">
    <div class="weather-icon">❓</div>
    <h2 id="not-found-title">페이지를 찾을 수 없습니다</h2>
    <p class="description">
      요청하신 페이지가 없거나 주소가 변경되었습니다.
    </p>
    <code class="requested-path">{{ route.fullPath }}</code>
    <RouterLink to="/" class="btn-home">🌦️ 날씨 메인으로 이동</RouterLink>
  </section>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.not-found {
  margin: 40px auto 0;
  padding: 42px 24px;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  background: #f8f9fa;
  color: #475569;
  text-align: center;
}

.weather-icon {
  margin-bottom: 4px;
  font-size: 44px;
}

h2 {
  margin: 12px 0 8px;
  color: #334155;
  font-size: 22px;
}

.description {
  margin: 0 0 14px;
  font-size: 14px;
}

.requested-path {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 24px;
  padding: 5px 10px;
  overflow-wrap: anywhere;
  border-radius: 4px;
  background: #e9ecef;
  color: #64748b;
}

.btn-home {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  background: #0ea5e9;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.btn-home:hover {
  background: #0284c7;
}

</style>
