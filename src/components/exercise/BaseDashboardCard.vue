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
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}
</style>
