<script setup>
import { computed } from 'vue'

const props = defineProps({
  kind: {
    type: String,
    default: 'empty',
    validator: (value) => ['loading', 'error', 'empty'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  rows: {
    type: Number,
    default: 3,
  },
})

const safeRows = computed(() => Math.min(Math.max(Math.round(props.rows), 1), 5))
const role = computed(() => (props.kind === 'error' ? 'alert' : 'status'))
</script>

<template>
  <div class="async-state-panel" :class="`async-state-panel--${kind}`" :role="role" :aria-live="kind === 'error' ? 'assertive' : 'polite'">
    <template v-if="kind === 'loading'">
      <span class="sr-only">{{ message || '정보를 불러오고 있습니다.' }}</span>
      <div class="state-skeleton" aria-hidden="true">
        <span v-for="row in safeRows" :key="row" :style="{ '--skeleton-row': row }"></span>
      </div>
    </template>
    <template v-else>
      <strong v-if="title">{{ title }}</strong>
      <p>{{ message }}</p>
    </template>
  </div>
</template>

<style scoped>
.async-state-panel {
  display: grid;
  min-width: 0;
  align-content: center;
  gap: 5px;
  color: var(--hero-muted, #5b686d);
  text-align: center;
}

.async-state-panel strong {
  color: var(--hero-text, #233139);
  font-size: 14px;
  font-weight: 830;
}

.async-state-panel p {
  margin: 0;
  color: inherit;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.55;
  overflow-wrap: break-word;
  word-break: keep-all;
}

.state-skeleton {
  display: grid;
  width: min(100%, 420px);
  gap: 10px;
  justify-self: center;
}

.state-skeleton span {
  width: calc(100% - (var(--skeleton-row) - 1) * 11%);
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--hero-text, #233139) 7%, transparent),
    color-mix(in srgb, var(--hero-text, #233139) 15%, transparent),
    color-mix(in srgb, var(--hero-text, #233139) 7%, transparent)
  );
  background-size: 210% 100%;
  animation: state-shimmer 1.35s ease-in-out infinite;
}

.async-state-panel--error {
  color: color-mix(in srgb, #9b4d46 68%, var(--hero-text, #233139));
}

@keyframes state-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -110% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-skeleton span {
    animation: none;
  }
}
</style>
