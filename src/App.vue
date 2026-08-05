<script setup lang="ts">
import { watch } from 'vue';
import ThemeToggler from './components/exercise/ThemeToggler.vue';
import UnitToggler from './components/exercise/UnitToggler.vue';
import { useConfigStore } from './stores/configStore';

const configStore = useConfigStore();

watch(
  () => configStore.theme,
  (theme) => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    window.localStorage.setItem('weather-theme', theme);
  },
  { immediate: true },
);
</script>

<template>
<UApp>
  <div class="app-container">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>
          <strong>Weather</strong>
          <small>과제 4: 라우터 적용</small>
        </span>
      </RouterLink>

      <nav class="nav-bar" aria-label="주요 메뉴">
        <RouterLink to="/" class="nav-item">🌦️ 날씨 대시보드</RouterLink>
        <RouterLink to="/about" class="nav-item">ℹ️ 서비스 소개</RouterLink>
      </nav>

      <div class="header-actions">
        <UnitToggler></UnitToggler>
        <ThemeToggler />
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</UApp>
</template>

<style scoped>

.app-container {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.app-header {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 2px 14px;
  border-bottom: 1px solid var(--color-border);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--color-heading);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.brand > span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand strong {
  font-size: 17px;
  font-weight: 700;
}

.brand small {
  margin-top: 2px;
  color: var(--color-text-soft);
  font-size: 10px;
}

.brand-mark {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-heading);
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 26px;
}

.nav-item {
  padding: 6px 9px;
  border-radius: 6px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.nav-item:hover,
.nav-item.router-link-active {
  background: var(--color-background-mute);
  color: var(--color-heading);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 560px) {
  .app-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .nav-bar {
    order: 3;
    width: 100%;
    margin-left: 0;
  }
}
</style>
