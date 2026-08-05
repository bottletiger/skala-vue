<script setup>
import { onBeforeUnmount, watch } from 'vue';
import WeatherParent from '@/components/exercise/weatherParent.vue';
import { useRoute, useRouter } from 'vue-router';
// import WeatherMockup from '../components/exercise/WeatherMockup.vue'

const route = useRoute();
const router = useRouter();
const originalBodyOverflow = document.body.style.overflow;
const originalHtmlOverflow = document.documentElement.style.overflow;
const originalBodyPaddingRight = document.body.style.paddingRight;

const restorePageScroll = () => {
  document.body.style.overflow = originalBodyOverflow;
  document.documentElement.style.overflow = originalHtmlOverflow;
  document.body.style.paddingRight = originalBodyPaddingRight;
};

watch(
  () => route.name === 'detail',
  (isModalOpen) => {
    if (!isModalOpen) {
      restorePageScroll();
      return;
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  },
  { immediate: true },
);

onBeforeUnmount(restorePageScroll);

const closeDetail = () => {
  router.push({ name: 'weather', query: route.query });
};
</script>

<template>
  <main class="assignment-page">
    <WeatherParent></WeatherParent>

    <RouterView name="modal" v-slot="{ Component }">
      <Transition name="weather-modal">
        <div
          v-if="Component"
          class="weather-modal-backdrop"
          @click.self="closeDetail">
          <div
            class="weather-modal-shell"
            role="dialog"
            aria-modal="true"
            aria-label="날씨 상세 정보">
            <component :is="Component" />
          </div>
        </div>
      </Transition>
    </RouterView>
  </main>
</template>

<style scoped>

.back-link {
  display: inline-block;
  margin-bottom: 3rem;
  color: #335c67;
  font-weight: 700;
}

.eyebrow {
  color: #c44536;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

h1 {
  margin: 0.5rem 0 1rem;
  color: #14213d;
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
}

.weather-modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(12px, 3vw, 28px);
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(3px);
}

.weather-modal-shell {
  width: min(640px, 100%);
  max-height: min(780px, 88vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
}

.weather-modal-enter-active,
.weather-modal-leave-active {
  transition: opacity 0.18s ease;
}

.weather-modal-enter-from,
.weather-modal-leave-to {
  opacity: 0;
}

@media (max-width: 560px) {
  .weather-modal-backdrop {
    padding: 10px;
  }

  .weather-modal-shell {
    max-height: 94vh;
    border-radius: 14px;
  }
}
</style>
