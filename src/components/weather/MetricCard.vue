<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
    validator: (value) => value.trim().length > 0,
  },
  value: {
    type: [String, Number],
    default: null,
    validator: (value) => {
      if (value === null || value === undefined) return true
      if (typeof value === 'number') return Number.isFinite(value)
      return typeof value === 'string'
    },
  },
  unit: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
})

const isMissing = computed(() => {
  if (props.value === null || props.value === undefined) return true
  if (typeof props.value === 'number') return !Number.isFinite(props.value)
  return props.value.trim().length === 0
})

const displayValue = computed(() => (isMissing.value ? '정보 없음' : String(props.value)))
const showUnit = computed(() => !isMissing.value && props.unit.trim().length > 0)
</script>

<template>
  <div class="metric-card-hover-zone">
    <article class="metric-card">
      <div class="metric-heading">
        <p>{{ label }}</p>
        <span v-if="$slots.icon" class="metric-icon" aria-hidden="true">
          <slot name="icon" />
        </span>
      </div>

      <div class="metric-reading" :class="{ missing: isMissing }">
        <strong>{{ displayValue }}</strong>
        <span v-if="showUnit">{{ unit }}</span>
      </div>

      <p v-if="description" class="metric-description">{{ description }}</p>
    </article>
  </div>
</template>

<style scoped>
.metric-card-hover-zone {
  min-width: 0;
  min-height: 142px;
}

.metric-card {
  position: relative;
  min-width: 0;
  min-height: 142px;
  height: 100%;
  padding: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  color: var(--hero-text, var(--ink));
  backdrop-filter: blur(14px) saturate(108%);
  transition:
    transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 300ms ease,
    border-color 180ms ease;
}

.metric-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.metric-heading p {
  margin: 0;
  color: var(--hero-muted, var(--muted));
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.metric-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--weather-accent, var(--accent));
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.metric-icon :deep(svg) {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.metric-reading {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 6px;
  margin-top: 22px;
  color: var(--hero-text, var(--ink));
}

.metric-reading strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: clamp(27px, 3.2vw, 38px);
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.metric-reading span {
  flex: 0 0 auto;
  color: var(--weather-accent, var(--accent));
  font-size: 14px;
  font-weight: 800;
}

.metric-reading.missing strong {
  color: var(--hero-muted, var(--muted));
  font-size: 19px;
  letter-spacing: -0.02em;
}

.metric-description {
  margin: 10px 0 0;
  color: var(--hero-muted, var(--muted));
  font-size: 12px;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .metric-card-hover-zone:hover .metric-card {
    border-color: rgba(255, 255, 255, 0.46);
    box-shadow: 0 16px 36px rgba(28, 43, 48, 0.1);
    transform: translateY(-4px) scale(1.006);
  }

  .metric-card-hover-zone:hover .metric-icon {
    transform: translateY(-2px) scale(1.04);
  }
}

@media (max-width: 390px) {
  .metric-card-hover-zone {
    min-height: 136px;
  }

  .metric-card {
    min-height: 136px;
    padding: 18px;
  }

  .metric-reading {
    margin-top: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .metric-card,
  .metric-icon {
    transition: none;
  }

  .metric-card-hover-zone:hover .metric-card,
  .metric-card-hover-zone:hover .metric-icon {
    transform: none;
  }
}
</style>
