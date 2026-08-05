<template>
  <section class="not-found" aria-labelledby="not-found-title">
    <div class="weather-icon" aria-hidden="true">❓</div>
    <span class="error-code">404</span>
    <h2 id="not-found-title">페이지를 찾을 수 없습니다</h2>
    <p class="description">
      요청하신 페이지가 없거나 주소가 변경되었습니다.
    </p>
    <code class="requested-path">{{ route.fullPath }}</code>
    <UButton to="/" color="neutral">대시보드로 이동</UButton>
  </section>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.not-found {
  margin: 40px auto 0;
  padding: 42px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  color: #475569;
  text-align: center;
}

.error-code {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.weather-icon {
  margin-bottom: 2px;
  font-size: 36px;
  animation: rotation 2s infinite linear;
}

h2 {
  margin: 12px 0 8px;
  color: #111827;
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
  background: #f3f4f6;
  color: #64748b;
}

</style>
