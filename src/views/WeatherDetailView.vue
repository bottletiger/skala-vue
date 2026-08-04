<template>
  <section v-if="detail" class="detail-page">
    <header class="weather-hero">
      <div>
        <p class="location">📍 {{ city.name_kr ?? detail.name }}, {{ detail.sys.country }}</p>
        <h2>{{ detail.weather[0].description }}</h2>
        <p class="updated-at">관측 시간 {{ formatTime(detail.dt) }}</p>
      </div>

      <div class="temperature">
        <img :src="weatherIcon" :alt="detail.weather[0].description" />
        <strong>{{ configStore.formatTemp(Math.round(detail.main.temp)) }}</strong>
      </div>
    </header>

    <div class="summary-grid">
      <article class="summary-card">
        <span>🌡️ 체감온도</span>
        <strong>{{ configStore.formatTemp(Math.round(detail.main.feels_like)) }}</strong>
      </article>
      <article class="summary-card">
        <span>💧 습도</span>
        <strong>{{ detail.main.humidity }}%</strong>
      </article>
      <article class="summary-card">
        <span>💨 풍속</span>
        <strong>{{ detail.wind.speed }} m/s</strong>
      </article>
      <article class="summary-card">
        <span>☁️ 구름량</span>
        <strong>{{ detail.clouds.all }}%</strong>
      </article>
    </div>

    <div class="details-card">
      <h3>상세 관측 정보</h3>
      <dl>
        <div>
          <dt>최저 / 최고 기온</dt>
          <dd>{{ configStore.formatTemp(detail.main.temp_min )}}° / {{ configStore.formatTemp(detail.main.temp_max) }}°</dd>
        </div>
        <div>
          <dt>기압</dt>
          <dd>{{ detail.main.pressure }} hPa</dd>
        </div>
        <div>
          <dt>가시거리</dt>
          <dd>{{ (detail.visibility / 1000).toFixed(1) }} km</dd>
        </div>
        <div>
          <dt>돌풍</dt>
          <dd>{{ detail.wind.gust ?? '-' }} m/s</dd>
        </div>
        <div>
          <dt>일출</dt>
          <dd>🌅 {{ formatTime(detail.sys.sunrise) }}</dd>
        </div>
        <div>
          <dt>일몰</dt>
          <dd>🌇 {{ formatTime(detail.sys.sunset) }}</dd>
        </div>
        <div>
          <dt>좌표</dt>
          <dd>{{ detail.coord.lat }}, {{ detail.coord.lon }}</dd>
        </div>
      </dl>
    </div>

    <RouterLink to="/" class="btn-home">← 대시보드 홈으로 이동</RouterLink>
  </section>

  <section v-else class="empty-state">
    <p>도시 상세 정보를 불러올 수 없습니다.</p>
    <RouterLink to="/" class="btn-home">대시보드 홈으로 이동</RouterLink>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore();
const city = window.history.state?.city ?? null
const detail = city?.detail ?? null

const weatherIcon = computed(() =>
  `https://openweathermap.org/img/wn/${detail?.weather?.[0]?.icon}@2x.png`,
)

const formatTime = (timestamp) => {
  const localTimestamp = (timestamp + detail.timezone) * 1000

  return new Date(localTimestamp).toLocaleTimeString('ko-KR', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.detail-page,
.empty-state {
  margin: 28px auto 0;
  color: #334155;
}

.weather-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
  color: #fff;
}

.location,
.updated-at {
  margin: 0;
}

.weather-hero h2 {
  margin: 6px 0;
  font-size: 25px;
}

.updated-at {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.temperature {
  display: flex;
  align-items: center;
}

.temperature img {
  width: 72px;
  height: 72px;
}

.temperature strong {
  font-size: 44px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 14px 0;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.summary-card span {
  color: #64748b;
  font-size: 13px;
}

.details-card {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.details-card h3 {
  margin: 0 0 12px;
  font-size: 17px;
}

.details-card dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 24px;
  margin: 0;
}

.details-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.details-card dt {
  color: #64748b;
}

.details-card dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.btn-home {
  display: block;
  margin-top: 15px;
  padding: 11px 16px;
  border-radius: 5px;
  background: #0ea5e9;
  color: #fff;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.btn-home:hover {
  background: #0284c7;
}

.empty-state {
  padding: 40px 20px;
  border-radius: 10px;
  background: #f8fafc;
  text-align: center;
}

@media (max-width: 560px) {
  .summary-grid,
  .details-card dl {
    grid-template-columns: repeat(2, 1fr);
  }

  .weather-hero {
    padding: 18px;
  }

  .temperature img {
    width: 56px;
    height: 56px;
  }

  .temperature strong {
    font-size: 34px;
  }
}
</style>
