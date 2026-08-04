<script setup>
import { nextTick, ref, watch } from 'vue'

import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import { getWeatherTheme } from '@/utils/weatherTheme'

const props = defineProps({
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

const WEATHER_RAIL_EDGE_THRESHOLD = 2
const isWeatherRailScrolled = ref(false)
const hasMoreWeatherBelow = ref(false)
const weatherRail = ref(null)

const updateWeatherRailEdgeState = (rail) => {
  if (!props.open || !rail) {
    isWeatherRailScrolled.value = false
    hasMoreWeatherBelow.value = false
    return
  }

  isWeatherRailScrolled.value = rail.scrollTop > 0
  hasMoreWeatherBelow.value = rail.scrollTop + rail.clientHeight < rail.scrollHeight - WEATHER_RAIL_EDGE_THRESHOLD
}

const handleWeatherRailScroll = (event) => {
  updateWeatherRailEdgeState(event.currentTarget)
}

const syncWeatherRailEdgeState = () => {
  updateWeatherRailEdgeState(weatherRail.value)
}

watch(
  [() => props.open, () => props.items, () => props.isLoading, () => props.errorMessage],
  () => {
    isWeatherRailScrolled.value = false
    hasMoreWeatherBelow.value = false
    if (props.open) void nextTick(syncWeatherRailEdgeState)
  },
  { immediate: true },
)
</script>

<template>
  <Transition name="world-drawer">
    <div v-if="open" class="world-drawer-layer">
      <button class="world-drawer-backdrop" type="button" aria-label="세계 날씨 서랍 닫기" @click="$emit('close')"></button>

      <section id="world-weather-drawer" class="world-weather-drawer" aria-label="세계 날씨" @keydown.esc="$emit('close')">
        <BaseDashboardCard class="world-weather-content" :aria-busy="isLoading">
          <div v-if="!isLoading && !errorMessage && items.length" class="world-weather-edge-fade world-weather-bottom-fade" :class="{ 'is-visible': hasMoreWeatherBelow }" aria-hidden="true"></div>
          <div id="world-weather-list" ref="weatherRail" class="world-weather-rail" @scroll.passive="handleWeatherRailScroll">
            <div class="world-drawer-toolbar" :class="{ 'is-scrolled': isWeatherRailScrolled }">
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
            </div>

            <div v-if="isLoading" class="drawer-state dashboard-surface dashboard-surface--state">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="errorMessage" class="drawer-state dashboard-surface dashboard-surface--state">
              <el-result :icon="apiReady ? 'error' : 'warning'" title="세계 날씨를 표시할 수 없습니다" :sub-title="errorMessage" />
            </div>
            <template v-else-if="items.length">
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
            </template>
            <div v-else class="drawer-state dashboard-surface dashboard-surface--state">
              <el-empty :description="emptyDescription" />
            </div>
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
  background: rgba(15, 27, 34, 0.1);
  cursor: default;
  pointer-events: auto;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.world-weather-drawer {
  position: absolute;
  display: flex;
  right: 0;
  bottom: var(--world-drawer-bottom);
  left: 0;
  width: var(--floating-nav-width);
  height: var(--world-drawer-height);
  flex-direction: column;
  margin: 0 auto;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-bottom: 0;
  border-radius: 27px 27px 0 0;
  outline: none;
  background: color-mix(in srgb, var(--hero-start) 18%, transparent);
  box-shadow:
    0 -10px 34px rgba(15, 27, 34, 0.12),
    inset 0 1px 0 color-mix(in srgb, white 20%, transparent);
  color: var(--hero-text);
  overflow: hidden;
  overscroll-behavior: contain;
  pointer-events: auto;
  scrollbar-width: none;
  backdrop-filter: blur(34px) saturate(125%);
  -webkit-backdrop-filter: blur(34px) saturate(125%);
}

.world-drawer-toolbar {
  position: sticky;
  z-index: 3;
  top: 0;
  padding: 18px 14px 16px;
  isolation: isolate;
}

.world-drawer-toolbar::before {
  position: absolute;
  z-index: -1;
  inset: 0 0 -24px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--hero-start) 16%, transparent) 0%, color-mix(in srgb, var(--hero-start) 10%, transparent) 68%, transparent 100%);
  content: '';
  opacity: 0.35;
  pointer-events: none;
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
  mask-image: linear-gradient(180deg, #000 0%, #000 66%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 66%, transparent 100%);
  transition: opacity 180ms ease;
}

.world-drawer-toolbar.is-scrolled::before {
  opacity: 1;
}

.world-search {
  width: 100%;
  margin: 0 auto;
}

