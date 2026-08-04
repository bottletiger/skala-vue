<script setup>
import { RouterLink } from 'vue-router'

import { getWeatherTheme } from '@/utils/weatherTheme'

const aboutTheme = getWeatherTheme(null)
const features = [
  {
    index: '01',
    title: '도시 검색',
    description: '도시를 검색하고 현재 날씨 카드를 한 화면에서 비교합니다.',
  },
  {
    index: '02',
    title: '도시별 상세 정보',
    description: '동적 경로를 이용해 도시별 상세 기상관측 정보를 확인합니다.',
  },
  {
    index: '03',
    title: '온도 단위 전환',
    description: 'Pinia로 섭씨와 화씨 설정을 모든 날씨 화면에 공유합니다.',
  },
  {
    index: '04',
    title: '경로 오류 안내',
    description: '정의되지 않은 주소는 별도의 404 화면으로 안내합니다.',
  },
]
</script>

<template>
  <div class="about-scene" :style="aboutTheme.cssVariables" data-theme="neutral">
    <div class="about-atmosphere" aria-hidden="true"></div>

    <article class="about-shell">
      <header class="about-hero">
        <p class="eyebrow">서비스 소개</p>
        <h1>도시별 현재 날씨를 한눈에 확인하세요</h1>
        <p class="intro">이 프로젝트는 Vue 3, Vue Router, Pinia와 Axios를 활용해 OpenWeatherMap의 현재 관측 데이터를 보여주는 날씨 대시보드입니다.</p>
      </header>

      <section class="features-section" aria-labelledby="about-features">
        <div class="section-heading">
          <h2 id="about-features">주요 기능</h2>
          <span>Weather Dashboard</span>
        </div>

        <ul class="feature-grid">
          <li v-for="feature in features" :key="feature.index" class="feature-card">
            <span class="feature-index" aria-hidden="true">{{ feature.index }}</span>
            <div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </li>
        </ul>
      </section>

      <RouterLink class="home-link" :to="{ name: 'WeatherHome' }">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 5-7 7 7 7" />
        </svg>
        <span>날씨 대시보드로 돌아가기</span>
      </RouterLink>
    </article>
  </div>
</template>

<style scoped>
.about-scene {
  position: relative;
  min-height: 100svh;
  overflow: clip;
  background:
    radial-gradient(circle at 78% 12%, color-mix(in srgb, var(--weather-accent) 24%, transparent) 0%, transparent 31%),
    radial-gradient(ellipse at 14% 88%, color-mix(in srgb, var(--hero-end) 72%, transparent) 0%, transparent 52%),
    linear-gradient(158deg, var(--hero-start) 0%, color-mix(in srgb, var(--hero-start) 54%, var(--hero-end)) 52%, var(--hero-end) 100%);
  color: var(--hero-text);
  isolation: isolate;
}

.about-scene::before,
.about-scene::after,
.about-atmosphere {
  position: absolute;
  pointer-events: none;
  content: '';
}

.about-scene::before {
  z-index: -2;
  inset: -18% -14% -8%;
  background:
    radial-gradient(ellipse at 12% 28%, rgba(255, 255, 255, 0.34) 0 6%, transparent 28%), radial-gradient(ellipse at 52% 20%, rgba(255, 255, 255, 0.2) 0 8%, transparent 31%),
    radial-gradient(ellipse at 88% 38%, color-mix(in srgb, var(--weather-accent) 22%, transparent) 0 7%, transparent 30%);
  filter: blur(34px);
  opacity: 0.82;
  animation: about-atmosphere-drift 22s ease-in-out infinite alternate;
}

.about-scene::after {
  z-index: -1;
  right: -22%;
  bottom: -20%;
  left: -22%;
  height: 62%;
  background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--weather-accent) 26%, transparent) 0%, transparent 62%), linear-gradient(to top, rgba(255, 255, 255, 0.13), transparent 72%);
  filter: blur(58px);
  opacity: 0.72;
}

.about-atmosphere {
  z-index: -1;
  inset: 0;
  background: radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, 0.22), transparent 48%), linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 48%, rgba(255, 255, 255, 0.07));
}

@keyframes about-atmosphere-drift {
  from {
    transform: translate3d(-1.5%, -0.5%, 0) scale(1);
  }

  to {
    transform: translate3d(1.5%, 0.8%, 0) scale(1.035);
  }
}

.about-shell {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(980px, calc(100% - 40px));
  min-height: 100svh;
  align-content: center;
  justify-items: start;
  margin: 0 auto;
  padding: clamp(48px, 8svh, 92px) 0 calc(116px + env(safe-area-inset-bottom));
  border: 0;
  background: transparent;
}

.about-hero {
  max-width: 760px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

h1 {
  max-width: 720px;
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(38px, 6vw, 64px);
  line-height: 1.04;
  letter-spacing: -0.055em;
}

.intro {
  max-width: 680px;
  margin: 20px 0 0;
  color: var(--hero-muted);
  font-size: 15px;
  line-height: 1.75;
}

.features-section {
  width: 100%;
  margin-top: clamp(32px, 5svh, 52px);
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 15px;
  padding: 0 4px;
}

.section-heading h2 {
  margin: 0;
  font-size: 18px;
}

.section-heading span {
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.04em;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-card {
  display: grid;
  min-width: 0;
  min-height: 126px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  backdrop-filter: blur(14px) saturate(108%);
}

.feature-index {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--weather-accent) 12%, transparent);
  color: var(--weather-accent);
  font-size: 10px;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

.feature-card h3 {
  margin: 2px 0 6px;
  color: var(--hero-text);
  font-size: 15px;
}

.feature-card p {
  margin: 0;
  color: var(--hero-muted);
  font-size: 13px;
  line-height: 1.65;
}

.home-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 7px;
  margin-top: 20px;
  padding: 0 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--hero-muted);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition: color 180ms ease;
}

.home-link svg {
  width: 17px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: transform 180ms ease;
}

.home-link:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--weather-accent) 72%, white);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .home-link:hover {
    color: var(--hero-text);
  }

  .home-link:hover svg {
    transform: translateX(-3px);
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .feature-card {
    background: rgba(238, 242, 239, 0.72);
  }
}

@media (max-width: 620px) {
  .about-shell {
    width: min(100% - 28px, 980px);
    align-content: start;
    padding-top: 46px;
  }

  h1 {
    font-size: clamp(36px, 12vw, 50px);
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .section-heading span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-scene::before {
    animation: none;
  }

  .home-link,
  .home-link svg {
    transition: none;
  }

  .home-link:hover svg {
    transform: none;
  }
}
</style>
