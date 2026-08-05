<script setup>
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import UnitToggler from '@/components/exercise/UnitToggler.vue'
import { useSharedWeatherTheme } from '@/composables/useSharedWeatherTheme'
import { useAuthStore } from '@/stores/auth'
import { useHomeWeatherStore } from '@/stores/homeWeatherStore'

const route = useRoute()
const authStore = useAuthStore()
const homeWeatherStore = useHomeWeatherStore()
const { isLoggedIn } = storeToRefs(authStore)
const { isWorldDrawerOpen } = storeToRefs(homeWeatherStore)
const { weatherTheme: sharedWeatherTheme } = useSharedWeatherTheme()
const isThemedScene = computed(() => route.meta.layout === 'weather-scene')
const isWeatherHome = computed(() => route.name === 'WeatherHome')
const accountNavigation = computed(() => (isLoggedIn.value ? { name: 'Trips', label: '내 여행' } : { name: 'Login', label: '로그인' }))
const activeNavigationIndex = computed(() => {
  if (route.name === 'TravelPlanner') return 1
  if (route.name === 'Trips' || route.name === 'Login') return 2
  if (route.name === 'WeatherHome' || route.name === 'WeatherDetail') return 0
  return -1
})
const navigationStyle = computed(() => ({
  '--active-route-index': Math.max(activeNavigationIndex.value, 0),
}))
const weatherNavigationStyle = computed(() => (isThemedScene.value ? sharedWeatherTheme.value.cssVariables : undefined))

const toggleWorldDrawer = () => {
  isWorldDrawerOpen.value = !isWorldDrawerOpen.value
}

watch(
  () => route.name,
  (routeName) => {
    if (routeName !== 'WeatherHome') isWorldDrawerOpen.value = false
  },
)
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">본문 바로가기</a>
    <header
      class="app-navigation"
      :class="{
        'app-navigation--immersive-weather': isThemedScene,
        'is-world-drawer-open': isWeatherHome && isWorldDrawerOpen,
      }"
      :style="weatherNavigationStyle"
    >
      <nav class="primary-navigation" :class="{ 'has-active-route': activeNavigationIndex >= 0 }" :style="navigationStyle" aria-label="주요 메뉴">
        <span class="navigation-slider" aria-hidden="true"></span>
        <RouterLink :to="{ name: 'WeatherHome' }" :class="{ 'is-active': activeNavigationIndex === 0 }" :aria-current="activeNavigationIndex === 0 ? 'page' : undefined">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 16.5h15a4 4 0 0 0 0-8 6 6 0 0 0-11.3-.8A4.8 4.8 0 0 0 4 16.5Z" />
          </svg>
          <span>날씨</span>
        </RouterLink>
        <RouterLink :to="{ name: 'TravelPlanner' }" :class="{ 'is-active': activeNavigationIndex === 1 }" :aria-current="activeNavigationIndex === 1 ? 'page' : undefined">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
          <span>여행</span>
        </RouterLink>
        <RouterLink :to="{ name: accountNavigation.name }" :class="{ 'is-active': activeNavigationIndex === 2 }" :aria-current="activeNavigationIndex === 2 ? 'page' : undefined">
          <svg v-if="isLoggedIn" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 8h12l1 12H5L6 8Z" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3" />
            <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
          </svg>
          <span>{{ accountNavigation.label }}</span>
        </RouterLink>
      </nav>

      <UnitToggler />

      <button
        v-if="isWeatherHome"
        class="world-drawer-handle"
        type="button"
        aria-controls="world-weather-drawer"
        :aria-expanded="isWorldDrawerOpen"
        :aria-label="isWorldDrawerOpen ? '세계 날씨 서랍 닫기' : '세계 날씨 서랍 열기'"
        @click="toggleWorldDrawer"
      >
        <span class="world-drawer-grabber" :class="{ 'is-open': isWorldDrawerOpen }" aria-hidden="true"></span>
        <span class="world-drawer-handle-label">세계 날씨</span>
      </button>
    </header>

    <main
      id="main-content"
      class="page-container"
      :class="{
        'page-container--scene': isThemedScene,
      }"
      tabindex="-1"
    >
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  --floating-nav-height: 62px;
  --floating-nav-offset: 12px;
  --floating-nav-width: min(650px, calc(100vw - 24px));
  --floating-nav-radius: 27px;
  --world-drawer-gap: 0px;
  --world-drawer-height: min(78svh, 820px);
  --world-drawer-bottom: calc(var(--floating-nav-height) + var(--floating-nav-offset) + var(--world-drawer-gap) + env(safe-area-inset-bottom));
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
  bottom: calc(var(--floating-nav-offset) + env(safe-area-inset-bottom));
  left: 50%;
  display: flex;
  width: var(--floating-nav-width);
  height: var(--floating-nav-height);
  align-items: center;
  gap: 6px;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: var(--floating-nav-radius);
  background: rgba(242, 246, 245, 0.42);
  box-shadow:
    0 14px 38px rgba(20, 32, 36, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  color: #243139;
  backdrop-filter: blur(24px) saturate(135%);
  -webkit-backdrop-filter: blur(24px) saturate(135%);
  transform: translateX(-50%);
}

