<script setup>
import { RouterLink } from 'vue-router'

import { useSharedWeatherTheme } from '@/composables/useSharedWeatherTheme'

const { weatherTheme: aboutTheme } = useSharedWeatherTheme()
const serviceFacts = [
  {
    value: '10개',
    label: '제공 도시',
    description: '서울부터 제주까지 주요 도시의 현재 날씨를 비교합니다.',
  },
  {
    value: '3시간',
    label: '예보 간격',
    description: '앞으로 약 24시간을 8개 시간대로 나누어 보여줍니다.',
  },
  {
    value: '5일',
    label: '일별 흐름',
    description: '도시 현지 날짜를 기준으로 최저·최고 기온을 집계합니다.',
  },
]

const features = [
  {
    index: '01',
    title: '도시별 현재 날씨',
    description: '기온, 체감 온도, 습도, 풍속과 관측 시각을 선택한 도시의 Hero에서 바로 확인합니다.',
  },
  {
    index: '02',
    title: '유연한 한글 검색',
    description: '일반 검색뿐 아니라 초성, 완성 전 음절과 두벌식 영문 오타까지 도시명으로 변환해 찾습니다.',
  },
  {
    index: '03',
    title: '상세 관측 정보',
    description: '도시별 체감 온도, 습도, 풍속, 기압, 시정거리와 일출·일몰 정보를 한 패널에 정리합니다.',
  },
  {
    index: '04',
    title: '시간대별·5일 예보',
    description: '3시간 간격의 기온·날씨·강수확률과 현지 날짜별 예상 최저·최고 기온을 제공합니다.',
  },
  {
    index: '05',
    title: '공통 온도 단위',
    description: '하단 컨트롤에서 선택한 섭씨·화씨 단위를 메인, 상세 정보와 모든 예보에 함께 반영합니다.',
  },
  {
    index: '06',
    title: '상태 보존과 경로 이동',
    description: '도시 상세 경로를 분리하고 뒤로 돌아올 때 최근 날씨와 펼쳐 둔 목록 상태를 복원합니다.',
  },
]

const dataNotes = [
  '현재 날씨와 예보는 OpenWeatherMap 응답을 화면 모델로 변환해 표시합니다.',
  '응답에 값이 없으면 임의의 수치를 만들지 않고 정보 없음으로 구분합니다.',
  '일별 최저·최고는 해당 현지 날짜에 포함된 3시간별 예보 범위입니다.',
  '대표 날씨는 각 날짜의 현지 정오에 가장 가까운 예보를 기준으로 선택합니다.',
]

const technologyStack = ['Vue 3', 'Vue Router', 'Pinia', 'Axios', 'Element Plus']
</script>

<template>
  <div class="about-scene" :style="aboutTheme.cssVariables" :data-theme="aboutTheme.name">
    <div class="about-atmosphere" aria-hidden="true"></div>

    <article class="about-shell">
      <header class="about-hero">
        <p class="eyebrow">WEATHER DASHBOARD</p>
        <h1>웹사이트 소개</h1>
        <p class="intro">
          대한민국 10개 도시의 현재 관측값부터 약 24시간의 시간대별 날씨와 최대 5일 예보까지,<br />
          OpenWeatherMap 데이터를 같은 기준으로 정리하는 날씨 대시보드입니다.
        </p>
      </header>

      <dl class="service-facts" aria-label="서비스 제공 범위">
        <div v-for="fact in serviceFacts" :key="fact.label" class="fact-item">
          <dt>
            <strong>{{ fact.value }}</strong>
            <span>{{ fact.label }}</span>
          </dt>
          <dd>{{ fact.description }}</dd>
        </div>
      </dl>

      <section class="features-section" aria-labelledby="about-features">
        <div class="section-heading">
          <h2 id="about-features">주요 기능</h2>
          <span>Weather Dashboard</span>
        </div>

        <ul class="feature-list">
          <li v-for="feature in features" :key="feature.index" class="feature-row">
            <span class="feature-index" aria-hidden="true">{{ feature.index }}</span>
            <div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section class="data-section" aria-labelledby="about-data">
        <div class="section-heading">
          <h2 id="about-data">데이터 기준</h2>
          <span>OpenWeatherMap</span>
        </div>

        <div class="data-panel">
          <div class="data-source">
            <p>사용 데이터</p>
            <h3>Current Weather<br />5 Day / 3 Hour Forecast</h3>
            <p>현재 관측과 예보는 서로 다른 요청 상태로 관리해 한쪽 요청이 실패해도 가능한 정보는 계속 표시합니다.</p>

            <ul class="technology-list" aria-label="구현 기술">
              <li v-for="technology in technologyStack" :key="technology">{{ technology }}</li>
            </ul>
          </div>

          <ul class="data-notes">
            <li v-for="note in dataNotes" :key="note">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7" /></svg>
              <span>{{ note }}</span>
            </li>
          </ul>
        </div>
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
  align-content: start;
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

