<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue'

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
const editorPanel = ref(null)
const editorFirstInput = ref(null)

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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  editorPanel.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  nextTick(() => editorFirstInput.value?.focus({ preventScroll: true }))
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
  <section class="collection-workspace post-workspace">
    <header class="workspace-intro">
      <h2>게시글 관리</h2>
      <div class="collection-count">
        <strong>{{ posts.length }}</strong>
        <span>게시글</span>
      </div>
    </header>

    <form class="filter-strip" aria-label="게시글 목록 필터" @submit.prevent="loadPosts">
      <label class="filter-primary">
        <span>게시글 검색</span>
        <input v-model.trim="query" name="post-query" placeholder="제목, 내용 또는 작성자 검색" />
      </label>
      <div class="filter-actions" role="group" aria-label="게시글 검색 동작">
        <button type="submit">조회</button>
        <button type="button" @click="clearSearch">초기화</button>
      </div>
    </form>

    <div class="workspace-layout">
      <article id="post-form" ref="editorPanel" class="editor-panel">
        <header>
          <div class="editor-heading">
            <span>{{ editingId ? '선택 게시글' : '새 게시글' }}</span>
            <h3>{{ editingId ? '게시글 수정' : '게시글 작성' }}</h3>
          </div>
          <button v-if="editingId" type="button" @click="clearForm">편집 취소</button>
        </header>

        <form class="editor-form" :aria-busy="isSaving" @submit.prevent="submitPost">
          <label>
            <span>제목</span>
            <input ref="editorFirstInput" v-model.trim="form.title" name="title" required maxlength="100" placeholder="게시글 제목" />
          </label>

          <label>
            <span>작성자</span>
            <input v-model.trim="form.author" name="author" maxlength="30" placeholder="비워두면 익명으로 저장됩니다" />
          </label>

          <label>
            <span>내용</span>
            <textarea v-model.trim="form.content" name="content" rows="8" maxlength="1000" placeholder="게시글 내용"></textarea>
          </label>

          <button class="save-button" type="submit" :disabled="isSaving">
            {{ isSaving ? '저장 중' : editingId ? '변경 내용 저장' : '게시글 등록' }}
            <i v-if="!isSaving" aria-hidden="true"></i>
          </button>
        </form>
      </article>

      <section class="collection-panel" :aria-busy="isLoading" aria-labelledby="post-list-title">
        <h3 id="post-list-title" class="sr-only">게시글 목록</h3>
        <div v-if="isLoading" class="collection-state" role="status" aria-live="polite">
          <span class="loading-ring" aria-hidden="true"></span>
          게시글을 불러오는 중입니다.
        </div>

        <div v-else-if="posts.length === 0" class="collection-state" role="status" aria-live="polite">조건에 맞는 게시글이 없습니다.</div>

        <template v-else>
          <div class="list-column-head post-column-head" aria-hidden="true">
            <span>번호</span>
            <span>게시글</span>
            <span>작성 정보</span>
            <span>관리</span>
          </div>

          <ol class="post-list">
            <li v-for="post in posts" :key="post.id">
              <div class="post-index">{{ String(post.id).padStart(2, '0') }}</div>

              <article>
                <h3>{{ post.title }}</h3>
                <p>{{ post.content || '작성된 내용이 없습니다.' }}</p>
              </article>

              <div class="post-meta">
                <span>{{ post.author }}</span>
                <time :datetime="post.updatedAt">{{ formatDate(post.updatedAt) }}</time>
              </div>

              <div class="row-actions">
                <button type="button" :aria-label="`${post.title} 수정`" @click="startEdit(post)">수정</button>
                <button type="button" :aria-label="`${post.title} 삭제`" :disabled="isDeleting" @click="deleteTarget = post">삭제</button>
              </div>
            </li>
          </ol>
        </template>
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
.filter-strip {
  grid-template-columns: minmax(0, 1fr) auto;
}

.editor-form textarea {
  min-height: 180px;
}

.post-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-column-head,
.post-list > li {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) minmax(120px, 142px) 96px;
  gap: 16px;
}

.post-list > li {
  align-items: center;
  min-height: 94px;
  padding: 15px 6px;
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
  display: grid;
  gap: 4px;
  color: var(--hero-muted);
  font-size: 10px;
}

.post-meta span {
  font-weight: 800;
}

.post-meta time {
  font-variant-numeric: tabular-nums;
}

.post-list h3 {
  margin: 0;
  font-size: 15px;
  letter-spacing: -0.025em;
}

.post-list article > p {
  margin: 7px 0 0;
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 11px;
  line-height: 1.65;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .post-column-head {
    display: none;
  }

  .post-list {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  }

  .post-list > li {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 9px 11px;
  }

  .post-meta {
    grid-column: 2;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
  }

  .post-meta time::before {
    margin-right: 8px;
    content: '·';
  }

  .row-actions {
    grid-column: 2;
  }
}

@media (max-width: 560px) {
  .filter-strip {
    grid-template-columns: 1fr;
  }

  .post-meta {
    align-items: flex-start;
    grid-template-columns: 1fr;
    gap: 1px;
  }

  .post-meta time::before {
    display: none;
  }
}
</style>
