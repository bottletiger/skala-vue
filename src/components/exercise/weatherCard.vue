<template>
    <div class="weather-card"
        :class="cityItem.temp >= hotTemperature ? 'card-hot':'card-cool'"
        @click="emit('select-card', cityItem)">

        <div class="weather-content">
          <header class="card-heading">
            <div>
              <h3>{{ cityItem.name_kr ?? cityItem.name }} ({{ cityItem.status }})</h3>
              <p>{{ cityItem.name }}</p>
            </div>
            <UBadge
              :color="cityItem.temp >= hotTemperature ? 'error' : 'info'"
              variant="soft"
              size="sm">
              {{ cityItem.temp >= hotTemperature ? '🔥 더움' : '❄️ 선선함' }}
            </UBadge>
          </header>

          <div class="current-temperature">
            <span>🌡️ 현재 기온</span>
            <strong>{{ configStore.formatTemp(cityItem.temp) }}</strong>
          </div>

          <div class="card-metrics">
            <span>👤 체감온도 <strong>{{ configStore.formatTemp(cityItem.main.feels_like) }}</strong></span>
            <span>💦 습도 <strong>{{ cityItem.main.humidity }}%</strong></span>
          </div>
        </div>
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
  min-height: 176px;
  padding: 16px 126px 16px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.card-hot {
  background: linear-gradient(to bottom right, #fff 0%, #fff 62%, #fff7ed 100%);
}

.card-cool {
  background: linear-gradient(to bottom right, #fff 0%, #fff 62%, #eff6ff 100%);
}

.weather-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}
.weather-card:last-child {
  margin-bottom: 0;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-heading h3 {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.card-heading p {
  margin: 2px 0 0;
  color: #9ca3af;
  font-size: 11px;
}

.current-temperature {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 13px 0 10px;
}

.current-temperature span {
  color: #6b7280;
  font-size: 12px;
}

.current-temperature strong {
  color: #111827;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 1;
}

.card-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #9ca3af;
  font-size: 12px;
}

.card-metrics strong {
  margin-left: 3px;
  color: #4b5563;
  font-weight: 600;
}

.weather-icon {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 50%;
  background: #f8fafc;
}

.weather-side {
  position: absolute;
  top: 16px;
  right: 14px;
  display: flex;
  width: 100px;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.favorite-button {
  font-size: 17px;
  line-height: 1;
}

.detail-button {
  width: 100%;
  min-height: 30px;
  padding: 6px 10px;
  font-size: 12px;
  text-align: center;
  cursor: pointer;
}
</style>
