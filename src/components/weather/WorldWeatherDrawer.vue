<script setup>
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import { getWeatherTheme } from '@/utils/weatherTheme'

defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  regions: {
    type: Array,
    required: true,
  },
  activeRegion: {
    type: String,
    required: true,
  },
  currentQuery: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  selectedCityId: {
    type: String,
    required: true,
  },
  promotingCityId: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    required: true,
  },
  apiReady: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  failedCityCount: {
    type: Number,
    default: 0,
  },
  emptyDescription: {
    type: String,
    required: true,
  },
})

defineEmits({
  close: null,
  'update-query': (value) => typeof value === 'string',
  'update-region': (value) => typeof value === 'string',
  'select-city': (city) => Boolean(city?.id),
  'open-detail': (cityId) => typeof cityId === 'string',
})
</script>

<template>
  <Transition name="world-drawer">
    <div v-if="open" class="world-drawer-layer">
      <button class="world-drawer-backdrop" type="button" aria-label="세계 날씨 서랍 닫기" @click="$emit('close')"></button>

      <section id="world-weather-drawer" class="world-weather-drawer" aria-labelledby="world-weather-title" @keydown.esc="$emit('close')">
        <header class="world-drawer-heading">
          <div>
            <p>WORLD WEATHER</p>
            <h2 id="world-weather-title">세계의 지금</h2>
          </div>
          <span>{{ items.length }}개 도시</span>
        </header>

        <BaseDashboardCard class="world-search">
          <SearchBar :current-query="currentQuery" @update-query="$emit('update-query', $event)" />
        </BaseDashboardCard>

        <div class="region-filters" role="group" aria-label="세계 지역 필터">
          <button
            v-for="region in regions"
            :key="region.id"
            type="button"
            :class="{ 'is-active': activeRegion === region.id }"
            :aria-pressed="activeRegion === region.id"
            @click="$emit('update-region', region.id)"
          >
            {{ region.label }}
          </button>
        </div>

        <p v-if="failedCityCount" class="partial-warning" role="status">{{ failedCityCount }}개 도시는 잠시 불러오지 못했습니다.</p>

        <BaseDashboardCard class="world-weather-content" :aria-busy="isLoading">
          <div v-if="isLoading" class="drawer-state dashboard-surface dashboard-surface--state">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="errorMessage" class="drawer-state dashboard-surface dashboard-surface--state">
            <el-result :icon="apiReady ? 'error' : 'warning'" title="세계 날씨를 표시할 수 없습니다" :sub-title="errorMessage" />
          </div>
          <div v-else-if="items.length" id="world-weather-list" class="world-weather-rail">
            <WeatherCard
              v-for="item in items"
              :key="item.id"
              :city-item="item"
              :selected="item.id === selectedCityId"
              :promoting="item.id === promotingCityId"
              :style="getWeatherTheme(item).cssVariables"
              @select-card="$emit('select-city', $event)"
              @click-detail="$emit('open-detail', $event)"
            />
          </div>
          <div v-else class="drawer-state dashboard-surface dashboard-surface--state">
            <el-empty :description="emptyDescription" />
          </div>
        </BaseDashboardCard>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
:global(html.world-drawer-open),
:global(html.world-drawer-open body) {
  overflow: hidden;
}

.world-drawer-layer {
  position: fixed;
  z-index: 42;
  inset: 0;
  pointer-events: none;
}

.world-drawer-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(24, 37, 42, 0.22);
  cursor: default;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.world-weather-drawer {
  position: absolute;
  right: 12px;
  bottom: var(--world-drawer-bottom);
  left: 12px;
  width: min(980px, calc(100% - 24px));
  height: var(--world-drawer-height);
  margin: 0 auto;
  padding: 34px 22px 22px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 30px;
  outline: none;
  background:
    radial-gradient(circle at 82% 0%, color-mix(in srgb, var(--weather-accent) 18%, transparent), transparent 36%),
    color-mix(in srgb, var(--hero-end) 74%, rgba(245, 248, 247, 0.9));
  box-shadow:
    0 -12px 50px rgba(23, 35, 45, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  color: var(--hero-text);
  overflow-y: auto;
  overscroll-behavior: contain;
  pointer-events: auto;
  scrollbar-width: thin;
}

.world-drawer-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.world-drawer-heading p {
  margin: 0 0 4px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.11em;
}

.world-drawer-heading h2 {
  margin: 0;
  font-size: clamp(28px, 5vw, 42px);
  line-height: 1.05;
  letter-spacing: -0.05em;
}

.world-drawer-heading > span {
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 800;
}

.world-search {
  width: min(390px, 100%);
  margin-top: 22px;
}

.region-filters {
  display: flex;
  gap: 6px;
  margin-top: 14px;
  padding-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.region-filters::-webkit-scrollbar {
  display: none;
}

.region-filters button {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 11%, transparent);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: var(--hero-muted);
  cursor: pointer;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 800;
}

.region-filters button.is-active {
  border-color: transparent;
  background: color-mix(in srgb, var(--hero-text) 82%, transparent);
  color: white;
}

.partial-warning {
  margin: 12px 2px 0;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
}

.world-weather-content {
  margin-top: 16px;
}

.world-weather-rail {
  display: flex;
  gap: 12px;
  padding: 2px 2px 12px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-padding: 2px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}

.world-weather-rail :deep(.weather-card-hover-zone) {
  width: clamp(250px, 30vw, 292px);
  flex: 0 0 auto;
  scroll-snap-align: start;
}

.drawer-state {
  min-height: 190px;
  padding: 22px;
}

.drawer-state :deep(.el-result__title p),
.drawer-state :deep(.el-result__subtitle p),
.drawer-state :deep(.el-empty__description p) {
  color: var(--hero-text);
}

.world-drawer-enter-active,
.world-drawer-leave-active {
  transition: opacity 340ms ease;
}

.world-drawer-enter-active .world-weather-drawer,
.world-drawer-leave-active .world-weather-drawer {
  transition: transform 440ms cubic-bezier(0.22, 1, 0.36, 1);
}

.world-drawer-enter-from,
.world-drawer-leave-to {
  opacity: 0;
}

.world-drawer-enter-from .world-weather-drawer,
.world-drawer-leave-to .world-weather-drawer {
  transform: translateY(calc(100% + 28px));
}

@media (max-width: 560px) {
  .world-weather-drawer {
    right: 9px;
    left: 9px;
    width: calc(100% - 18px);
    padding: 30px 16px 18px;
    border-radius: 26px;
  }

  .world-drawer-heading > span {
    display: none;
  }

  .world-weather-rail :deep(.weather-card-hover-zone) {
    width: min(82vw, 286px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .world-drawer-enter-active,
  .world-drawer-leave-active,
  .world-drawer-enter-active .world-weather-drawer,
  .world-drawer-leave-active .world-weather-drawer {
    transition: none;
  }
}
</style>