.service-facts {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: clamp(30px, 5svh, 48px) 0 0;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.24);
  border-bottom: 1px solid rgba(255, 255, 255, 0.24);
}

.fact-item {
  min-width: 0;
  padding: 0 24px;
}

.fact-item:first-child {
  padding-left: 4px;
}

.fact-item + .fact-item {
  border-left: 1px solid rgba(255, 255, 255, 0.22);
}

.fact-item dt {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.fact-item dt strong {
  color: var(--hero-text);
  font-size: clamp(24px, 3.2vw, 34px);
  font-weight: 820;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.fact-item dt span {
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 800;
}

.fact-item dd {
  max-width: 250px;
  margin: 7px 0 0;
  color: var(--hero-muted);
  font-size: 12px;
  line-height: 1.6;
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

.feature-list {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  backdrop-filter: blur(14px) saturate(108%);
}

.feature-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin: 0;
  padding: 0 22px;
  overflow: hidden;
  border-radius: 24px;
  list-style: none;
}

.feature-row {
  display: grid;
  min-width: 0;
  min-height: 72px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 12px 2px;
}

.feature-row + .feature-row {
  border-top: 1px solid rgba(255, 255, 255, 0.19);
}

.feature-row > div {
  display: grid;
  min-width: 0;
  gap: 2px;
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

.feature-row h3 {
  margin: 0 0 2px;
  color: var(--hero-text);
  font-size: 15px;
}

.feature-row p {
  margin: 0;
  color: var(--hero-muted);
  font-size: 13px;
  line-height: 1.65;
}

.data-section {
  width: 100%;
  margin-top: clamp(32px, 5svh, 52px);
}

.data-panel {
  display: grid;
  grid-template-columns: minmax(240px, 0.78fr) minmax(0, 1.35fr);
  gap: 26px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  backdrop-filter: blur(14px) saturate(108%);
}

.data-source {
  padding-right: 26px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.data-source > p:first-child {
  margin: 0 0 7px;
  color: var(--weather-accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.data-source h3 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(19px, 2.4vw, 25px);
  line-height: 1.22;
  letter-spacing: -0.035em;
}

.data-source > p:not(:first-child) {
  margin: 14px 0 0;
  color: var(--hero-muted);
  font-size: 12px;
  line-height: 1.65;
}

.technology-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.technology-list li {
  padding: 6px 9px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 750;
}

.data-notes {
  display: grid;
  align-content: center;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.data-notes li {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  color: var(--hero-muted);
  font-size: 12px;
  line-height: 1.6;
}

.data-notes svg {
  width: 20px;
  height: 20px;
  padding: 3px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--weather-accent) 12%, transparent);
  fill: none;
  stroke: var(--weather-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
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
  .feature-list,
  .data-panel {
    background: rgba(238, 242, 239, 0.72);
  }
}

@media (max-width: 760px) {
  .data-panel {
    grid-template-columns: 1fr;
  }

  .data-source {
    padding: 0 0 22px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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

  .feature-list {
    padding: 0 14px;
    border-radius: 22px;
  }

  .feature-row {
    min-height: 66px;
    gap: 12px;
    padding-block: 10px;
  }

  .service-facts {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .fact-item,
  .fact-item:first-child {
    padding: 17px 4px;
  }

  .fact-item + .fact-item {
    border-top: 1px solid rgba(255, 255, 255, 0.22);
    border-left: 0;
  }

  .fact-item dd {
    max-width: none;
  }

  .data-panel {
    padding: 20px;
    border-radius: 22px;
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
