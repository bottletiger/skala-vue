<script setup>
import WeatherRouteLink from '@/components/common/WeatherRouteLink.vue'
import WeatherScene from '@/components/common/WeatherScene.vue'
</script>

<template>
  <WeatherScene>
    <main class="not-found-shell">
      <section class="not-found-panel" aria-labelledby="not-found-title">
        <p class="status-code" aria-hidden="true">404</p>
        <h1 id="not-found-title">페이지를 찾을 수 없습니다</h1>
        <p class="not-found-copy">주소를 다시 확인하거나 현재 날씨로 돌아가세요.</p>

        <WeatherRouteLink class="home-link" :to="{ name: 'WeatherHome' }">날씨 보기</WeatherRouteLink>
      </section>
    </main>
  </WeatherScene>
</template>

<style scoped>
.not-found-shell {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 100svh;
  place-items: center;
  padding: clamp(36px, 6svh, 64px) 20px var(--floating-nav-clearance, 180px);
}

.not-found-panel {
  width: min(620px, 100%);
  padding: clamp(34px, 6vw, 58px) 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  text-align: center;
}

.status-code {
  margin: 0 0 14px;
  color: var(--weather-accent);
  font-size: clamp(64px, 12vw, 108px);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.08em;
  line-height: 0.82;
}

.not-found-panel h1 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.1;
  letter-spacing: -0.055em;
}

.not-found-copy {
  margin: 16px 0 0;
  color: var(--hero-muted);
  font-size: 14px;
}

.home-link {
  margin-top: 26px;
}

@media (max-width: 480px) {
  .not-found-shell {
    padding-inline: 22px;
  }

  .not-found-copy {
    font-size: 13px;
  }
}
</style>
