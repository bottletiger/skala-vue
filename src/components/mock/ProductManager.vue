<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue'

import { productApi } from '@/api/productApi.js'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const props = defineProps({
  refreshKey: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['notify', 'changed'])

const products = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const editingId = ref(null)
const deleteTarget = ref(null)
const editorPanel = ref(null)
const editorFirstInput = ref(null)

const filters = reactive({
  q: '',
  category: '전체',
  available: false,
})

const emptyProductForm = () => ({
  name: '',
  category: '장비',
  price: 0,
  stock: 0,
  description: '',
})

const form = reactive(emptyProductForm())

function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price)
}

async function loadProducts() {
  isLoading.value = true
  try {
    products.value = await productApi.getAll({
      q: filters.q || undefined,
      category: filters.category,
      available: filters.available || undefined,
    })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isLoading.value = false
  }
}

function clearForm() {
  editingId.value = null
  Object.assign(form, emptyProductForm())
}

function startEdit(product) {
  editingId.value = product.id
  Object.assign(form, {
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    description: product.description,
  })

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  editorPanel.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  nextTick(() => editorFirstInput.value?.focus({ preventScroll: true }))
}

async function submitProduct() {
  isSaving.value = true
  try {
    if (editingId.value) {
      await productApi.update(editingId.value, { ...form })
      emit('notify', { type: 'success', message: '상품이 수정되었습니다.' })
    } else {
      await productApi.create({ ...form })
      emit('notify', { type: 'success', message: '새 상품이 등록되었습니다.' })
    }

    clearForm()
    await loadProducts()
    emit('changed')
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isSaving.value = false
  }
}

async function removeProduct() {
  const product = deleteTarget.value
  if (!product) return

  isDeleting.value = true
  try {
    await productApi.remove(product.id)
    if (editingId.value === product.id) clearForm()
    await loadProducts()
    emit('changed')
    emit('notify', { type: 'success', message: '상품이 삭제되었습니다.' })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isDeleting.value = false
    deleteTarget.value = null
  }
}

function resetFilters() {
  Object.assign(filters, { q: '', category: '전체', available: false })
  loadProducts()
}

onMounted(loadProducts)
watch(() => props.refreshKey, loadProducts)
</script>

<template>
  <section class="collection-workspace product-workspace">
    <header class="workspace-intro">
      <h2>상품 관리</h2>
      <div class="collection-count">
        <strong>{{ products.length }}</strong>
        <span>상품</span>
      </div>
    </header>

    <form class="filter-strip" aria-label="상품 목록 필터" @submit.prevent="loadProducts">
      <label class="filter-primary">
        <span>상품 검색</span>
        <input v-model.trim="filters.q" name="product-query" placeholder="이름이나 설명 검색" />
      </label>

      <label>
        <span>카테고리</span>
        <select v-model="filters.category" name="product-category">
          <option>전체</option>
          <option>장비</option>
          <option>도서</option>
          <option>강의</option>
          <option>기타</option>
        </select>
      </label>

      <label class="stock-filter">
        <input v-model="filters.available" name="in-stock-only" type="checkbox" />
        <span>재고 있음</span>
      </label>

      <div class="filter-actions" role="group" aria-label="상품 검색 동작">
        <button type="submit">조회</button>
        <button type="button" @click="resetFilters">초기화</button>
      </div>
    </form>

    <div class="workspace-layout">
      <article id="product-form" ref="editorPanel" class="editor-panel">
        <header>
          <div class="editor-heading">
            <span>{{ editingId ? '선택 상품' : '새 상품' }}</span>
            <h3>{{ editingId ? '상품 수정' : '상품 등록' }}</h3>
          </div>
          <button v-if="editingId" type="button" @click="clearForm">편집 취소</button>
        </header>

        <form class="editor-form" :aria-busy="isSaving" @submit.prevent="submitProduct">
          <label>
            <span>상품명</span>
            <input ref="editorFirstInput" v-model.trim="form.name" name="product-name" required maxlength="80" placeholder="예: 노트북 거치대" />
          </label>

          <div class="field-pair">
            <label>
              <span>카테고리</span>
              <select v-model="form.category" name="category">
                <option>장비</option>
                <option>도서</option>
                <option>강의</option>
                <option>기타</option>
              </select>
            </label>
            <label>
              <span>재고</span>
              <input v-model.number="form.stock" name="stock" type="number" min="0" step="1" required />
            </label>
          </div>

          <label>
            <span>가격</span>
            <input v-model.number="form.price" name="price" type="number" min="0" step="100" required />
          </label>

          <label>
            <span>설명</span>
            <textarea v-model.trim="form.description" name="description" rows="4" maxlength="300" placeholder="상품 특징"></textarea>
          </label>

          <button class="save-button" type="submit" :disabled="isSaving">
            {{ isSaving ? '저장 중' : editingId ? '변경 내용 저장' : '상품 등록' }}
            <i v-if="!isSaving" aria-hidden="true"></i>
          </button>
        </form>
      </article>

      <section class="collection-panel" :aria-busy="isLoading" aria-labelledby="product-list-title">
        <h3 id="product-list-title" class="sr-only">상품 목록</h3>
        <div v-if="isLoading" class="collection-state" role="status" aria-live="polite">
          <span class="loading-ring" aria-hidden="true"></span>
          상품을 불러오는 중입니다.
        </div>

        <div v-else-if="products.length === 0" class="collection-state" role="status" aria-live="polite">조건에 맞는 상품이 없습니다.</div>

        <template v-else>
          <div class="list-column-head product-column-head" aria-hidden="true">
            <span>구분</span>
            <span>상품 정보</span>
            <span>가격 · 재고</span>
            <span>관리</span>
          </div>

          <ol class="product-list">
            <li v-for="product in products" :key="product.id">
              <div class="product-index">
                <span>{{ String(product.id).padStart(2, '0') }}</span>
                <small>{{ product.category }}</small>
              </div>

              <div class="product-content">
                <h3>{{ product.name }}</h3>
                <p>{{ product.description || '등록된 상품 설명이 없습니다.' }}</p>
              </div>

              <div class="product-metrics">
                <strong>{{ formatPrice(product.price) }}</strong>
                <span class="stock-label" :class="{ 'is-empty': product.stock === 0 }">
                  {{ product.stock === 0 ? '품절' : `재고 ${product.stock}개` }}
                </span>
              </div>

              <div class="row-actions">
                <button type="button" :aria-label="`${product.name} 수정`" @click="startEdit(product)">수정</button>
                <button type="button" :aria-label="`${product.name} 삭제`" :disabled="isDeleting" @click="deleteTarget = product">삭제</button>
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
      title="이 상품을 삭제할까요?"
      :message="deleteTarget ? `‘${deleteTarget.name}’ 상품은 삭제 후 복구할 수 없습니다.` : ''"
      confirm-label="상품 삭제"
      @cancel="deleteTarget = null"
      @confirm="removeProduct"
    />
  </section>
