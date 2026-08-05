<template>
    <div class="search-child">
      <h3>🔍 도시 검색</h3>
      <!-- <input type="text" v-model="searchQuery" placeholder="검색할 도시 이름 입력" /> -->
      <!-- <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" /> -->
        <UInput
          class="search-input"
          :model-value="curQuery"
          size="lg"
          placeholder="검색할 도시 이름 입력"
          @update:model-value="sendCurQuery">
          <template v-if="curQuery" #trailing>
            <UButton
              type="button"
              color="neutral"
              variant="link"
              size="xs"
              aria-label="검색어 지우기"
              @click="clearQuery">
              지우기
            </UButton>
          </template>
        </UInput>

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
const sendCurQuery = (value) =>{
    emit('update-query', value);
}

const clearQuery = () => {
    emit('update-query', '');
}
</script>

<style scoped>
.search-input {
  width: 100%;
}

</style>
