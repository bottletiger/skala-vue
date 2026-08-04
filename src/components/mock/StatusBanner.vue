<script setup>
defineProps({
  type: {
    type: String,
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="status-note" :class="`status-note--${type}`" role="status">
    <span aria-hidden="true"></span>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.status-note {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 18px 0 0;
  padding: 11px 14px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, white 16%, transparent);
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 750;
}

.status-note > span {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--weather-accent);
}

.status-note--success > span {
  background: #3f6f5d;
}

.status-note--error > span {
  background: #a34f48;
}

.status-note p {
  margin: 0;
}
</style>
