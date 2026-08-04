<template>
    <div class="practice-section">
        <h2>⚡ Axios 통신 검증</h2>
        <button @click="handleFetchWeather" :disabled="isLoading">
            {{ isLoading ? '데이터 로딩 중...' : '실시간 날씨 데이터 당겨오기' }}
        </button>
        <div v-if="weatherData" class="result-card">
            <p>📍 위치: <strong>{{ weatherData.name }}</strong></p>
            <p>🌡️ 현재 기온: <strong>{{ weatherData.main.temp }}°C</strong> (정상 섭씨 변환 완료)</p>
            <p>☁️ 날씨 상태: <strong>{{ weatherData.weather[0].description }}</strong></p>
            <p>💧 습도: <strong>{{ weatherData.main.humidity }}%</strong></p>
        </div>
            <div v-else>
        </div>

        <section class="weather-map-section">
            <div class="map-heading">
                <div>
                    <p>{{ activeLayer.label }} · {{ activeLayer.unit }}</p>
                </div>
                <code>{{ activeLayer.op }}</code>
            </div>

            <div class="category-tabs">
                <button
                    v-for="category in layerCategories"
                    :key="category.id"
                    type="button"
                    :class="{ active: selectedCategory === category.id }"
                    @click="selectCategory(category)">
                    {{ category.label }}
                </button>
            </div>

            <div class="layer-options">
                <button
                    v-for="layer in activeCategory.layers"
                    :key="layer.op"
                    type="button"
                    :class="{ active: selectedLayer === layer.op }"
                    @click="selectedLayer = layer.op">
                    <strong>{{ layer.label }}</strong>
                    <small>{{ layer.unit }}</small>
                </button>
            </div>

            <div class="weather-map">
                <div class="tile-layer">
                    <div
                        v-for="tile in mapTiles"
                        :key="`${tile.x}-${tile.y}`"
                        class="map-tile"
                        :style="{ left: `${tile.left}px`, top: `${tile.top}px` }">
                        <img
                            :src="`https://tile.openstreetmap.org/${MAP_ZOOM}/${tile.x}/${tile.y}.png`"
                            alt=""
                            class="base-tile">
                        <img
                            :key="`${selectedLayer}-${tile.x}-${tile.y}`"
                            :src="getWeatherTileUrl(tile)"
                            alt=""
                            class="weather-tile">
                    </div>
                </div>
                <span class="korea-marker">대한민국</span>
            </div>
            <div class="map-legend">
                <span>낮음</span>
                <span class="legend-color"></span>
                <span>높음</span>
            </div>
            <p class="map-attribution">
                © OpenStreetMap contributors · Weather data © OpenWeather
            </p>
        </section>
<iframe width="650" height="450" src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=36.287&lon=128.22" frameborder="0"></iframe>    </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import axios from 'axios';

const API_KEY = '8964edc63b366d27b5b728b7976570b7'
const MAP_ZOOM = 7
const TILE_SIZE = 256
const START_TILE_X = 108
const START_TILE_Y = 49

const layerCategories = [
    {
        id: 'precipitation',
        label: '🌧️ 강수',
        layers: [
            { op: 'precipitation_new', label: '강수량', unit: 'mm' },
        ],
    },
    {
        id: 'wind',
        label: '💨 바람',
        layers: [
            { op: 'wind_new', label: '풍속', unit: 'm/s' },
        ],
    },
    {
        id: 'temperature',
        label: '🌡️ 온도',
        layers: [
            { op: 'temp_new', label: '기온', unit: '°C' },
        ],
    },
    {
        id: 'atmosphere',
        label: '☁️ 대기',
        layers: [
            { op: 'pressure_new', label: '해면 기압', unit: 'hPa' },
            { op: 'clouds_new', label: '구름량', unit: '%' },
        ],
    },
]

const selectedCategory = ref('temperature')
const selectedLayer = ref('temp_new')

const activeCategory = computed(() =>
    layerCategories.find((category) => category.id === selectedCategory.value),
)

const activeLayer = computed(() =>
    activeCategory.value.layers.find((layer) => layer.op === selectedLayer.value),
)

const selectCategory = (category) => {
    selectedCategory.value = category.id
    selectedLayer.value = category.layers[0].op
}

const mapTiles = Array.from({ length: 12 }, (_, index) => {
    const column = index % 4
    const row = Math.floor(index / 4)

    return {
        x: START_TILE_X + column,
        y: START_TILE_Y + row,
        left: column * TILE_SIZE,
        top: row * TILE_SIZE,
    }
})

const getWeatherTileUrl = ({ x, y }) =>
    `https://tile.openweathermap.org/map/${selectedLayer.value}/${MAP_ZOOM}/${x}/${y}.png?appid=${API_KEY}`

const weatherData = ref(null);
const isLoading = ref(false);

const handleFetchWeather = async () => {
    isLoading.value = true;
    const URL = `https://api.openweathermap.org/data/2.5/weather?lat=35.158582&lon=126.804975&appid=${API_KEY}&units=metric&lang=kr`;

    try{
        const response = await axios.get(URL);

        weatherData.value = response.data;
    }catch(err){
        console.error(err);
        alert('FETCH ERROR');

    }finally{
        isLoading.value = false;
    }
}
</script>

<style scoped>
.weather-map-section {
    margin-top: 24px;
}

.map-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.map-heading h3,
.map-heading p {
    margin: 0;
}

.map-heading p {
    margin-top: 3px;
    color: #6b7280;
    font-size: 13px;
}

.map-heading code {
    padding: 4px 7px;
    border-radius: 4px;
    background: #f3f4f6;
}

.category-tabs,
.layer-options {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.category-tabs {
    margin-bottom: 9px;
}

.category-tabs button,
.layer-options button {
    border: 1px solid #d1d5db;
    border-radius: 5px;
    background: #fff;
    color: #4b5563;
    cursor: pointer;
}

.category-tabs button {
    padding: 7px 11px;
}

.layer-options {
    margin-bottom: 12px;
}

.layer-options button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
}

.layer-options small {
    color: #9ca3af;
}

.category-tabs button.active,
.layer-options button.active {
    border-color: #0284c7;
    background: #e0f2fe;
    color: #0369a1;
}

.weather-map {
    position: relative;
    height: 680px;
    overflow: hidden;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #dbeafe;
}

.tile-layer {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1024px;
    height: 768px;
    transform: translate(-364px, -340px);
}

.map-tile {
    position: absolute;
    width: 256px;
    height: 256px;
}

.map-tile img {
    position: absolute;
    inset: 0;
    display: block;
    width: 256px;
    height: 256px;
}

.weather-tile {
    opacity: 1;
}

.korea-marker {
    position: absolute;
    left: 50%;
    top: 50%;
    padding: 4px 7px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.9);
    color: #111827;
    font-size: 12px;
    font-weight: 700;
    transform: translate(-50%, -50%);
}

.map-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    margin-top: 8px;
    color: #6b7280;
    font-size: 12px;
}

.legend-color {
    width: 130px;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(90deg, #5b5bd6, #22d3ee, #fde047, #f97316, #dc2626);
}

.map-attribution {
    margin: 5px 0 0;
    color: #9ca3af;
    font-size: 10px;
    text-align: right;
}

</style>
