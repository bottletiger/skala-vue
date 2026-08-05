<template>
    <div class="container">
      <BaseDashboardCard>
        <WeatherMap />
      </BaseDashboardCard>
      
      <BaseDashboardCard>
          <SearchBar 
              :cur-query="searchQuery" 
              @update-query="updateSearchQuery">
          </SearchBar>
      </BaseDashboardCard>

      <BaseDashboardCard>
        <h3>🏞️ 지역별 날씨 현황</h3>

        <p class="api-status" :class="`api-status--${apiStatus}`">
          <span v-if="apiStatus === 'loading'">{{ API_LOADING }}</span>
          <span v-else-if="apiStatus === 'success'">{{ API_SUCCESS }}</span>
          <span v-else>{{ API_FAIL }}</span>
        </p>
        
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
            :color="favoriteOnly ? 'warning' : 'neutral'"
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
import { ref, onMounted, computed, watch, watchEffect } from 'vue';
import BaseDashboardCard from './BaseDashboardCard.vue';
import SearchBar from './SearchBar.vue';
import WeatherCard from './weatherCard.vue';
import WeatherMap from './WeatherMap.vue';
import { getWeatherList } from '@/api/weatherApi';
import { useRoute, useRouter } from 'vue-router';
import { useFavoriteCities } from '@/composables/useFavoriteCities';


const route = useRoute();
const router = useRouter();
const initialQuery = typeof route.query.q === 'string' ? route.query.q : '';
const searchQuery = ref(initialQuery);
// - searchQuery 감시 (watchEffect 이용): 도시 검색어를 타이핑할 때 마다 변하는 searchQuery를 추적하여 콘솔로그로 작성
const updateSearchQuery = (query) => {
    searchQuery.value = query;
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

onMounted(async () => {
  try {
    weatherList.value = await getWeatherList();
    apiStatus.value = 'success';
  } catch (error) {
    console.error(error);
    apiStatus.value = 'error';
  }
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
  margin: 2rem auto 0;
}
.status-bar {
  padding: 10px;
  border-radius: 6px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: bold;
  text-align: center;
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
  margin: 8px 0 14px;
  font-size: 13px;
}

.api-status--loading {
  color: #4b5563;
}

.api-status--success {
  color: #047857;
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
  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
