<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 💡 1. 백엔드 공용 주소
const BASE_URL = 'https://jsonplaceholder.typicode.com/posts'

// 💡 2. 반응형 상태 데이터
const items = ref([]) // 서버에서 받아온 데이터 배열 박스
const textInput = ref('') // 입력창과 연결된 글자 데이터 박스

// ----------------------------------------------------
// [READ] GET : 데이터 가져오기
// ----------------------------------------------------
const handleRead = async () => {
  try {
    // 공부용으로 딱 3개만 들고 옵니다.
    const response = await axios.get(BASE_URL, { params: { _limit: 3 } })
    items.value = response.data
    console.log('GET 성공:', response.data)
  } catch (error) {
    console.error('GET 실패:', error)
  }
}

// ----------------------------------------------------
// [CREATE] POST : 데이터 추가하기
// ----------------------------------------------------
const handleCreate = async () => {
  if (!textInput.value.trim()) return

  try {
    const payload = { title: textInput.value, body: '샘플 내용', userId: 1 }

    // POST 함수 구조: (주소, 보낼데이터)
    const response = await axios.post(BASE_URL, payload)
    console.log('POST 성공:', response.data)

    // 응답 데이터를 배열 맨 앞에 추가하여 화면에 즉시 반영
    items.value.unshift(response.data)
    textInput.value = '' // 입력창 비우기
  } catch (error) {
    console.error('POST 실패:', error)
  }
}

// ----------------------------------------------------
// [UPDATE] PUT : 특정 데이터 수정하기
// ----------------------------------------------------
const handleUpdate = async (id) => {
  try {
    const editPayload = { title: '✨ 변조된 타이틀 데이터', body: '수정 완료', userId: 1 }

    // PUT 함수 구조: (특정방주소, 교체할데이터)
    const response = await axios.put(`${BASE_URL}/${id}`, editPayload)
    console.log('PUT 성공:', response.data)

    // 로컬 화면 배열에서 방금 고친 녀석을 찾아 새 영수증 데이터로 갈아 끼우기
    const index = items.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      items.value[index] = response.data
    }
  } catch (error) {
    console.error('PUT 실패:', error)
  }
}

// ----------------------------------------------------
// [DELETE] DELETE : 특정 데이터 삭제하기
// ----------------------------------------------------
const handleDelete = async (id) => {
  try {
    // DELETE 함수 구조: (특정방주소)
    const response = await axios.delete(`${BASE_URL}/${id}`)
    console.log('DELETE 성공. 상태 코드:', response.status)

    // 반응형 배열에서 방금 지운 녀석만 필터로 걸러내서 화면에서 없애기
    items.value = items.value.filter((item) => item.id !== id)
  } catch (error) {
    console.error('DELETE 실패:', error)
  }
}

// 💡 3. 컴포넌트가 켜지자마자 자동으로 GET 호출
onMounted(() => {
  handleRead()
})
</script>

<template>
  <div class="practice-section">
    <h2>⚡ Axios CRUD 프로토타입 훈련</h2>

    <div class="input-zone">
      <input v-model="textInput" placeholder="저장할 텍스트를 입력하세요" />
      <button @click="handleCreate" class="btn-post">POST (추가)</button>
    </div>

    <ul class="item-list">
      <li v-for="item in items" :key="item.id" class="item-card">
        <div class="content">
          <span class="id-tag">ID: {{ item.id }}</span>
          <p class="title-text">{{ item.title }}</p>
        </div>
        <div class="btn-group">
          <button @click="handleUpdate(item.id)" class="btn-put">PUT (수정)</button>
          <button @click="handleDelete(item.id)" class="btn-delete">DEL (삭제)</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.input-zone {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
}
.btn-post {
  background: #22c55e;
  color: white;
}
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 15px;
}
.id-tag {
  font-size: 11px;
  font-weight: bold;
  color: #64748b;
}
.title-text {
  margin: 0;
  font-size: 14px;
  color: #334155;
  text-transform: capitalize;
}
.btn-group {
  display: flex;
  gap: 4px;
}
.btn-put {
  background: #eab308;
  color: white;
}
.btn-delete {
  background: #ef4444;
  color: white;
}
button:hover {
  opacity: 0.9;
}
</style>
