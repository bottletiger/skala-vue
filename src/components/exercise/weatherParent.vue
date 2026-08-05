<template>
    <div class="container">
      <BaseDashboardCard>
        <WeatherMap />
      </BaseDashboardCard>
      
      <BaseDashboardCard>
          <SearchBar 
              :cur-query="searchQuery"
              :adding="isAddingCity"
              @update-query="updateSearchQuery"
              @add-city="addCity">
          </SearchBar>
          <p v-if="cityAddMessage" class="city-add-message" aria-live="polite">
            {{ cityAddMessage }}
          </p>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <div class="section-heading">
          <h2>🏞️ 지역별 날씨 현황</h2>
          <p>도시별 현재 관측 정보</p>
        </div>

        <p class="api-status" :class="`api-status--${apiStatus}`">
          <span v-if="apiStatus === 'loading'">{{ API_LOADING }}</span>
          <span v-else-if="apiStatus === 'success'">{{ API_SUCCESS }}</span>
          <span v-else>{{ API_FAIL }}</span>
        </p>

        <div class="cache-row">
          <p>{{ cacheStatusText }}</p>
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="xs"
            :loading="isRefreshing"
            :disabled="apiStatus === 'loading'"
            @click="loadWeather({ forceRefresh: true })">
            최신 날씨 다시 불러오기
          </UButton>
        </div>
        
        <div class="filter-row">
          <USelect
            v-model="sortKey"
            :items="sortOptions"
            class="filter-select"
            size="sm"
            aria-label="정렬 기준" />

          <UButton
            type="button"
            color="neutral"
            variant="solid"
            size="sm"
            square
            class="sort-direction"
            :aria-label="sortDirection === 'asc' ? '내림차순으로 변경' : '오름차순으로 변경'"
            @click="toggleSortDirection">
            {{ sortDirection === 'asc' ? '↑' : '↓' }}
          </UButton>

          <UButton
            type="button"
            :color="favoriteOnly ? 'primary' : 'neutral'"
            variant="outline"
            size="sm"
            class="favorite-filter"
            :aria-pressed="favoriteOnly"
            @click="favoriteOnly = !favoriteOnly">
            ★ 즐겨찾기 <span>{{ favoriteCount }}</span>
          </UButton>
        </div>
          
        <div class="weather-grid">
          <WeatherCard
            v-for="item in filteredWeatherList"
            :key="item.id"
            :city-item="item"
            :hot-temperature="HOT_TEMPERATURE"
            :is-favorite="isFavorite(item.id)"
            @select-card="selectCity"
            @toggle-favorite="toggleFavorite"
            @click-detail="showDetail">
          </WeatherCard>
        </div>
          <p v-if="filteredWeatherList.length === 0">
            {{ favoriteOnly ? '즐겨찾기한 도시가 없습니다.' : '검색 결과와 일치하는 도시가 없습니다.' }}
          </p>
          
          <div class="status-bar">
          {{ selectedCityInfo }}
          </div>
      </BaseDashboardCard>


    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, watchEffect } from 'vue';
import BaseDashboardCard from './BaseDashboardCard.vue';
import SearchBar from './SearchBar.vue';
import WeatherCard from './weatherCard.vue';
import WeatherMap from './WeatherMap.vue';
import {
  getWeatherByLocation,
  getWeatherCacheInfo,
  getWeatherList,
  saveCustomCity,
  saveWeatherListCache,
} from '@/api/weatherApi';
import { useRoute, useRouter } from 'vue-router';
import { useFavoriteCities } from '@/composables/useFavoriteCities';


const route = useRoute();
const router = useRouter();
const initialQuery = typeof route.query.q === 'string' ? route.query.q : '';
const searchQuery = ref(initialQuery);
// - searchQuery 감시 (watchEffect 이용): 도시 검색어를 타이핑할 때 마다 변하는 searchQuery를 추적하여 콘솔로그로 작성
const updateSearchQuery = (query) => {
    searchQuery.value = query;
    cityAddMessage.value = '';
}
watchEffect(() => {
  console.log(`[watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}' 에 매칭되는 API 데이터를 필터링했습니다`)
})

