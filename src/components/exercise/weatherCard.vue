<template>
    <div class="weather-card"
        :class="cityItem.temp >= hotTemperature ? 'card-hot':'card-cool'"
        @click="emit('select-card', cityItem)">

        <h3>{{ cityItem.name }} ({{ cityItem.status }})</h3>

        <p >🌡️ 현재 기온: 
          <span :style="{color: cityItem.temp >= hotTemperature ? 'red': 'blue' }">
            {{ configStore.formatTemp(cityItem.temp) }}
          </span>
        </p>

        <p>👤 체감온도: 
          <span :style="{color: cityItem.main.feels_like >= hotTemperature ? 'red': 'blue' }">
              {{ configStore.formatTemp(Math.round(cityItem.main.feels_like))}}
          </span>
        </p>

        <p>💦 습도: {{ cityItem.main.humidity }}%</p>
        <span v-if="cityItem.temp >= hotTemperature" class="badge hot">🔥 더움 </span>
        <span v-else class="badge cool">❄️ 선선함</span>
        <div class="weather-side">
          <img
            v-if="cityItem.detail?.weather?.[0]?.icon"
            class="weather-icon"
            :src="weatherIcon"
            :alt="cityItem.detail.weather[0].description">
          <button
            type="button"
            class="favorite-button"
            :class="{ active: isFavorite }"
            :aria-pressed="isFavorite"
            :aria-label="isFavorite ? `${cityItem.name} 즐겨찾기 해제` : `${cityItem.name} 즐겨찾기 추가`"
            @click.stop="emit('toggle-favorite', cityItem.id)">
            <StarFilled v-if="isFavorite" aria-hidden="true" />
            <Star v-else aria-hidden="true" />
          </button>
          <button
            type="button"
            class="detail-button"
            @click.stop="emit('click-detail', cityItem)">
            <View aria-hidden="true" />
            상세보기
          </button>
        </div>
    </div>
</template>

<script setup>
  import { useConfigStore } from '@/stores/configStore';
  import { computed } from 'vue';
  const props = defineProps({
      cityItem: {
          type: Object,
          required: true,
      },
      hotTemperature: {
          type:Number,
          required: true,
      },
      isFavorite: {
          type: Boolean,
          default: false,
      }
  })
  const emit = defineEmits(['select-card', 'toggle-favorite', 'click-detail'])
  const configStore = useConfigStore();
  const weatherIcon = computed(() =>
    `https://openweathermap.org/img/wn/${props.cityItem.detail?.weather?.[0]?.icon}@2x.png`,
  )
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
  background: linear-gradient(
    to right,
    #fff7ed 0%,
    #fffaf5 55%,
    #ffffff 100%
  );
  border-color: #fed7aa;
}

.card-cool {
  background: linear-gradient(
    to right,
    #eff6ff 0%,
    #f7fbff 55%,
    #ffffff 100%
  );
  border-color: #bfdbfe;
}

.card-hot:hover {
  background: linear-gradient(
    to right,
    #ffedd5 0%,
    #fff7ed 55%,
    #ffffff 100%
  );
}

.card-cool:hover {
  background: linear-gradient(
    to right,
    #dbeafe 0%,
    #eff6ff 55%,
    #ffffff 100%
  );
}
.weather-card:last-child {
  margin-bottom: 0;
}

.weather-card h3 {
  margin: 0;
  font-weight: 700;
}

.weather-icon {
  width: 90px;
}

.weather-side {
  position: absolute;
  top: 15px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.favorite-button {
  display: inline-flex;
  width: 30px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #d7dde5;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.85);
  color: #94a3b8;
  font-size: 19px;
  line-height: 1;
}

.favorite-button:hover,
.favorite-button.active {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #d97706;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  text-align: center;
  cursor: pointer;
}
</style>