.app-navigation--immersive-weather {
  --navigation-ink: var(--hero-text);
  --navigation-muted: color-mix(in srgb, var(--hero-text) 66%, transparent);
  --drawer-handle-color: var(--hero-text);

  border-color: color-mix(in srgb, var(--hero-text) 14%, transparent);
  background: color-mix(in srgb, var(--hero-start) 12%, transparent);
  box-shadow:
    0 10px 28px rgba(15, 27, 34, 0.11),
    inset 0 1px 0 color-mix(in srgb, white 20%, transparent);
  color: var(--navigation-ink);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
}

.app-navigation--immersive-weather.is-world-drawer-open {
  border-color: color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-top: 0;
  border-radius: 0 0 var(--floating-nav-radius) var(--floating-nav-radius);
  background: color-mix(in srgb, var(--hero-start) 12%, transparent);
  box-shadow:
    0 10px 28px rgba(15, 27, 34, 0.11),
    inset 0 1px 0 color-mix(in srgb, white 20%, transparent);
}

.primary-navigation {
  position: relative;
  isolation: isolate;
  display: grid;
  min-width: 0;
  flex: 1 1 auto;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  width: calc((100% - 6px) / 3);
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

.app-navigation--immersive-weather .primary-navigation {
  background: transparent;
}

.app-navigation--immersive-weather .navigation-slider {
  top: 3px;
  bottom: 3px;
  height: auto;
  border-radius: 19px;
  background: transparent;
  box-shadow: none;
  color: var(--weather-accent);
}

.app-navigation--immersive-weather .navigation-slider::after {
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentcolor;
  content: '';
  transform: translateX(-50%);
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

.primary-navigation a:hover {
  color: #243139;
}

.primary-navigation a.is-active {
  color: #fff;
}

.app-navigation--immersive-weather .primary-navigation a {
  color: var(--navigation-muted);
}

.app-navigation--immersive-weather .primary-navigation a:hover,
.app-navigation--immersive-weather .primary-navigation a.is-active {
  color: var(--navigation-ink);
}

.primary-navigation a:focus-visible {
  outline: 2px solid currentcolor;
  outline-offset: -3px;
}

.app-navigation :deep(.unit-toggler) {
  --unit-ink: var(--navigation-ink, #243139);
  --unit-muted: var(--navigation-muted, rgba(36, 49, 57, 0.68));

  justify-self: end;
  padding-left: 5px;
  border-left: 1px solid color-mix(in srgb, var(--navigation-ink) 12%, transparent);
}

.world-drawer-handle {
  position: absolute;
  z-index: 2;
  bottom: calc(100% - 1px);
  left: 50%;
  display: inline-flex;
  width: 112px;
  height: 46px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: inherit;
  cursor: pointer;
  transform: translateX(-50%);
  transition:
    color 180ms ease,
    transform 440ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.app-navigation.is-world-drawer-open .world-drawer-handle {
  color: inherit;
  transform: translate(-50%, calc(-1 * (var(--world-drawer-height) + var(--world-drawer-gap))));
}

.app-navigation--immersive-weather .world-drawer-handle,
.app-navigation--immersive-weather.is-world-drawer-open .world-drawer-handle {
  color: var(--drawer-handle-color);
}

.world-drawer-grabber {
  width: 28px;
  height: 2px;
  border-radius: 999px;
  background: currentcolor;
  box-shadow: 0 1px 2px rgba(12, 22, 28, 0.16);
  opacity: 0.5;
  transition:
    width 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}

.world-drawer-grabber.is-open {
  width: 36px;
  opacity: 0.72;
}

.world-drawer-handle-label {
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.04em;
  line-height: 1;
}

.app-navigation--immersive-weather .world-drawer-handle-label {
  text-shadow: 0 1px 2px rgba(12, 22, 28, 0.2);
}

.world-drawer-handle:focus-visible {
  outline: none;
}

.world-drawer-handle:focus-visible .world-drawer-grabber {
  box-shadow: 0 0 0 3px color-mix(in srgb, currentcolor 18%, transparent);
  opacity: 1;
}

.world-drawer-handle:focus-visible .world-drawer-handle-label {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.page-container {
  width: min(1120px, calc(100% - 32px));
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 48px 0 calc(116px + env(safe-area-inset-bottom));
}

.page-container--scene {
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
    --floating-nav-width: min(340px, calc(100vw - 18px));
  }

  .primary-navigation a {
    flex-direction: column;
    gap: 2px;
    padding: 3px 2px;
    font-size: 10px;
  }

  .primary-navigation a svg {
    width: 15px;
    height: 15px;
  }

  .page-container:not(.page-container--scene) {
    width: min(100% - 28px, 1120px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .navigation-slider,
  .primary-navigation a,
  .world-drawer-handle,
  .world-drawer-grabber {
    transition: none;
  }
}
</style>
