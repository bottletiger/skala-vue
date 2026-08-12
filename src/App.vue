<script setup>
// 1. Reactive State
import ReactiveRef from './components/practices/composition/ReactiveRef.vue'
import ReactiveReactive from './components/practices/composition/ReactiveReactive.vue'
// 2. Computed & Watchers
import ComputedBasic from './components/practices/composition/ComputedBasic.vue'
import WatchersBasic from './components/practices/composition/WatchersBasic.vue'
import WatchersMulti from './components/practices/composition/WatchersMulti.vue'
import WatchersDeep from './components/practices/composition/WatchersDeep.vue'
import WatchersReactive from './components/practices/composition/WatchersReactive.vue'
import WatchersRefArray from './components/practices/composition/WatchersRefArray.vue'
import WatchersReactiveArray from './components/practices/composition/WatchersReactiveArray.vue'
import WatchersWatchEffect from './components/practices/composition/WatchersWatchEffect.vue'
// 3. Component Lifecycle
import LifecycleParent from '@/components/practices/component/LifecycleParent.vue'
// 4. Props & Emits
import PropsEmitsParent from '@/components/practices/component/PropsEmitsParent.vue'
// 5. Component Slot
import SlotDefaultParent from '@/components/practices/component/SlotDefaultParent.vue'
import SlotNamedParent from '@/components/practices/component/SlotNamedParent.vue'
import SlotScopedParent from '@/components/practices/component/SlotScopedParent.vue'
</script>

<template>
  <div class="practice-container">
    <h1>1. Reactive State</h1>
    <hr />
    <ReactiveRef />
    <ReactiveReactive />
    <h1>2. Computed & Watchers</h1>
    <hr />
    <ComputedBasic />
    <WatchersBasic />
    <WatchersMulti />
    <WatchersDeep />
    <WatchersReactive />
    <WatchersRefArray />
    <WatchersReactiveArray />
    <WatchersWatchEffect />
    <h1>3. Component Lifecycle</h1>
    <hr />
    <LifecycleParent />
    <h1>4. Props & Emits</h1>
    <hr />
    <PropsEmitsParent />
    <h1>5. Component Slot</h1>
    <hr />
    <SlotDefaultParent />
    <SlotNamedParent />
    <SlotScopedParent />
  </div>
</template>

<style>
/* ⚠️ 외부 스타일 파일(예: 버튼 디자인 뭉치)을 이 방 안으로 쏙 가리켜 가져옵니다 */
@import '@/assets/practice.css';
</style>
