<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <div class="not-found">
    <span aria-hidden="true">404</span>
    <p class="eyebrow">경로 확인</p>
    <h1>페이지를 찾을 수 없습니다</h1>
    <p>
      요청한 경로
      <code>{{ route.query.from || route.fullPath }}</code>
      에 해당하는 화면이 없습니다.
    </p>
    <el-button type="primary" @click="router.push({ name: 'WeatherHome' })">날씨로 돌아가기</el-button>
  </div>
</template>

<style scoped>
.not-found {
  max-width: 620px;
  margin: 40px auto;
  padding: 64px 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.not-found > span {
  display: block;
  color: var(--sun);
  font-size: 72px;
  font-weight: 900;
  letter-spacing: -0.08em;
  line-height: 1;
}

.not-found h1 {
  margin-bottom: 10px;
  color: var(--navy);
}

.not-found p:not(.eyebrow) {
  color: var(--muted);
}

.not-found code {
  overflow-wrap: anywhere;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--surface-soft);
  color: var(--danger);
}
</style>