const HOT_TEMPERATURE= 28;
const API_LOADING = 'OpenWeather API 데이터 불러오는 중...';
const API_SUCCESS = 'OpenWeather API 데이터 로드 성공';
const API_FAIL = 'OpenWeather API 데이터 로드 실패';
const weatherList = ref([]);
const apiStatus = ref('loading');
const weatherSource = ref('');
const cacheExpiresAt = ref(0);
const currentTime = ref(Date.now());
const isRefreshing = ref(false);
const isAddingCity = ref(false);
const cityAddMessage = ref('');
let cacheTimer;

const loadWeather = async ({ forceRefresh = false } = {}) => {
  const cacheBeforeLoad = forceRefresh ? null : getWeatherCacheInfo();

  if (forceRefresh) {
    isRefreshing.value = true;
  } else if (weatherList.value.length === 0) {
    apiStatus.value = 'loading';
  }

  try {
    weatherList.value = await getWeatherList({ forceRefresh });
    apiStatus.value = 'success';
    weatherSource.value = cacheBeforeLoad ? 'cache' : 'network';

    const cacheInfo = getWeatherCacheInfo();
    cacheExpiresAt.value = cacheInfo?.expiresAt ?? 0;
    currentTime.value = Date.now();
  } catch (error) {
    console.error(error);
    apiStatus.value = 'error';
  } finally {
    isRefreshing.value = false;
  }
};

onMounted(() => {
  loadWeather();
  cacheTimer = window.setInterval(() => {
    currentTime.value = Date.now();

    const isExpired = cacheExpiresAt.value > 0
      && currentTime.value >= cacheExpiresAt.value;

    if (isExpired && apiStatus.value === 'success' && !isRefreshing.value) {
      loadWeather({ forceRefresh: true });
    }
  }, 60 * 1000);
})

onBeforeUnmount(() => {
  window.clearInterval(cacheTimer);
});

const cacheStatusText = computed(() => {
  if (apiStatus.value === 'loading') return '캐시 상태 확인 중'
  if (!cacheExpiresAt.value) return '저장된 캐시 없음'

  const remainingMilliseconds = cacheExpiresAt.value - currentTime.value

  if (remainingMilliseconds <= 0) return '캐시가 만료되었습니다.'

  const remainingMinutes = Math.ceil(remainingMilliseconds / (60 * 1000))
  const sourceText = weatherSource.value === 'cache'
    ? '캐시 데이터 사용 중'
    : '최신 데이터 사용 중'

  return `${sourceText} · 다음 갱신까지 ${remainingMinutes}분`
})

const sortKey = ref('name');
const sortDirection = ref('asc');
const sortOptions = [
  { label: '이름순', value: 'name' },
  { label: '기온순', value: 'temp' },
  { label: '체감온도순', value: 'feels' },
  { label: '습도순', value: 'humidity' },
  { label: '풍속순', value: 'wind' },
]
const favoriteOnly = ref(false);
const { favoriteIds, isFavorite, toggleFavorite } = useFavoriteCities();
const favoriteCount = computed(() => favoriteIds.value.length);

const addCity = async (location) => {
  isAddingCity.value = true;
  cityAddMessage.value = '';

  try {
    const newCity = await getWeatherByLocation(location);
    const existingCity = weatherList.value.find(
      (item) => String(item.detail?.id) === String(newCity.detail.id),
    );
    const targetCity = existingCity ?? newCity;

    if (!existingCity) {
      weatherList.value.push(newCity);
      saveCustomCity(newCity);

      const cacheInfo = saveWeatherListCache(weatherList.value);
      cacheExpiresAt.value = cacheInfo.expiresAt;
      currentTime.value = Date.now();
      weatherSource.value = 'network';
    }

    cityAddMessage.value = existingCity
      ? `${targetCity.name_kr ?? targetCity.name}은(는) 이미 목록에 있습니다.`
      : `${targetCity.name_kr ?? targetCity.name}을(를) 목록에 추가했습니다. 즐겨찾기는 카드의 별 버튼으로 설정할 수 있습니다.`;
  } catch (error) {
    console.error(error);
    cityAddMessage.value = '도시 날씨를 불러오지 못했습니다.';
  } finally {
    isAddingCity.value = false;
  }
};

