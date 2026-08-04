<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import UnitToggler from '@/components/exercise/UnitToggler.vue'

const route = useRoute()
const isWeatherScene = computed(() => route.meta.layout === 'weather-scene')
const isLabScene = computed(() => route.meta.layout === 'lab-scene')
const activeNavigationIndex = computed(() => {
  if (route.name === 'Dashboard') return 1
  if (route.name === 'Login') return 2
  if (route.name === 'WeatherAbout') return 3
  if (route.name === 'WeatherHome' || route.name === 'WeatherDetail') return 0
  return -1
})
const navigationStyle = computed(() => ({
  '--active-route-index': Math.max(activeNavigationIndex.value, 0),
}))
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">본문 바로가기</a>
    <header
      class="app-navigation"
      :class="{
        'app-navigation--weather': isWeatherScene,
      }"
    >
      <nav class="primary-navigation" :class="{ 'has-active-route': activeNavigationIndex >= 0 }" :style="navigationStyle" aria-label="주요 메뉴">
        <span class="navigation-slider" aria-hidden="true"></span>
        <RouterLink :to="{ name: 'WeatherHome' }" :class="{ 'is-active': activeNavigationIndex === 0 }" :aria-current="activeNavigationIndex === 0 ? 'page' : undefined">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 16.5h15a4 4 0 0 0 0-8 6 6 0 0 0-11.3-.8A4.8 4.8 0 0 0 4 16.5Z" />
          </svg>
          <span>날씨</span>
        </RouterLink>
        <RouterLink :to="{ name: 'Dashboard' }" :class="{ 'is-active': activeNavigationIndex === 1 }" :aria-current="activeNavigationIndex === 1 ? 'page' : undefined">
          <span class="navigation-icon navigation-icon--dashboard" aria-hidden="true"></span>
          <span>대시보드</span>
        </RouterLink>
        <RouterLink :to="{ name: 'Login' }" :class="{ 'is-active': activeNavigationIndex === 2 }" :aria-current="activeNavigationIndex === 2 ? 'page' : undefined">
          <span class="navigation-icon navigation-icon--login" aria-hidden="true"></span>
          <span>로그인</span>
        </RouterLink>
        <RouterLink :to="{ name: 'WeatherAbout' }" :class="{ 'is-active': activeNavigationIndex === 3 }" :aria-current="activeNavigationIndex === 3 ? 'page' : undefined">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
          <span>소개</span>
        </RouterLink>
      </nav>

      <UnitToggler />
    </header>

    <main
      id="main-content"
      class="page-container"
      :class="{
        'page-container--weather': isWeatherScene,
        'page-container--lab': isLabScene,
      }"
      tabindex="-1"
    >
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  --floating-nav-height: 54px;
  --floating-nav-offset: 12px;
  --floating-nav-clearance: calc(var(--floating-nav-height) + var(--floating-nav-offset) + 160px + env(safe-area-inset-bottom));

  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
}

.skip-link {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  padding: 10px 14px;
  border-radius: 999px;
  background: #17232d;
  color: #fff;
  font-weight: 750;
  transform: translateY(-160%);
}

.skip-link:focus {
  transform: translateY(0);
}

.app-navigation {
  position: fixed;
  z-index: 50;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 50%;
  display: flex;
  width: min(650px, calc(100% - 24px));
  min-height: 54px;
  align-items: center;
  gap: 6px;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 27px;
  background: rgba(242, 246, 245, 0.42);
  box-shadow:
    0 14px 38px rgba(20, 32, 36, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  color: #243139;
  backdrop-filter: blur(24px) saturate(135%);
  -webkit-backdrop-filter: blur(24px) saturate(135%);
  transform: translateX(-50%);
}

.app-navigation--weather {
  background: rgba(246, 249, 248, 0.34);
}

.primary-navigation {
  position: relative;
  isolation: isolate;
  display: grid;
  min-width: 0;
  flex: 1 1 auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  padding: 3px;
  border-radius: 22px;
  background: rgba(23, 35, 45, 0.045);
  overflow: hidden;
}

.navigation-slider {
  position: absolute;
  z-index: 0;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / 4);
  border-radius: 19px;
  background: rgba(23, 35, 45, 0.62);
  box-shadow: 0 5px 14px rgba(23, 35, 45, 0.12);
  opacity: 0;
  transform: translateX(calc(var(--active-route-index) * 100%));
  transition:
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 160ms ease;
  will-change: transform;
}

.primary-navigation.has-active-route .navigation-slider {
  opacity: 1;
}

.primary-navigation a {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 11px;
  border-radius: 19px;
  color: rgba(36, 49, 57, 0.68);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: color 180ms ease;
}

.primary-navigation a svg {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.navigation-icon {
  position: relative;
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
}

.navigation-icon--dashboard::before {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 5px;
  height: 5px;
  border-radius: 1.5px;
  background: currentcolor;
  box-shadow:
    8px 0 currentcolor,
    0 8px currentcolor,
    8px 8px currentcolor;
  content: '';
}

.navigation-icon--login::before,
.navigation-icon--login::after {
  position: absolute;
  left: 50%;
  border: 1.6px solid currentcolor;
  content: '';
  transform: translateX(-50%);
}

.navigation-icon--login::before {
  top: 1px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.navigation-icon--login::after {
  bottom: 1px;
  width: 12px;
  height: 6px;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
}

.primary-navigation a:hover {
  color: #243139;
}

.primary-navigation a.is-active {
  color: #fff;
}

.primary-navigation a:focus-visible {
  outline: 2px solid currentcolor;
  outline-offset: -3px;
}

.app-navigation :deep(.unit-toggler) {
  justify-self: end;
}

.app-navigation :deep(.unit-control) {
  min-width: 84px;
  min-height: 44px;
  padding: 3px;
  border-color: rgba(23, 35, 45, 0.12);
  background: rgba(23, 35, 45, 0.045);
  box-shadow: none;
  color: rgba(36, 49, 57, 0.7);
}

.app-navigation :deep(.unit-indicator) {
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background: rgba(23, 35, 45, 0.62);
}

.app-navigation :deep(.unit-option.active) {
  color: #fff;
}

.app-navigation :deep(.unit-option) {
  min-width: 32px;
  min-height: 36px;
  font-size: 12px;
}

.page-container {
  width: min(1120px, calc(100% - 32px));
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 48px 0 calc(116px + env(safe-area-inset-bottom));
}

.page-container--weather {
  width: 100%;
  margin: 0;
  padding: 0;
}

.page-container--lab {
  width: 100%;
  margin: 0;
  padding: 0;
}

@supports not (backdrop-filter: blur(1px)) {
  .app-navigation {
    background: rgba(242, 246, 245, 0.94);
  }
}

@media (max-width: 420px) {
  .app-shell {
    --floating-nav-offset: 9px;
  }

  .app-navigation {
    bottom: calc(9px + env(safe-area-inset-bottom));
    width: min(340px, calc(100% - 18px));
  }

  .primary-navigation a {
    flex-direction: column;
    gap: 2px;
    padding: 3px 2px;
    font-size: 10px;
  }

  .primary-navigation a svg,
  .navigation-icon {
    width: 15px;
    height: 15px;
  }

  .page-container:not(.page-container--weather):not(.page-container--lab) {
    width: min(100% - 28px, 1120px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .navigation-slider,
  .primary-navigation a {
    transition: none;
  }
}
</style>
