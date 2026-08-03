<template>
    <div class="child-container">
        <h2>하위 컴포넌트 (child)</h2>
        <p>
            수신된 Props 데이터: <strong>{{ parentData }}</strong>
        </p>
        <button @click="sendNorification">상위 컴포넌트로 갱신 요청(emit)</button>
    </div>
</template>

<script setup>
defineProps({
    parentData:{
        type: String,
        required: true
    }
})

const emit = defineEmits(['update-request'])
const sendNorification = () =>{
    const payload = 'Child에서 가공한 새로운 데이터'
    emit('update-request', payload)
}
</script>

<style lang="scss" scoped>

</style>