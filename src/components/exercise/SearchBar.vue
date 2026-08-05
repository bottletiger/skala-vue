<template>
    <section class="search-child" aria-labelledby="city-search-title">
      <div class="search-heading">
        <h3 id="city-search-title">🔍 도시 검색</h3>
        <p>입력하면 목록을 필터링하고, 추가 후보도 찾을 수 있습니다.</p>
      </div>

      <form class="search-row" @submit.prevent="handleCitySearch">
        <UInput
          class="search-input"
          :model-value="curQuery"
          size="lg"
          placeholder="도시 이름 입력"
          aria-label="도시 검색"
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

        <UButton
          type="submit"
          color="neutral"
          variant="outline"
          :loading="searchStatus === 'loading'">
          추가 후보 찾기
        </UButton>
      </form>

      <p v-if="searchMessage" class="search-message" aria-live="polite">
        {{ searchMessage }}
      </p>

      <ul v-if="searchResults.length" class="search-results">
        <li v-for="city in searchResults" :key="city.key">
          <div>
            <strong>{{ city.name_kr }}</strong>
            <span>
              {{ [city.name, city.state, city.country].filter(Boolean).join(' · ') }}
            </span>
          </div>
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="xs"
            :disabled="adding"
            @click="emit('add-city', city)">
            목록에 추가
          </UButton>
        </li>
      </ul>
    </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { searchCities } from '@/api/weatherApi'

// - 부모로 부터 검색도시 반응형 데이터를 전달받아 표시 (props)
const props = defineProps({
    curQuery: {
        type: String,
        default: '',
    },
    adding: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['update-query', 'add-city'])
const searchResults = ref([])
const searchStatus = ref('idle')

const searchMessage = computed(() => {
    if (searchStatus.value === 'multiple') return '도시 추가 검색은 이름 하나만 입력해 주세요.'
    if (searchStatus.value === 'error') return '도시 검색에 실패했습니다.'
    if (searchStatus.value === 'empty') return '추가할 도시를 찾지 못했습니다.'
    return ''
})

const resetCandidates = () => {
    searchResults.value = []
    searchStatus.value = 'idle'
}

const sendCurQuery = (value) => {
    resetCandidates()
    emit('update-query', value)
}

const clearQuery = () => {
    resetCandidates()
    emit('update-query', '')
}

const handleCitySearch = async () => {
    const query = props.curQuery.trim()

    if (!query) {
        searchResults.value = []
        searchStatus.value = 'empty'
        return
    }

    if (query.includes(',')) {
        searchResults.value = []
        searchStatus.value = 'multiple'
        return
    }

    searchStatus.value = 'loading'

    try {
        searchResults.value = await searchCities(query)
        searchStatus.value = searchResults.value.length ? 'success' : 'empty'
    } catch (error) {
        console.error(error)
        searchResults.value = []
        searchStatus.value = 'error'
    }
}
</script>

<style scoped>
.search-heading {
  display: flex;
  align-items: baseline;
  gap: 9px;
  margin-bottom: 10px;
}

.search-heading h3 {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 650;
}

.search-heading p {
  margin: 0;
  color: #9ca3af;
  font-size: 11px;
}

.search-row {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
}

.search-message {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.search-results {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.search-results li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  background: #fafafa;
}

.search-results li div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.search-results strong {
  color: #111827;
  font-size: 13px;
  font-weight: 600;
}

.search-results span {
  overflow: hidden;
  color: #9ca3af;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .search-heading {
    display: block;
  }

  .search-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
