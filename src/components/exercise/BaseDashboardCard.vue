<template>
  <div class="base-dashboard-card">
    <slot></slot>
  </div>
</template>

<script setup>

</script>

<style scoped>
.base-dashboard-card {
  padding: clamp(16px, 2.5vw, 22px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-soft);
}
</style>
