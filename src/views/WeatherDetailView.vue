<template>
  <section v-if="isLoading" class="empty-state">
    <p>상세 정보를 불러오는 중입니다.</p>
  </section>

  <section v-else-if="detail" class="detail-page">
    <UButton
      type="button"
      color="neutral"
      variant="soft"
      size="sm"
      square
      class="modal-close"
      aria-label="상세 닫기"
      @click="closeDetail">
      ×
    </UButton>

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

  </section>

  <section v-else class="empty-state">
    <p>도시 상세 정보를 불러올 수 없습니다.</p>
    <UButton type="button" color="primary" @click="closeDetail">대시보드로 돌아가기</UButton>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWeatherList } from '@/api/weatherApi'
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();
const city = ref(null);
const isLoading = ref(true);

const loadCity = async () => {
  isLoading.value = true;

  const routedCity = window.history.state?.city;
  if (
    routedCity &&
    String(routedCity.id) === String(route.params.cityId) &&
    routedCity.detail
  ) {
    city.value = routedCity;
    isLoading.value = false;
    return;
  }

  try {
    const weatherList = await getWeatherList();
    city.value = weatherList.find(
      (item) => String(item.id) === String(route.params.cityId),
    ) ?? null;
  } catch (error) {
    console.error(error);
    city.value = null;
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.params.cityId, loadCity, { immediate: true });

const detail = computed(() => city.value?.detail ?? null);

const weatherIcon = computed(() =>
  `https://openweathermap.org/img/wn/${detail.value?.weather?.[0]?.icon}@2x.png`,
)

const formatTime = (timestamp) => {
  const localTimestamp = (timestamp + (detail.value?.timezone ?? 0)) * 1000

  return new Date(localTimestamp).toLocaleTimeString('ko-KR', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const closeDetail = () => {
  router.push({ name: 'weather', query: route.query });
};
</script>

<style scoped>
.detail-page,
.empty-state {
  margin: 0;
  color: #334155;
}

.detail-page {
  position: relative;
  padding: 20px;
}

.weather-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  border-radius: 14px;
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
  font-size: 28px;
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
  width: 62px;
  height: 62px;
}

.temperature strong {
  font-size: 40px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px 0;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 76px;
  padding: 12px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  background: #fff;
  text-align: center;
}

.summary-card span {
  color: #64748b;
  font-size: 12px;
}

.summary-card strong {
  color: #334155;
  font-size: 18px;
}

.details-card {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.details-card h3 {
  margin: 0 0 12px;
  color: #334155;
  font-size: 16px;
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
  padding: 9px 0;
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

.modal-close {
  position: absolute;
  z-index: 1;
  top: 31px;
  right: 31px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0 0 3px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.24);
  color: #fff;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.modal-close:hover {
  background: rgba(15, 23, 42, 0.42);
  transform: scale(1.05);
}

.btn-home {
  display: block;
  margin-top: 15px;
  padding: 11px 16px;
  border: 0;
  border-radius: 5px;
  background: #0ea5e9;
  color: #fff;
  cursor: pointer;
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
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .details-card dl {
    grid-template-columns: 1fr;
  }

  .detail-page {
    padding: 12px;
  }

  .weather-hero {
    padding: 18px;
  }

  .weather-hero h2 {
    font-size: 23px;
  }

  .temperature img {
    width: 56px;
    height: 56px;
  }

  .temperature strong {
    font-size: 34px;
  }

  .modal-close {
    top: 27px;
    right: 27px;
  }
}
</style>
