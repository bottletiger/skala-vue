<template>
    <div class="weather-card"
        :class="cityItem.temp >= hotTemperature ? 'card-hot':'card-cool'"
        @click="emit('select-card', cityItem)">

        <h3>{{ cityItem.name_kr }} ({{ cityItem.status }})</h3>

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
        <UBadge v-if="cityItem.temp >= hotTemperature" color="error" variant="soft">🔥 더움</UBadge>
        <UBadge v-else color="info" variant="soft">❄️ 선선함</UBadge>
        <div class="weather-side">
          <img
            v-if="cityItem.detail?.weather?.[0]?.icon"
            class="weather-icon"
            :src="weatherIcon"
            :alt="cityItem.detail.weather[0].description">
          <UButton
            type="button"
            :color="isFavorite ? 'warning' : 'neutral'"
            variant="outline"
            size="sm"
            square
            class="favorite-button"
            :aria-pressed="isFavorite"
            :aria-label="isFavorite ? `${cityItem.name} 즐겨찾기 해제` : `${cityItem.name} 즐겨찾기 추가`"
            @click.stop="emit('toggle-favorite', cityItem.id)">
            {{ isFavorite ? '★' : '☆' }}
          </UButton>
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="sm"
            block
            class="detail-button"
            @click.stop="emit('click-detail', cityItem)">
            상세보기
          </UButton>
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
  min-height: 174px;
  padding: 12px 132px 12px 12px;
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
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.weather-side {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  width: 100px;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.favorite-button {
  font-size: 19px;
  line-height: 1;
}

.detail-button {
  width: 100%;
  min-height: 30px;
  padding: 6px 10px;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
}
</style>