.world-search :deep(.dashboard-surface--search) {
  --dashboard-surface-border: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
  --dashboard-surface-background: color-mix(in srgb, white 8%, transparent);
  --dashboard-surface-shadow: none;
  --dashboard-surface-color: var(--hero-text);
  --dashboard-surface-filter: blur(18px) saturate(108%);
}

.region-filters {
  width: 100%;
  margin: 10px auto 0;
  overflow-x: auto;
  overflow-y: hidden;
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
  border: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, white 6%, transparent);
  color: var(--hero-muted);
  cursor: pointer;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 800;
}

.region-filters button.is-active {
  border-color: color-mix(in srgb, var(--hero-text) 20%, transparent);
  background: color-mix(in srgb, var(--hero-text) 10%, transparent);
  color: var(--hero-text);
}

.partial-warning {
  margin: 8px 2px 0;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 750;
  text-align: center;
}

.world-weather-content {
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.world-weather-rail {
  display: grid;
  height: 100%;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-padding: 2px 0;
  scrollbar-width: none;
}

.world-weather-rail::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.world-weather-edge-fade {
  position: absolute;
  z-index: 2;
  right: 0;
  left: 0;
  height: 48px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
  transition:
    opacity 180ms ease,
    visibility 0s linear 180ms;
}

.world-weather-bottom-fade {
  bottom: 0;
  background: rgba(255, 255, 255, 0.01);
  mask-image: linear-gradient(0deg, #000 0%, rgba(0, 0, 0, 0.78) 52%, transparent 100%);
  -webkit-mask-image: linear-gradient(0deg, #000 0%, rgba(0, 0, 0, 0.78) 52%, transparent 100%);
}

.world-weather-edge-fade.is-visible {
  opacity: 1;
  visibility: visible;
  transition-delay: 0s;
}

.world-weather-rail :deep(.weather-card-hover-zone) {
  width: 100%;
}

.world-weather-rail :deep(.weather-card.dashboard-surface--weather) {
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition:
    background-color 180ms ease,
    border-color 180ms ease;
}

.world-weather-rail :deep(.weather-card-hover-zone:last-child .weather-card) {
  border-bottom-color: transparent;
}

.world-weather-rail :deep(.weather-card.is-selected) {
  border-bottom-color: color-mix(in srgb, var(--weather-accent, #73898e) 30%, transparent);
  background: color-mix(in srgb, var(--weather-accent, #73898e) 7%, transparent);
}

.world-weather-rail :deep(.weather-card:focus-within) {
  border-bottom-color: color-mix(in srgb, var(--weather-accent, #73898e) 42%, transparent);
  background: color-mix(in srgb, var(--hero-text) 6%, transparent);
  box-shadow: none;
}

.world-weather-rail :deep(.weather-card.is-promoting) {
  background: color-mix(in srgb, var(--weather-accent, #73898e) 9%, transparent);
  box-shadow: none;
}

.world-weather-rail :deep(.temperature-condition--hot) {
  color: #a64b2a;
}

.world-weather-rail :deep(.temperature-condition--cool) {
  color: #2b6f84;
}

.world-weather-rail :deep(.temperature-condition > svg),
.world-weather-rail :deep(.temperature-condition > span) {
  color: inherit;
}

@media (hover: hover) and (pointer: fine) {
  .world-weather-rail :deep(.weather-card-hover-zone:hover .weather-card:not(.is-promoting)) {
    border-bottom-color: color-mix(in srgb, var(--hero-text) 18%, transparent);
    background: color-mix(in srgb, var(--hero-text) 6%, transparent);
    box-shadow: none;
    transform: none;
  }

  .world-weather-rail :deep(.weather-card-hover-zone:hover .weather-card.is-selected:not(.is-promoting)) {
    border-bottom-color: color-mix(in srgb, var(--weather-accent, #73898e) 38%, transparent);
    background: color-mix(in srgb, var(--weather-accent, #73898e) 10%, transparent);
    box-shadow: none;
  }

  .world-weather-rail :deep(.weather-card-hover-zone:hover .weather-card:not(.is-promoting) .weather-mark) {
    transform: none;
  }
}

.drawer-state {
  min-height: 240px;
  padding: 22px;
}

.world-weather-content :deep(.dashboard-surface--state) {
  --dashboard-surface-border: 0;
  --dashboard-surface-background: transparent;
  --dashboard-surface-filter: none;
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
    padding: 0;
    border-radius: 26px 26px 0 0;
  }

  .world-drawer-toolbar {
    padding: 16px 12px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .world-drawer-enter-active,
  .world-drawer-leave-active,
  .world-drawer-enter-active .world-weather-drawer,
  .world-drawer-leave-active .world-weather-drawer {
    transition: none;
  }

  .world-weather-edge-fade {
    transition: none;
  }

  .world-drawer-toolbar::before {
    transition: none;
  }
}
</style>
