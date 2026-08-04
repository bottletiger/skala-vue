<script setup>
import { onMounted, reactive, ref, watch } from 'vue'

import { postApi } from '@/api/postApi.js'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const props = defineProps({
  refreshKey: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['notify', 'changed'])

const posts = ref([])
const query = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const editingId = ref(null)
const deleteTarget = ref(null)

const emptyPostForm = () => ({
  title: '',
  author: '',
  content: '',
})

const form = reactive(emptyPostForm())

function formatDate(dateText) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateText))
}

async function loadPosts() {
  isLoading.value = true
  try {
    posts.value = await postApi.getAll({ q: query.value || undefined })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isLoading.value = false
  }
}

function clearForm() {
  editingId.value = null
  Object.assign(form, emptyPostForm())
}

function startEdit(post) {
  editingId.value = post.id
  Object.assign(form, {
    title: post.title,
    author: post.author,
    content: post.content,
  })
  document.querySelector('#post-form')?.scrollIntoView({ behavior: 'smooth' })
}

async function submitPost() {
  isSaving.value = true
  try {
    if (editingId.value) {
      await postApi.update(editingId.value, { ...form })
      emit('notify', { type: 'success', message: '게시글이 수정되었습니다.' })
    } else {
      await postApi.create({ ...form })
      emit('notify', { type: 'success', message: '새 게시글이 등록되었습니다.' })
    }

    clearForm()
    await loadPosts()
    emit('changed')
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isSaving.value = false
  }
}

async function removePost() {
  const post = deleteTarget.value
  if (!post) return

  isDeleting.value = true
  try {
    await postApi.remove(post.id)
    if (editingId.value === post.id) clearForm()
    await loadPosts()
    emit('changed')
    emit('notify', { type: 'success', message: '게시글이 삭제되었습니다.' })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isDeleting.value = false
    deleteTarget.value = null
  }
}

function clearSearch() {
  query.value = ''
  loadPosts()
}

onMounted(loadPosts)
watch(() => props.refreshKey, loadPosts)
</script>

<template>
  <section class="post-workspace">
    <header class="workspace-intro">
      <div>
        <p>POST COLLECTION</p>
        <h2>게시글 관리</h2>
        <span>게시글을 작성하고 제목·내용·작성자로 검색합니다.</span>
      </div>
      <div class="collection-count">
        <strong>{{ posts.length }}</strong>
        <span>현재 게시글</span>
      </div>
    </header>

    <form class="filter-strip" @submit.prevent="loadPosts">
      <label>
        <span>게시글 검색</span>
        <input v-model.trim="query" placeholder="제목, 내용 또는 작성자를 입력하세요" />
      </label>
      <div class="filter-actions" role="group" aria-label="게시글 검색 동작">
        <button type="submit">조회</button>
        <button type="button" @click="clearSearch">검색 지우기</button>
      </div>
    </form>

    <div class="workspace-layout">
      <article id="post-form" class="editor-panel">
        <header>
          <div>
            <p>{{ editingId ? 'UPDATE POST' : 'NEW POST' }}</p>
            <h3>{{ editingId ? '게시글 수정' : '새 게시글 작성' }}</h3>
          </div>
          <button v-if="editingId" type="button" @click="clearForm">취소</button>
        </header>

        <form class="editor-form" @submit.prevent="submitPost">
          <label>
            <span>제목</span>
            <input v-model.trim="form.title" required maxlength="100" placeholder="게시글 제목" />
          </label>

          <label>
            <span>작성자</span>
            <input v-model.trim="form.author" maxlength="30" placeholder="비워두면 익명으로 저장됩니다" />
          </label>

          <label>
            <span>내용</span>
            <textarea v-model.trim="form.content" rows="8" maxlength="1000" placeholder="게시글 내용을 입력하세요."></textarea>
          </label>

          <button class="save-button" :disabled="isSaving">
            {{ isSaving ? '저장 중' : editingId ? '변경 내용 저장' : '게시글 등록' }}
            <i v-if="!isSaving" aria-hidden="true"></i>
          </button>
        </form>
      </article>

      <section class="collection-panel" aria-live="polite">
        <div v-if="isLoading" class="collection-state">
          <span class="loading-ring" aria-hidden="true"></span>
          게시글을 불러오는 중입니다.
        </div>

        <div v-else-if="posts.length === 0" class="collection-state">조건에 맞는 게시글이 없습니다.</div>

        <ol v-else class="post-list">
          <li v-for="post in posts" :key="post.id">
            <div class="post-index">{{ String(post.id).padStart(2, '0') }}</div>

            <article>
              <div class="post-meta">
                <span>{{ post.author }}</span>
                <time :datetime="post.updatedAt">{{ formatDate(post.updatedAt) }}</time>
              </div>
              <h3>{{ post.title }}</h3>
              <p>{{ post.content || '작성된 내용이 없습니다.' }}</p>
              <div class="row-actions">
                <button type="button" @click="startEdit(post)">수정</button>
                <button type="button" :disabled="isDeleting" @click="deleteTarget = post">삭제</button>
              </div>
            </article>
          </li>
        </ol>
      </section>
    </div>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      :busy="isDeleting"
      danger
      title="이 게시글을 삭제할까요?"
      :message="deleteTarget ? `‘${deleteTarget.title}’ 게시글은 삭제 후 복구할 수 없습니다.` : ''"
      confirm-label="게시글 삭제"
      @cancel="deleteTarget = null"
      @confirm="removePost"
    />
  </section>
