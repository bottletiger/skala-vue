<template>
  <div class="base-dashboard-card">
    <slot />
  </div>
</template>

<style scoped>
.base-dashboard-card {
  position: relative;
  min-width: 0;
}

.base-dashboard-card :deep(.dashboard-surface) {
  border: var(--dashboard-surface-border, 0);
  border-radius: var(--dashboard-surface-radius, 0);
  background: var(--dashboard-surface-background, transparent);
  box-shadow: var(--dashboard-surface-shadow, none);
  color: var(--dashboard-surface-color, inherit);
  backdrop-filter: var(--dashboard-surface-filter, none);
}

.base-dashboard-card :deep(.dashboard-surface--search) {
  --dashboard-surface-border: 1px solid rgba(255, 255, 255, 0.46);
  --dashboard-surface-radius: 15px;
  --dashboard-surface-background: rgba(255, 255, 255, 0.24);
  --dashboard-surface-shadow: 0 10px 30px rgba(28, 42, 47, 0.06);
  --dashboard-surface-color: var(--hero-text, var(--ink));
  --dashboard-surface-filter: blur(18px) saturate(115%);
}

.base-dashboard-card :deep(.dashboard-surface--weather) {
  --dashboard-surface-border: 1px solid rgba(255, 255, 255, 0.22);
  --dashboard-surface-radius: 22px;
  --dashboard-surface-background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  --dashboard-surface-shadow: 0 8px 26px rgba(28, 43, 48, 0.045);
  --dashboard-surface-color: var(--hero-text, var(--ink));
  --dashboard-surface-filter: blur(14px) saturate(108%);
}

.base-dashboard-card :deep(.dashboard-surface--state) {
  --dashboard-surface-border: 1px solid rgba(255, 255, 255, 0.4);
  --dashboard-surface-radius: 24px;
  --dashboard-surface-background: rgba(255, 255, 255, 0.2);
  --dashboard-surface-filter: blur(20px);
}
</style>
