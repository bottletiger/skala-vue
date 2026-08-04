<script setup>
defineProps({
  titleId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section class="forecast-list-section" :aria-labelledby="titleId">
    <header class="forecast-list-heading">
      <h3 :id="titleId">{{ title }}</h3>
      <span>{{ summary }}</span>
    </header>

    <div class="forecast-list-surface">
      <slot></slot>
    </div>
  </section>
</template>

<style scoped>
.forecast-list-section {
  min-width: 0;
}

.forecast-list-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 12px;
  padding: 0 4px;
}

.forecast-list-heading h3 {
  margin: 0;
  font-size: 18px;
}

.forecast-list-heading > span {
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 700;
}

.forecast-list-surface {
  overflow: hidden;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  background: transparent;
}

@media (max-width: 560px) {
  .forecast-list-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }
}
</style>
