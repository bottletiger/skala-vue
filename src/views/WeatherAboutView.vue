<script setup>
import WeatherRouteLink from '@/components/common/WeatherRouteLink.vue'
import WeatherScene from '@/components/common/WeatherScene.vue'
import { useSharedWeatherTheme } from '@/composables/useSharedWeatherTheme'
import { CITY_CONFIG } from '@/data/cities'

const { weatherTheme: aboutTheme } = useSharedWeatherTheme()

const serviceFacts = [
  { value: `${CITY_CONFIG.length}개`, label: '세계 주요 도시' },
  { value: '3시간', label: '시간별 예보 간격' },
  { value: '5일', label: '일별 예보 범위' },
]

const forecastFeatures = [
  {
    index: '01',
    title: '현재 관측',
    description: '기온, 체감 온도, 습도와 풍속을 도시별로 확인합니다.',
  },
  {
    index: '02',
    title: '시간별 예보',
    description: '3시간 간격의 기온과 날씨, 강수확률을 보여줍니다.',
  },
  {
    index: '03',
    title: '5일 예보',
    description: '도시 현지 날짜에 맞춘 최저·최고 기온과 날씨 흐름을 제공합니다.',
  },
]
</script>

<template>
  <WeatherScene :theme="aboutTheme">
    <article class="about-shell">
      <header class="about-hero">
        <p class="eyebrow">WEATHER</p>
        <h1>세계의 날씨를<br />한눈에</h1>
        <p class="intro">주요 도시의 현재 관측과 시간별·5일 예보를 한곳에서 확인하세요.</p>
      </header>

      <dl class="service-facts" aria-label="서비스 제공 범위">
        <div v-for="fact in serviceFacts" :key="fact.label" class="fact-item">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>

      <section class="forecast-section" aria-labelledby="forecast-title">
        <div class="section-heading">
          <p>FORECAST</p>
          <h2 id="forecast-title">필요한 날씨만 간결하게</h2>
        </div>

        <ul class="feature-list">
          <li v-for="feature in forecastFeatures" :key="feature.index" class="feature-row">
            <span class="feature-index" aria-hidden="true">{{ feature.index }}</span>
            <div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section class="data-source" aria-labelledby="data-source-title">
        <div>
          <p>DATA SOURCE</p>
          <h2 id="data-source-title">OpenWeather</h2>
        </div>
        <p>현재 날씨와 5일·3시간 예보 데이터를 사용합니다.</p>
      </section>

      <WeatherRouteLink class="home-link" :to="{ name: 'WeatherHome' }">날씨 보기</WeatherRouteLink>
    </article>
  </WeatherScene>
</template>

<style scoped>
.about-shell {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(920px, calc(100% - 40px));
  min-height: 100svh;
  align-content: start;
  margin: 0 auto;
  padding: clamp(54px, 8svh, 88px) 0 calc(var(--floating-nav-clearance, 180px) + env(safe-area-inset-bottom));
}

.about-hero {
  max-width: 720px;
}

.eyebrow,
.section-heading > p,
.data-source > div > p {
  margin: 0 0 9px;
  color: var(--weather-accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(48px, 8vw, 76px);
  line-height: 0.96;
  letter-spacing: -0.06em;
}

.intro {
  max-width: 560px;
  margin: 20px 0 0;
  color: var(--hero-muted);
  font-size: 15px;
  line-height: 1.7;
}

.service-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: clamp(34px, 6svh, 56px) 0 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
}

.fact-item {
  display: grid;
  gap: 2px;
  padding: 18px 22px;
}

.fact-item:first-child {
  padding-left: 4px;
}

.fact-item + .fact-item {
  border-left: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
}

.fact-item dt {
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
}

.fact-item dd {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 850;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.forecast-section {
  margin-top: clamp(38px, 6svh, 60px);
}

.section-heading {
  margin-bottom: 14px;
}

.section-heading h2,
.data-source h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(20px, 2.8vw, 28px);
  letter-spacing: -0.045em;
}

.feature-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  list-style: none;
}

.feature-row {
  display: grid;
  min-height: 76px;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 14px 4px;
}

.feature-row + .feature-row {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
}

.feature-index {
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
  line-height: 1.6;
}

.data-source {
  display: grid;
  grid-template-columns: minmax(180px, 0.65fr) minmax(0, 1fr);
  align-items: center;
  gap: 28px;
  margin-top: clamp(34px, 5svh, 50px);
  padding: 22px 24px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 17%, transparent);
  border-radius: 22px;
  background: linear-gradient(135deg, color-mix(in srgb, white 13%, transparent), color-mix(in srgb, white 7%, transparent));
  box-shadow: 0 12px 34px color-mix(in srgb, var(--hero-end) 22%, transparent);
  backdrop-filter: blur(16px) saturate(108%);
  -webkit-backdrop-filter: blur(16px) saturate(108%);
}

.data-source > p {
  margin: 0;
  color: var(--hero-muted);
  font-size: 13px;
  line-height: 1.65;
}

.home-link {
  justify-self: start;
  margin-top: 18px;
}

@supports not (backdrop-filter: blur(1px)) {
  .data-source {
    background: color-mix(in srgb, var(--hero-start) 84%, white);
  }
}

@media (max-width: 620px) {
  .about-shell {
    width: min(100% - 28px, 920px);
    padding-top: 44px;
  }

  h1 {
    font-size: clamp(46px, 15vw, 62px);
  }

  .service-facts {
    grid-template-columns: 1fr;
  }

  .fact-item,
  .fact-item:first-child {
    padding: 14px 4px;
  }

  .fact-item + .fact-item {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
    border-left: 0;
  }

  .fact-item {
    grid-template-columns: 1fr auto;
    align-items: baseline;
  }

  .data-source {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 20px;
  }
}
</style>
