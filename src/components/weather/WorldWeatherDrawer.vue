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

const getWeatherCardStyle = (item) => ({
  '--weather-accent': getWeatherTheme(item).cssVariables['--weather-accent'],
})
</script>

<template>
  <Transition name="world-drawer">
    <div v-if="open" class="world-drawer-layer">
      <button class="world-drawer-backdrop" type="button" aria-label="세계 날씨 서랍 닫기" @click="$emit('close')"></button>

      <section id="world-weather-drawer" class="world-weather-drawer" aria-label="세계 날씨" @keydown.esc="$emit('close')">
        <BaseDashboardCard class="world-search">
          <SearchBar :current-query="currentQuery" @update-query="$emit('update-query', $event)" />
        </BaseDashboardCard>

        <div class="region-filters" role="group" aria-label="세계 지역 필터">
          <div class="region-filter-track">
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
              :style="getWeatherCardStyle(item)"
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
  --hero-text: #213238;
  --hero-muted: #53646a;

  position: absolute;
  right: 0;
  bottom: var(--world-drawer-bottom);
  left: 0;
  width: var(--floating-nav-width);
  height: var(--world-drawer-height);
  margin: 0 auto;
  padding: 18px 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 27px;
  outline: none;
  background:
    radial-gradient(circle at 82% 0%, color-mix(in srgb, var(--weather-accent) 8%, transparent), transparent 38%), linear-gradient(145deg, rgba(248, 251, 250, 0.97), rgba(229, 237, 235, 0.97));
  box-shadow:
    0 -12px 50px rgba(23, 35, 45, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  color: #213238;
  overflow-y: auto;
  overscroll-behavior: contain;
  pointer-events: auto;
  scrollbar-width: thin;
}

.world-search {
  width: calc(100% - 4px);
  margin: 0 auto;
}

.region-filters {
  width: 100%;
  margin: 10px auto 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.region-filter-track {
  display: flex;
  width: max-content;
  min-width: 100%;
  justify-content: center;
  gap: 6px;
}

.region-filters::-webkit-scrollbar {
  display: none;
}

.region-filters button {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid rgba(33, 50, 56, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  color: #53646a;
  cursor: pointer;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 800;
}

.region-filters button.is-active {
  border-color: transparent;
  background: #2b3d43;
  color: white;
}

.partial-warning {
  margin: 8px 2px 0;
  color: #53646a;
  font-size: 11px;
  font-weight: 750;
  text-align: center;
}

.world-weather-content {
  margin-top: 10px;
}

.world-weather-rail {
  display: flex;
  gap: 12px;
  padding: 2px 2px 0;
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
    padding: 16px 12px 10px;
    border-radius: 26px;
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
