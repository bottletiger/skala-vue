<script setup>
import { ref } from 'vue'

const degree = () =>{
 return (Math.round(Math.random()*100)) % 40;
}
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: degree(), status: '맑음' },
  { id: 'city_02', name: '수원', temp: degree(), status: '비' },
  { id: 'city_03', name: '부산', temp: degree(), status: '구름' },
  { id: 'city_04', name: '전주', temp: degree(), status: '소나기' },
  { id: 'city_05', name: '대전', temp: degree(), status: '소나기' },
  { id: 'city_04', name: '대구', temp: degree(), status: '소나기' },
  { id: 'city_04', name: '울산', temp: degree(), status: '소나기' },
  { id: 'city_04', name: '광주', temp: degree(), status: '소나기' }
])

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

</script>

<template>
  <div class="container">
    <h1 class="title">과제 1: 날씨 (Mockup)</h1>
    <hr style="border: 0; border-top: 1px solid lightgray;"> <br>
    <section class="search">
      <h3>🔍 도시 검색</h3>
      <!-- <input type="text" v-model="searchQuery" placeholder="검색할 도시 이름 입력" /> -->
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <p>
        검색 중인 도시: {{ searchQuery }}
      </p>
    </section>

    <section class="list">
      <h3>🏞️ 지역별 날씨 현황</h3>

      <div v-for="item in weatherList" :key="item.id" class="weather-card" @click="selectedCityInfo = `${item.name}이(가) 선택되었습니다.`">
        <h4>{{ item.name }} ({{ item.status }})</h4>
        <p>현재 기온: 
          <span :style="{color: item.temp >= 25 ? 'red': 'blue' }">
            {{ item.temp }}°C
          </span>
        </p>

        <span v-if="item.temp >= 25" class="badge hot">🔥 더움 </span>
        <span v-else class="badge cool">❄️ 선선함</span>

        <button class="detail-button" @click.stop="showDetail(item.name, item.status)">상세보기</button>
      </div>
    </section>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
  </div>
</template>

<style scoped>
.container {
  width: min(100%, 600px);
  margin: 2rem auto 0;
}

.search,
.list {
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
.weather-card:hover{
  background-color: #dfdfdf;
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
