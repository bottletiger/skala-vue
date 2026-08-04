<template>
  <section
    ref="playgroundRef"
    class="run-playground"
    @pointermove="handlePointerMove">
    <p class="hint">버튼을 클릭해 보세요</p>
    <button
      ref="buttonRef"
      type="button"
      class="troll-btn"
      :style="buttonStyle">
      클릭해봐
    </button>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const DANGER_ZONE = 120
const PUSH_POWER = 1.5
const SAFE_MARGIN = 20

const playgroundRef = ref(null)
const buttonRef = ref(null)
const buttonX = ref(0)
const buttonY = ref(0)

const buttonStyle = computed(() => ({
  left: `${buttonX.value}px`,
  top: `${buttonY.value}px`,
}))

const keepButtonInside = () => {
  const playground = playgroundRef.value
  const button = buttonRef.value

  if (!playground || !button) return

  const maxX = playground.clientWidth - button.offsetWidth - SAFE_MARGIN
  const maxY = playground.clientHeight - button.offsetHeight - SAFE_MARGIN

  buttonX.value = Math.max(SAFE_MARGIN, Math.min(maxX, buttonX.value))
  buttonY.value = Math.max(SAFE_MARGIN, Math.min(maxY, buttonY.value))
}

const placeButtonInCenter = () => {
  const playground = playgroundRef.value
  const button = buttonRef.value

  if (!playground || !button) return

  buttonX.value = (playground.clientWidth - button.offsetWidth) / 2
  buttonY.value = (playground.clientHeight - button.offsetHeight) / 2
}

const handlePointerMove = (event) => {
  const playground = playgroundRef.value
  const button = buttonRef.value

  if (!playground || !button) return

  const playgroundRect = playground.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  const pointerX = event.clientX - playgroundRect.left
  const pointerY = event.clientY - playgroundRect.top
  const buttonCenterX = buttonRect.left - playgroundRect.left + buttonRect.width / 2
  const buttonCenterY = buttonRect.top - playgroundRect.top + buttonRect.height / 2
  const distanceX = pointerX - buttonCenterX
  const distanceY = pointerY - buttonCenterY
  const distance = Math.hypot(distanceX, distanceY)

  if (distance >= DANGER_ZONE) return

  const angle = Math.atan2(distanceY, distanceX)
  const pushDistance = (DANGER_ZONE - distance) * PUSH_POWER

  buttonX.value -= Math.cos(angle) * pushDistance
  buttonY.value -= Math.sin(angle) * pushDistance

  keepButtonInside()
}

let resizeObserver

onMounted(async () => {
  await nextTick()
  placeButtonInCenter()

  resizeObserver = new ResizeObserver(keepButtonInside)
  resizeObserver.observe(playgroundRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.run-playground {
  position: relative;
  height: min(70vh, 650px);
  min-height: 420px;
  overflow: hidden;
  border-radius: 10px;
  background: #1a1a1a;
}

.hint {
  margin: 0;
  padding-top: 22px;
  color: #9ca3af;
  text-align: center;
}

.troll-btn {
  position: absolute;
  padding: 15px 35px;
  border: 2px solid #00ffcc;
  border-radius: 30px;
  background: transparent;
  box-shadow: 0 0 15px rgba(0, 255, 204, 0.3);
  color: #00ffcc;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition:
    left 0.1s cubic-bezier(0.25, 0.8, 0.25, 1),
    top 0.1s cubic-bezier(0.25, 0.8, 0.25, 1);
}
</style>
