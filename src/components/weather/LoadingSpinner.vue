<template>
  <span class="loading-spinner" aria-hidden="true">
    <span class="loading-spinner-ring"></span>
  </span>
</template>

<style scoped>
.loading-spinner {
  display: inline-grid;
  width: var(--loading-spinner-size, 72px);
  height: var(--loading-spinner-size, 72px);
  place-items: center;
  color: var(--weather-accent, currentcolor);
}

.loading-spinner-ring {
  display: block;
  width: 100%;
  height: 100%;
  border: 4px solid color-mix(in srgb, currentcolor 18%, transparent);
  border-top-color: currentcolor;
  border-right-color: color-mix(in srgb, currentcolor 58%, transparent);
  border-radius: 50%;
  animation: loading-spin 820ms linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner-ring {
    animation: none;
    opacity: 0.72;
  }
}
</style>
