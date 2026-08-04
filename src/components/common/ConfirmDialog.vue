<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useSharedWeatherTheme } from '@/composables/useSharedWeatherTheme'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  confirmLabel: {
    type: String,
    default: '확인',
  },
  cancelLabel: {
    type: String,
    default: '취소',
  },
  busy: {
    type: Boolean,
    default: false,
  },
  danger: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['cancel', 'confirm'])
const { weatherTheme } = useSharedWeatherTheme()
const dialog = ref(null)
const cancelButton = ref(null)

let previouslyFocusedElement = null

function requestCancel() {
  if (!props.busy) emit('cancel')
}

function handleDialogKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    requestCancel()
    return
  }

  if (event.key !== 'Tab') return

  const focusableElements = [...dialog.value.querySelectorAll('button:not(:disabled)')]
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocusedElement = document.activeElement
      await nextTick()
      cancelButton.value?.focus()
      return
    }

    previouslyFocusedElement?.focus?.()
    previouslyFocusedElement = null
  },
)

onBeforeUnmount(() => {
  previouslyFocusedElement?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-dialog">
      <div v-if="open" class="confirm-overlay" :style="weatherTheme.cssVariables" :data-theme="weatherTheme.name" @mousedown.self="requestCancel">
        <section
          ref="dialog"
          class="confirm-panel"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
          tabindex="-1"
          @keydown="handleDialogKeydown"
        >
          <div class="confirm-symbol" :class="{ 'confirm-symbol--danger': danger }" aria-hidden="true">
            <span></span>
          </div>

          <p class="confirm-eyebrow">CONFIRM ACTION</p>
          <h2 id="confirm-dialog-title">{{ title }}</h2>
          <p id="confirm-dialog-description" class="confirm-description">{{ message }}</p>

          <div class="confirm-actions">
            <button ref="cancelButton" type="button" :disabled="busy" @click="requestCancel">
              {{ cancelLabel }}
            </button>
            <button class="confirm-button" :class="{ 'confirm-button--danger': danger }" type="button" :disabled="busy" @click="emit('confirm')">
              <span v-if="busy" class="confirm-spinner" aria-hidden="true"></span>
              {{ busy ? '처리 중' : confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  z-index: 200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: color-mix(in srgb, var(--hero-text) 24%, transparent);
  color: var(--hero-text);
  backdrop-filter: blur(9px) saturate(104%);
  -webkit-backdrop-filter: blur(9px) saturate(104%);
}

.confirm-panel {
  width: min(430px, 100%);
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 24px;
  outline: none;
  background:
    radial-gradient(circle at 84% 8%, color-mix(in srgb, var(--weather-accent) 18%, transparent), transparent 34%),
    linear-gradient(145deg, color-mix(in srgb, var(--hero-end) 86%, white), color-mix(in srgb, var(--hero-start) 78%, white));
  box-shadow:
    0 28px 80px rgba(20, 32, 36, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.54);
}

.confirm-symbol {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  margin-bottom: 24px;
  border: 1px solid color-mix(in srgb, var(--weather-accent) 32%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--weather-accent) 9%, transparent);
}

.confirm-symbol span {
  position: relative;
  width: 14px;
  height: 14px;
}

.confirm-symbol span::before,
.confirm-symbol span::after {
  position: absolute;
  top: 6px;
  left: 1px;
  width: 12px;
  height: 1.5px;
  border-radius: 999px;
  background: var(--weather-accent);
  content: '';
}

.confirm-symbol span::before {
  transform: rotate(45deg);
}

.confirm-symbol span::after {
  transform: rotate(-45deg);
}

.confirm-symbol--danger {
  border-color: rgba(138, 81, 76, 0.28);
  background: rgba(138, 81, 76, 0.08);
}

.confirm-symbol--danger span::before,
.confirm-symbol--danger span::after {
  background: #7d4843;
}

.confirm-eyebrow {
  margin: 0 0 6px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.confirm-panel h2 {
  margin: 0;
  font-size: clamp(24px, 5vw, 31px);
  line-height: 1.16;
  letter-spacing: -0.045em;
}

.confirm-description {
  margin: 12px 0 0;
  color: var(--hero-muted);
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.confirm-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 26px;
}

.confirm-actions button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 13px;
  background: color-mix(in srgb, white 20%, transparent);
  color: var(--hero-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 820;
}

.confirm-actions button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.confirm-actions .confirm-button {
  border-color: transparent;
  background: color-mix(in srgb, var(--hero-text) 80%, transparent);
  color: white;
}

.confirm-actions .confirm-button--danger {
  background: color-mix(in srgb, #7d4843 82%, var(--hero-text));
}

.confirm-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.32);
  border-top-color: white;
  border-radius: 50%;
  animation: confirm-spin 720ms linear infinite;
}

@keyframes confirm-spin {
  to {
    transform: rotate(1turn);
  }
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 180ms ease;
}

.confirm-dialog-enter-active .confirm-panel,
.confirm-dialog-leave-active .confirm-panel {
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}

.confirm-dialog-enter-from .confirm-panel,
.confirm-dialog-leave-to .confirm-panel {
  transform: translateY(12px) scale(0.975);
}

@media (max-width: 480px) {
  .confirm-overlay {
    align-items: end;
    padding: 14px 14px calc(82px + env(safe-area-inset-bottom));
  }

  .confirm-panel {
    padding: 22px;
    border-radius: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confirm-spinner {
    animation: none;
  }

  .confirm-dialog-enter-active,
  .confirm-dialog-leave-active,
  .confirm-dialog-enter-active .confirm-panel,
  .confirm-dialog-leave-active .confirm-panel {
    transition: none;
  }
}
</style>