</template>

<style scoped>
.post-workspace {
  padding-top: clamp(32px, 5svh, 54px);
}

.workspace-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 0 4px;
}

.workspace-intro p,
.editor-panel header p {
  margin: 0 0 5px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.workspace-intro h2 {
  margin: 0;
  font-size: clamp(24px, 3.4vw, 36px);
  line-height: 1.1;
  letter-spacing: -0.045em;
}

.workspace-intro > div:first-child > span {
  display: block;
  margin-top: 8px;
  color: var(--hero-muted);
  font-size: 11px;
}

.collection-count {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.collection-count strong {
  font-size: 34px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.045em;
  line-height: 1;
}

.collection-count span {
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 780;
}

.filter-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px;
  margin-top: 21px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 18px;
  background: color-mix(in srgb, white 12%, transparent);
  backdrop-filter: blur(14px) saturate(108%);
  -webkit-backdrop-filter: blur(14px) saturate(108%);
}

.filter-strip label > span,
.editor-form label > span {
  display: block;
  margin-bottom: 6px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 780;
}

.filter-strip input,
.editor-form input,
.editor-form textarea {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 11px;
  outline: none;
  background: color-mix(in srgb, white 20%, transparent);
  color: var(--hero-text);
  font: inherit;
  font-size: 12px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.filter-strip input,
.editor-form input {
  height: 42px;
  padding: 0 11px;
}

.editor-form textarea {
  min-height: 180px;
  padding: 10px 11px;
  resize: vertical;
}

.filter-strip input:focus,
.editor-form input:focus,
.editor-form textarea:focus {
  border-color: color-mix(in srgb, var(--weather-accent) 58%, transparent);
  background: color-mix(in srgb, white 32%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 10%, transparent);
}

.filter-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(72px, 1fr));
  gap: 3px;
  padding: 3px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
  border-radius: 13px;
  background: color-mix(in srgb, var(--hero-text) 5%, transparent);
}

.filter-actions button {
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.editor-panel header button,
.row-actions button {
  min-height: 40px;
  padding: 0 11px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--hero-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
}

.filter-actions button:first-child {
  background: color-mix(in srgb, var(--hero-text) 78%, transparent);
  box-shadow: 0 4px 12px rgba(27, 42, 47, 0.09);
  color: white;
}

.workspace-layout {
  display: grid;
  grid-template-columns: minmax(290px, 0.72fr) minmax(0, 1.28fr);
  align-items: start;
  gap: 14px;
  margin-top: 14px;
}

.editor-panel {
  scroll-margin-top: 34px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.17), rgba(255, 255, 255, 0.075));
  box-shadow: 0 10px 30px rgba(27, 42, 47, 0.045);
  backdrop-filter: blur(16px) saturate(110%);
  -webkit-backdrop-filter: blur(16px) saturate(110%);
}

.editor-panel header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.editor-panel h3 {
  margin: 0;
  font-size: 17px;
  letter-spacing: -0.025em;
}

.editor-panel header button {
  min-height: 30px;
  padding: 0 4px;
}

.editor-form {
  display: grid;
  gap: 13px;
  margin-top: 17px;
}

.save-button {
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 2px;
  border: 0;
  border-radius: 12px;
  background: color-mix(in srgb, var(--hero-text) 78%, transparent);
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: 820;
}

.save-button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.save-button i {
  width: 7px;
  height: 7px;
  border-top: 1.5px solid currentcolor;
  border-right: 1.5px solid currentcolor;
  transform: rotate(45deg);
}

.collection-panel {
  min-width: 0;
}

.collection-state {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  color: var(--hero-muted);
  font-size: 12px;
  font-weight: 720;
}

.loading-ring {
  width: 15px;
  height: 15px;
  border: 2px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  border-top-color: var(--hero-text);
  border-radius: 50%;
  animation: collection-spin 720ms linear infinite;
}

@keyframes collection-spin {
  to {
    transform: rotate(1turn);
  }
}

.post-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  list-style: none;
}

.post-list > li {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 15px;
  padding: 20px 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
}

.post-index {
  color: var(--weather-accent);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.06em;
}

.post-list article {
  min-width: 0;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  color: var(--hero-muted);
  font-size: 10px;
}

.post-meta span {
  font-weight: 800;
}

.post-meta time::before {
  margin-right: 8px;
  content: '·';
}

.post-list h3 {
  margin: 0;
  font-size: 15px;
  letter-spacing: -0.025em;
}

.post-list article > p {
  display: -webkit-box;
  margin: 7px 0 8px;
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 11px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
}

.row-actions button {
  min-height: 32px;
  padding: 0 7px;
}

.row-actions button:last-child {
  color: #8a514c;
}

@media (hover: hover) and (pointer: fine) {
  .filter-actions button:last-child:hover,
  .editor-panel header button:hover,
  .row-actions button:hover {
    color: var(--hero-text);
  }

  .filter-actions button:last-child:hover {
    background: color-mix(in srgb, white 18%, transparent);
  }
}

@media (max-width: 840px) {
  .workspace-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .workspace-intro {
    align-items: flex-start;
  }

  .filter-strip {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    width: 100%;
  }

  .post-list > li {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 9px;
  }

  .post-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 1px;
  }

  .post-meta time::before {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-ring {
    animation: none;
  }

  .filter-strip input,
  .editor-form input,
  .editor-form textarea {
    transition: none;
  }
}
</style>
