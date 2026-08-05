<template>
  <section class="not-found" aria-labelledby="not-found-title">
    <div ref="questionMark" class="icon" aria-hidden="true" @pointerenter="isHovering = true" @pointerleave="isHovering = false">❓</div>
    <span class="error-code">404</span>
    <h2 id="not-found-title">페이지를 찾을 수 없습니다</h2>
    <p class="description">요청하신 페이지가 없거나 주소가 변경되었습니다.</p>
    <code class="requested-path">{{ route.fullPath }}</code>
    <UButton to="/" color="neutral">대시보드로 이동</UButton>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const questionMark = ref(null)
const isHovering = ref(false)

const BASE_SPEED = 180
const MAX_SPEED = 1080
const ROTATION_ACCELERATION = 720
const MAX_SCALE = 6
const SCALE_ACCELERATION = 1.4

let angle = 0
let rotationSpeed = BASE_SPEED
let scale = 1
let scaleSpeed = 0
let animationFrameId
let previousTime

const animateQuestionMark = (currentTime) => {
  if (!previousTime) previousTime = currentTime

  const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.05)
  previousTime = currentTime

  const targetSpeed = isHovering.value ? MAX_SPEED : BASE_SPEED
  const speedDirection = Math.sign(targetSpeed - rotationSpeed)
  rotationSpeed += speedDirection * ROTATION_ACCELERATION * deltaTime

  if ((speedDirection > 0 && rotationSpeed > targetSpeed) || (speedDirection < 0 && rotationSpeed < targetSpeed)) {
    rotationSpeed = targetSpeed
  }

  if (isHovering.value) {
    scaleSpeed += SCALE_ACCELERATION * deltaTime
  } else {
    scaleSpeed += (1 - scale) * 10 * deltaTime
    scaleSpeed *= Math.exp(-7 * deltaTime)
  }

  scale += scaleSpeed * deltaTime

  if (scale >= MAX_SCALE) {
    scale = MAX_SCALE
    scaleSpeed = 0
  } else if (!isHovering.value && scale <= 1) {
    scale = 1
    scaleSpeed = 0
  }

  angle = (angle + rotationSpeed * deltaTime) % 360

  if (questionMark.value) {
    questionMark.value.style.transform = `rotate(${angle}deg) scale(${scale})`
  }

  animationFrameId = requestAnimationFrame(animateQuestionMark)
}

onMounted(() => {
  animationFrameId = requestAnimationFrame(animateQuestionMark)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.not-found {
  margin: 40px auto 0;
  padding: 42px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  color: #475569;
  text-align: center;
}

.error-code {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.icon {
  width: fit-content;
  margin-right: auto;
  margin-bottom: 2px;
  margin-left: auto;
  font-size: 36px;
  cursor: help;
  transform-origin: center;
  will-change: transform;
}

h2 {
  margin: 12px 0 8px;
  color: #111827;
  font-size: 22px;
}

.description {
  margin: 0 0 14px;
  font-size: 14px;
}

.requested-path {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 24px;
  padding: 5px 10px;
  overflow-wrap: anywhere;
  border-radius: 4px;
  background: #f3f4f6;
  color: #64748b;
}
</style>
