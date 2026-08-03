<script setup>
import { getWeatherList } from '@/api/weatherApi';
import { cs } from 'element-plus/es/locales.mjs';
import { computed, onMounted, ref, watch, watchEffect } from 'vue';

// const degree = () =>{
//  return (Math.round(Math.random()*100)) % 40;
// }
const weatherList = ref([]);
const apiStatus = ref('loading');
const ApiLoading = 'OpenWeather API 데이터 불러오는 중...';
const ApiSuccess = 'OpenWeather API 데이터 로드 성공';
const ApiFail = 'OpenWeather API 데이터 로드 실패';

onMounted(async () => {
  try {
    weatherList.value = await getWeatherList();
    apiStatus.value = 'success';
  } catch (error) {
    console.error(ApiFail, error);
    apiStatus.value = 'error';
  }
})

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`);
}

const searchQuery = ref('');
// - searchQuery 감시 (watchEffect 이용): 도시 검색어를 타이핑할 때 마다 변하는 searchQuery를 추적하여 콘솔로그로 작성
watchEffect(() => {
  console.log('[도시 검색어]', searchQuery.value)
})

const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.');
// - selectedCityInfo 감시 (watch 이용): 상태바 문구가 바뀔때 마다 콘솔로그를 작성
watch(selectedCityInfo, (newValue, oldValue) => {
  console.log('[watch 감지] 상태 바 문구가 업데이트 되었습니다. ->', newValue)
})

const temperatureFilter = ref('all');

const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()

  if(!keyword){
    return weatherList.value; 
  }
  // if (temperatureFilter.value === 'hot') {
  //   return weatherList.value.filter((item) => item.temp >= 28);
  // }

  // if (temperatureFilter.value === 'cold') {
  //   return weatherList.value.filter((item) => item.temp < 28);
  // }
  return weatherList.value.filter((item) =>
    item.name.toLowerCase().includes(keyword),
  )
})

</script>

<template>
  <div class="container">
    <h1 class="title">과제 1: 날씨 (Mockup)</h1>
    <hr style="border: 0; border-top: 1px solid lightgray;"> <br>
    <div class="search">
      <h3>🔍 도시 검색</h3>
      <!-- <input type="text" v-model="searchQuery" placeholder="검색할 도시 이름 입력" /> -->
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <p>
        검색 중인 도시: {{ searchQuery }}
      </p>
    </div>

    <div class="region-list">
      <h3>🏞️ 지역별 날씨 현황</h3>
      <p class="api-status" :class="`api-status--${apiStatus}`" aria-live="polite">
        <span v-if="apiStatus === 'loading'">{{ ApiLoading }}</span>
        <span v-else-if="apiStatus === 'success'">{{ ApiSuccess }}</span>
        <span v-else>{{ ApiFail }}</span>
      </p>

      <label class="temperature-filter">
        온도 필터
        <select v-model="temperatureFilter">
          <option value="all">전체 도시</option>
          <option value="hot">🔥 더운 도시 (28도 이상)</option>
          <option value="cold">❄️ 시원한 도시 (28도 미만)</option>
        </select>
      </label>

      <div v-for="item in filteredWeatherList" 
        :key="item.id" 
        class="weather-card" 
        :class="item.temp >= 28 ? 'card-hot' : 'card-cool'"
        @click="selectedCityInfo = `${item.name}이(가) 선택되었습니다.`">

        <h4>{{ item.name }} ({{ item.status }})</h4>

        <p >🌡️ 현재 기온: 
          <span :style="{color: item.temp >= 28 ? 'red': 'blue' }">
            {{ item.temp }}°C
          </span>
        </p>

        <p>👤 체감온도: {{ item.main.feels_like }}</p>
        <p>💦 습도: {{ item.main.humidity }}%</p>
        <span v-if="item.temp >= 28" class="badge hot">🔥 더움 </span>
        <span v-else class="badge cool">❄️ 선선함</span>

        <button class="detail-button" @click.stop="showDetail(item.name, item.status)">상세보기</button>
      </div>
      <p v-if="apiStatus === 'success' && searchQuery.trim() && filteredWeatherList.length === 0"
        class="empty-message">
        검색 결과와 일치하는 도시가 없습니다.
      </p>
    </div>

    <div class="status-bar" v-text="selectedCityInfo"></div>
  </div>
</template>

<style scoped>
.container {
  width: min(100%, 600px);
  margin: 2rem auto 0;
}

.search,
.region-list {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}



input {
  width: 100%;
  padding: 8px;
  border: 1px solid #adb5bd;
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

.search-box p {
  margin-top: 0.5rem;
}

.weather-card {
  position: relative;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.card-hot {
  background-color: #fff7ed;
  border-color: #fed7aa;
}

.card-cool {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.card-hot:hover {
  background-color: #ffedd5;
}

.card-cool:hover {
  background-color: #dbeafe;
}

.weather-card:last-child {
  margin-bottom: 0;
}

.weather-card h4 {
  font-weight: 700;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
}

.hot {
  background-color: #ff7675;
}

.cool {
  background-color: #2787c5;
}

.detail-button {
  position: absolute;
  top: 15px;
  right: 12px;
  padding: 6px 10px;
  text-align: center;
  cursor: pointer;
}

.status-bar {
  padding: 10px;
  border-radius: 6px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: bold;
  text-align: center;
}
</style>
