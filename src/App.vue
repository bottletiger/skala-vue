<script setup lang="ts">
import UnitToggler from './components/exercise/UnitToggler.vue';

</script>

<template>
<div class="app-container">
  <h1>⛅ 과제 4: 라우터적용</h1>
  <hr />
  <div class="dashboard-wrapper">
    <nav class="nav-bar">
      <RouterLink to="/" class="nav-item">🌦️ 날씨 대시보드</RouterLink>
      <span class="nav-div"></span>
      <RouterLink to="/about" class="nav-item">ℹ️ 서비스 소개</RouterLink>
      <UnitToggler class="unit-toggler"></UnitToggler>
    </nav>
    <main>
      <RouterView />
    </main>
  </div>
</div>
</template>

<style scoped>

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 14px;
  min-height: 52px;
  margin: 10px;
  padding: 0 20px;
  border-radius: 0 0 8px 8px;
  color: #6b7280;
  background: #fff;
  box-shadow: 0 5px 6px -6px rgba(0, 0, 0, 0.25);
}

.nav-item {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  color: black;
}
.nav-item:hover{
  text-decoration: underline 2px;
  color: steelblue;
}

.nav-div {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
}
.unit-toggler{
  margin-left: auto;
}
</style>
