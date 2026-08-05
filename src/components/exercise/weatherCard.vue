<template>
    <div class="weather-card"
        :class="cityItem.temp >= hotTemperature ? 'card-hot':'card-cool'"
        @click="emit('select-card', cityItem)">

        <header class="card-heading">
          <div class="city-info">
            <h3>{{ cityItem.name_kr ?? cityItem.name }}</h3>
            <p>{{ citySubtitle }}</p>
          </div>
          <UButton
            type="button"
            :color="isFavorite ? 'warning' : 'neutral'"
            variant="ghost"
            size="sm"
            square
            class="favorite-button"
            :aria-pressed="isFavorite"
            :aria-label="isFavorite ? `${cityItem.name} 즐겨찾기 해제` : `${cityItem.name} 즐겨찾기 추가`"
            @click.stop="emit('toggle-favorite', cityItem.id)">
            {{ isFavorite ? '★' : '☆' }}
          </UButton>
        </header>

        <div class="weather-main">
          <div class="current-temperature">
            <strong>{{ configStore.formatTemp(cityItem.temp) }}</strong>
            <span>현재 기온</span>
          </div>

          <div class="weather-visual">
            <img
              v-if="cityItem.detail?.weather?.[0]?.icon"
              class="weather-icon"
              :src="weatherIcon"
              :alt="cityItem.detail.weather[0].description">
            <UBadge
              :color="cityItem.temp >= hotTemperature ? 'error' : 'info'"
              variant="soft"
              size="sm">
              {{ cityItem.temp >= hotTemperature ? '더움' : '선선함' }}
            </UBadge>
          </div>
        </div>

        <footer class="card-footer">
          <div class="card-metrics">
            <span>체감 <strong>{{ configStore.formatTemp(cityItem.main.feels_like) }}</strong></span>
            <span>습도 <strong>{{ cityItem.main.humidity }}%</strong></span>
          </div>

          <UButton
            type="button"
            color="neutral"
            variant="link"
            size="sm"
            class="detail-button"
            @click.stop="emit('click-detail', cityItem)">
            상세보기 →
          </UButton>
        </footer>
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
  const citySubtitle = computed(() => {
    const subtitle = []

    if (props.cityItem.name_kr && props.cityItem.name_kr !== props.cityItem.name) {
      subtitle.push(props.cityItem.name)
    }

    if (props.cityItem.status) {
      subtitle.push(props.cityItem.status)
    }

    return subtitle.join(' · ')
  })
</script>

<style scoped>

.weather-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  margin-bottom: 10px;
  min-height: 180px;
  padding: 16px;
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
  gap: 12px;
}

.card-heading h3 {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.card-heading p {
  margin: 3px 0 0;
  color: #9ca3af;
  font-size: 11px;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.current-temperature {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-temperature span {
  color: #9ca3af;
  font-size: 11px;
}

.current-temperature strong {
  color: #111827;
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 1;
}

.weather-visual {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 2px;
}

.weather-icon {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.72);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
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

.favorite-button {
  font-size: 17px;
  line-height: 1;
}

.detail-button {
  min-height: auto;
  padding: 0;
  font-size: 12px;
  white-space: nowrap;
}

@media (max-width: 380px) {
  .card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-button {
    align-self: flex-end;
  }
}
</style>
