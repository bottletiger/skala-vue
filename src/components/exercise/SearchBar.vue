<template>
    <div class="search-child">
      <h3>🔍 도시 검색</h3>
      <!-- <input type="text" v-model="searchQuery" placeholder="검색할 도시 이름 입력" /> -->
      <!-- <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" /> -->
        <input type="text" :value="curQuery" @input="sendCurQuery" placeholder="검색할 도시 이름 입력" />

      <p>
        검색 중인 도시: {{ curQuery }}
      </p>
    </div>
</template>

<script setup>
// - 부모로 부터 검색도시 반응형 데이터를 전달받아 표시 (props)
defineProps({
    curQuery: {
        type: String,
        default: '',
    },
})

// - 도시 검색 시 update-query 이벤트를 발생하면서 검색어를 부모에게 전달 (erits)
const emit = defineEmits(['update-query']);
const sendCurQuery = (event) =>{
    emit('update-query', event.target.value);
}
</script>

<style scoped>
input {
  width: 100%;
  padding: 8px;
  border: 1px solid #adb5bd;
  font-size: 14px;
}
</style>
