<template>
  <section class="city-add" aria-labelledby="city-add-title">
    <div class="city-add-heading">
      <h3 id="city-add-title">도시 직접 추가</h3>
      <p>국문 또는 영문 도시 이름으로 검색할 수 있습니다.</p>
    </div>

    <form class="city-search-form" @submit.prevent="handleSearch">
      <UInput
        v-model="searchText"
        class="city-search-input"
        placeholder="예: 제주, Tokyo"
        aria-label="추가할 도시 검색" />
      <UButton
        type="submit"
        color="neutral"
        :loading="searchStatus === 'loading'">
        도시 검색
      </UButton>
    </form>

    <p v-if="searchMessage" class="city-search-message" aria-live="polite">
      {{ searchMessage }}
    </p>

    <ul v-if="searchResults.length" class="city-results">
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

defineProps({
  adding: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add-city'])
const searchText = ref('')
const searchResults = ref([])
const searchStatus = ref('idle')

const searchMessage = computed(() => {
  if (searchStatus.value === 'error') return '도시 검색에 실패했습니다.'
  if (searchStatus.value === 'empty') return '검색 결과가 없습니다.'
  return ''
})

const handleSearch = async () => {
  const query = searchText.value.trim()

  if (!query) {
    searchResults.value = []
    searchStatus.value = 'empty'
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
.city-add {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #eef0f2;
}

.city-add-heading {
  display: flex;
  align-items: baseline;
  gap: 9px;
  margin-bottom: 10px;
}

.city-add-heading h3 {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 650;
}

.city-add-heading p {
  margin: 0;
  color: #9ca3af;
  font-size: 11px;
}

.city-search-form {
  display: flex;
  gap: 8px;
}

.city-search-input {
  flex: 1;
}

.city-search-message {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.city-results {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.city-results li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  background: #fafafa;
}

.city-results li div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.city-results strong {
  color: #111827;
  font-size: 13px;
  font-weight: 600;
}

.city-results span {
  overflow: hidden;
  color: #9ca3af;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .city-add-heading {
    display: block;
  }

  .city-search-form {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