watch(searchQuery, (query) => {
  const normalizedQuery = query.trim();
  const currentQuery = typeof route.query.q === 'string' ? route.query.q : '';

  if (normalizedQuery === currentQuery) return;

  router.replace({
    query: {
      ...route.query,
      q: normalizedQuery || undefined,
    },
  });
});

watch(
  () => route.query.q,
  (query) => {
    const normalizedQuery = typeof query === 'string' ? query : '';

    if (normalizedQuery !== searchQuery.value) {
      searchQuery.value = normalizedQuery;
    }
  },
);

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

const filteredWeatherList = computed(() => {
  const keywords = searchQuery.value
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean)

  let result = [...weatherList.value]

  if (keywords.length > 0) {
    result = result.filter((item) =>
      keywords.some(
        (keyword) =>
          item.name.toLowerCase().includes(keyword) ||
          item.name_kr.includes(keyword),
      ),
    )
  }

  if (favoriteOnly.value) {
    result = result.filter((item) => isFavorite(item.id))
  }

  if (sortKey.value !== 'default') {
    const multiplier = sortDirection.value === 'asc' ? 1 : -1

    result.sort((first, second) => {
      if (sortKey.value === 'name') {
        return (first.name_kr ?? first.name).localeCompare(
          second.name_kr ?? second.name,
          'ko',
        ) * multiplier
      }

      const values = {
        temp: [first.temp, second.temp],
        feels: [first.main.feels_like, second.main.feels_like],
        humidity: [first.main.humidity, second.main.humidity],
        wind: [first.wind?.speed ?? 0, second.wind?.speed ?? 0],
      }

      return (values[sortKey.value][0] - values[sortKey.value][1]) * multiplier
    })
  }

  return result
})


const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.');
// - selectedCityInfo 감시 (watch 이용): 상태바 문구가 바뀔때 마다 콘솔로그를 작성
watch(selectedCityInfo, (newValue, oldValue) => {
  console.log('[watch 감지] 상태 바 문구가 업데이트 되었습니다. ->', newValue)
})
const selectCity = (city) => {
  selectedCityInfo.value =
    `${city.name_kr ?? city.name}이(가) 선택되었습니다.`
}

const showDetail = (city) => {
  router.push({
    name: 'detail',
    params: {
      cityId: city.id,
    },
    state: {
      city: JSON.parse(JSON.stringify(city)),
    },
    query: route.query,
  })
}
</script>

<style scoped>
.container {
  display: grid;
  gap: 16px;
  margin: 20px auto 0;
}
.status-bar {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eef0f2;
  color: #9ca3af;
  font-size: 12px;
}
.empty-message{
  color: red;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.cache-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -4px 0 14px;
  padding: 9px 10px;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  background: #fafafa;
}

.cache-row p {
  margin: 0;
  color: #6b7280;
  font-size: 11px;
}

.city-add-message {
  margin: 8px 0 0;
  color: #4b5563;
  font-size: 12px;
}

.section-heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.section-heading h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.section-heading p {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
}

.filter-select {
  width: 132px;
  min-width: 132px;
  max-width: 132px;
  flex: 0 0 132px;
}

.sort-direction {
  width: 36px;
  height: 36px;
  font-size: 18px;
  line-height: 1;
}

.favorite-filter {
  min-height: 36px;
}

.favorite-filter span {
  margin-left: 3px;
  color: #94a3b8;
}

.api-status {
  margin: 3px 0 14px;
  font-size: 11px;
}

.api-status--loading {
  color: #4b5563;
}

.api-status--success {
  color: #6b7280;
}

.api-status--error {
  color: #b91c1c;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.weather-grid :deep(.weather-card) {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .cache-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
