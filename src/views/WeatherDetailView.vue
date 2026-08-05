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

    <section class="forecast-section" aria-labelledby="weekly-forecast-title">
      <h3 id="weekly-forecast-title">7일 예보</h3>

      <p v-if="forecastStatus === 'loading'" class="forecast-status" aria-live="polite">
        주간 예보를 불러오는 중입니다.
      </p>
      <p
        v-else-if="forecastStatus === 'error'"
        class="forecast-status forecast-status--error"
        aria-live="polite">
        {{ forecastErrorMessage }}
      </p>

      <div v-else class="forecast-grid">
        <article
          v-for="day in weeklyForecast"
          :key="day.date"
          class="forecast-day">
          <time :datetime="day.date">{{ formatForecastDate(day.date) }}</time>
          <span class="forecast-icon" aria-hidden="true">
            {{ getForecastCondition(day.weatherCode).icon }}
          </span>
          <span class="forecast-condition">
            {{ getForecastCondition(day.weatherCode).label }}
          </span>
          <strong>
            {{ configStore.formatTemp(day.tempMax) }}
            <span>{{ configStore.formatTemp(day.tempMin) }}</span>
          </strong>
          <small>강수 {{ day.precipitationProbability }}%</small>
        </article>
      </div>

      <a
        v-if="forecastStatus === 'success'"
        class="forecast-source"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noopener">
        예보 데이터: Open-Meteo
      </a>
    </section>

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
import { getWeatherList, getWeeklyForecast } from '@/api/weatherApi'
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();
const city = ref(null);
const isLoading = ref(true);
const weeklyForecast = ref([]);
const forecastStatus = ref('loading');
const forecastErrorMessage = ref('주간 예보를 불러오지 못했습니다.');

const loadWeeklyForecast = async (currentCity) => {
  const requestedCityId = String(currentCity.id);
  const { lat, lon } = currentCity.detail.coord;

  forecastStatus.value = 'loading';
  forecastErrorMessage.value = '주간 예보를 불러오지 못했습니다.';

  try {
    const forecast = await getWeeklyForecast({
      cityId: requestedCityId,
      latitude: lat,
      longitude: lon,
    });

    if (String(city.value?.id) !== requestedCityId) return;

    weeklyForecast.value = forecast;
    forecastStatus.value = 'success';
  } catch (error) {
    console.error(error);

    if (String(city.value?.id) !== requestedCityId) return;

    weeklyForecast.value = [];
    forecastErrorMessage.value = error.response?.data?.reason
      || '주간 예보를 불러오지 못했습니다.';
    forecastStatus.value = 'error';
  }
};

const loadCity = async () => {
  isLoading.value = true;
  weeklyForecast.value = [];
  forecastStatus.value = 'loading';
  forecastErrorMessage.value = '주간 예보를 불러오지 못했습니다.';

  const routedCity = window.history.state?.city;
  if (
    routedCity &&
    String(routedCity.id) === String(route.params.cityId) &&
    routedCity.detail
  ) {
    city.value = routedCity;
    isLoading.value = false;
    loadWeeklyForecast(routedCity);
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

  if (city.value?.detail?.coord) {
    loadWeeklyForecast(city.value);
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

const formatForecastDate = (date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`))

const getForecastCondition = (code) => {
  if (code === 0) return { icon: '☀️', label: '맑음' }
  if ([1, 2].includes(code)) return { icon: '🌤️', label: '구름 조금' }
  if (code === 3) return { icon: '☁️', label: '흐림' }
  if ([45, 48].includes(code)) return { icon: '🌫️', label: '안개' }
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: '🌦️', label: '이슬비' }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: '🌧️', label: '비' }
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { icon: '🌨️', label: '눈' }
  }
  if ([95, 96, 99].includes(code)) return { icon: '⛈️', label: '뇌우' }

  return { icon: '🌥️', label: '날씨 변화' }
}

const closeDetail = () => {
  router.push({ name: 'weather', query: route.query });
};
</script>

<style scoped>
.detail-page,
.empty-state {
  margin: 0;
  color: var(--color-text);
}

.detail-page {
  position: relative;
  padding: 22px;
}

.weather-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-background-mute);
  color: var(--color-heading);
}

.location,
.updated-at {
  margin: 0;
}

.location {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.weather-hero h2 {
  margin: 4px 0;
  font-size: 23px;
  font-weight: 700;
}

.updated-at {
  color: var(--color-text-soft);
  font-size: 12px;
}

.temperature {
  display: flex;
  align-items: center;
}

.temperature img {
  width: 58px;
  height: 58px;
}

.temperature strong {
  font-size: 34px;
  font-weight: 650;
  letter-spacing: -0.04em;
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
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-background-soft);
  text-align: center;
}

.summary-card span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.summary-card strong {
  color: var(--color-heading);
  font-size: 18px;
}

.forecast-section {
  margin: 12px 0;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-soft);
}

.forecast-section h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.forecast-status {
  margin: 0;
  padding: 14px 0;
  color: var(--color-text-muted);
  text-align: center;
}

.forecast-status--error {
  color: var(--color-danger);
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(84px, 1fr));
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.forecast-day {
  display: flex;
  min-width: 84px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 9px 5px;
  border-radius: 8px;
  border: 1px solid var(--color-border-soft);
  background: var(--color-background-mute);
  text-align: center;
}

.forecast-day time,
.forecast-day small {
  color: var(--color-text-muted);
  font-size: 11px;
}

.forecast-icon {
  font-size: 23px;
}

.forecast-condition {
  min-height: 32px;
  color: var(--color-text);
  font-size: 11px;
}

.forecast-day strong {
  font-size: 13px;
}

.forecast-day strong span {
  color: var(--color-text-muted);
  font-weight: 500;
}

.forecast-source {
  display: block;
  width: fit-content;
  margin: 6px 0 0 auto;
  color: var(--color-text-soft);
  font-size: 10px;
}

.details-card {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-soft);
}

.details-card h3 {
  margin: 0 0 12px;
  color: var(--color-heading);
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
  border-bottom: 1px solid var(--color-border);
}

.details-card dt {
  color: var(--color-text-muted);
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
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-background-soft);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.modal-close:hover {
  background: var(--color-background-mute);
  color: var(--color-heading);
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
  background: var(--color-background-mute);
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
