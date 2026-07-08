<template>
  <div class="layout-container">
    <header class="layout-header">
      <slot name="header"></slot>
    </header>

    <main class="layout-body">
      <slot></slot>
    </main>
  </div>
</template>
