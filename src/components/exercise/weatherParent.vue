<template>
    <div class="container">
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
            <select class="temperature-filter" v-model="temperatureFilter">
                <option value="all">전체 도시</option>
                <option value="hot">🔥 더운 도시 ({{HOT_TEMPERATURE}}도 이상)</option>
                <option value="cold">❄️ 시원한 도시 ({{HOT_TEMPERATURE}}도 미만)</option>
            </select>

            <WeatherCard
                v-for="item in filteredWeatherList"
                :key="item.id"
                :city-item="item"
                :hot-temperature="HOT_TEMPERATURE"
                @select-card="selectCity"
                @click-detail="showDetail">
            </WeatherCard>

            <p v-if="filteredWeatherList.length === 0">검색 결과와 일치하는 도시가 없습니다. </p>
            
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
import { getWeatherList } from '@/api/weatherApi';
import { RouterLink, useRouter } from 'vue-router';


const searchQuery = ref('');
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

const temperatureFilter = ref('all');
const filteredWeatherList = computed(() => {
  const keywords = searchQuery.value
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean)

  let result = weatherList.value

  if (temperatureFilter.value === 'hot') {
    result = result.filter(
      (item) => item.temp >= HOT_TEMPERATURE,
    )
  }

  if (temperatureFilter.value === 'cold') {
    result = result.filter(
      (item) => item.temp < HOT_TEMPERATURE,
    )
  }

  if (keywords.length > 0) {
    result = result.filter((item) =>
      keywords.some(
        (keyword) =>
          item.name.toLowerCase().includes(keyword) ||
          item.name_kr.includes(keyword),
      ),
    )
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

const router = useRouter();
const showDetail = (city) => {
  router.push({
    name: 'detail',
    params: {
      cityId: city.id,
    },
    state: {
      city: JSON.parse(JSON.stringify(city)),
    },
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
.temperature-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}

.temperature-filter select {
  padding: 7px 10px;
  border: 1px solid #adb5bd;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
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

</style>