</template>

<style scoped>
.filter-strip {
  grid-template-columns: minmax(220px, 1fr) 140px auto auto;
}

.stock-filter {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 7px;
  padding: 0 5px;
  white-space: nowrap;
}

.stock-filter input {
  accent-color: var(--weather-accent);
}

.stock-filter > span {
  margin: 0;
  font-size: 11px;
}

.field-pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.75fr);
  gap: 9px;
}

.editor-form textarea {
  min-height: 104px;
}

.product-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.product-column-head,
.product-list > li {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) minmax(112px, 138px) 96px;
  gap: 16px;
}

.product-list > li {
  align-items: center;
  min-height: 88px;
  padding: 15px 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
}

.product-index {
  display: grid;
  align-content: start;
  gap: 3px;
}

.product-index span {
  color: var(--weather-accent);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.06em;
}

.product-index small {
  color: var(--hero-muted);
  font-size: 10px;
}

.product-content {
  min-width: 0;
}

.product-content h3 {
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-content p {
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 11px;
  line-height: 1.55;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-metrics {
  display: grid;
  justify-items: start;
  gap: 5px;
}

.product-metrics strong {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.stock-label {
  color: #3f6f5d;
  font-size: 10px;
  font-weight: 820;
}

.stock-label.is-empty {
  color: #8a514c;
}

@media (max-width: 840px) {
  .filter-strip {
    grid-template-columns: minmax(0, 1fr) 140px;
  }
}

@media (max-width: 700px) {
  .product-column-head {
    display: none;
  }

  .product-list {
    border-top: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  }

  .product-list > li {
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 10px;
  }

  .product-metrics {
    justify-items: end;
  }

  .row-actions {
    grid-column: 2 / -1;
    margin-top: -4px;
  }
}

@media (max-width: 560px) {
  .filter-strip {
    grid-template-columns: 1fr;
  }

  .product-list > li {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
  }

  .product-metrics {
    grid-column: 2;
    grid-row: 2;
    grid-template-columns: auto auto;
    align-items: center;
    justify-content: start;
    gap: 12px;
  }

  .row-actions {
    grid-column: 2;
    grid-row: 3;
  }
}

@media (max-width: 380px) {
  .field-pair {
    grid-template-columns: 1fr;
  }
}
</style>
