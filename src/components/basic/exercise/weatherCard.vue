<template>
    <div
        class="weather-card"
        :class="cityItem.temp >= hotTemperature ? 'card-hot':'card-cool'"
        @click="emit('select-card', cityItem)">

        <h3>{{ cityItem.name }} ({{ cityItem.status }})</h3>

        <p >🌡️ 현재 기온: 
          <span :style="{color: cityItem.temp >= hotTemperature ? 'red': 'blue' }">
            {{ cityItem.temp }}°C
          </span>
        </p>

        <p>👤 체감온도: 
          <span :style="{color: cityItem.main.feels_like >= hotTemperature ? 'red': 'blue' }">
              {{ Math.round(cityItem.main.feels_like)}}°C
          </span>
        </p>

        <p>💦 습도: {{ cityItem.main.humidity }}%</p>
        <span v-if="cityItem.temp >= hotTemperature" class="badge hot">🔥 더움 </span>
        <span v-else class="badge cool">❄️ 선선함</span>

        <button class="detail-button" @click.stop="emit('click-detail', cityItem)">
        상세보기
        </button>
    </div>
</template>

<script setup>
    defineProps({
        cityItem: {
            type: Object,
            required: true,
        },
        hotTemperature: {
            type:Number,
            required: true,
        }
    })

    const emit = defineEmits(['select-card','click-detail'])
</script>

<style scoped>
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

.weather-card h3 {
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
</style>