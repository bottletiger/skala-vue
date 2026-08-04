<script setup>
import { onMounted, reactive, ref, watch } from 'vue'

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

  document.querySelector('#product-form')?.scrollIntoView({ behavior: 'smooth' })
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
  <section class="product-workspace">
    <header class="workspace-intro">
      <div>
        <p>PRODUCT COLLECTION</p>
        <h2>상품 관리</h2>
        <span>상품 정보를 등록하고 재고와 가격을 관리합니다.</span>
      </div>
      <div class="collection-count">
        <strong>{{ products.length }}</strong>
        <span>현재 상품</span>
      </div>
    </header>

    <form class="filter-strip" @submit.prevent="loadProducts">
      <label class="filter-search">
        <span>상품 검색</span>
        <input v-model.trim="filters.q" placeholder="이름이나 설명을 입력하세요" />
      </label>

      <label>
        <span>카테고리</span>
        <select v-model="filters.category">
          <option>전체</option>
          <option>장비</option>
          <option>도서</option>
          <option>강의</option>
          <option>기타</option>
        </select>
      </label>

      <label class="stock-filter">
        <input v-model="filters.available" type="checkbox" />
        <span>재고 있는 상품만</span>
      </label>

      <div class="filter-actions" role="group" aria-label="상품 검색 동작">
        <button type="submit">조회</button>
        <button type="button" @click="resetFilters">조건 지우기</button>
      </div>
    </form>

    <div class="workspace-layout">
      <article id="product-form" class="editor-panel">
        <header>
          <div>
            <p>{{ editingId ? 'UPDATE PRODUCT' : 'NEW PRODUCT' }}</p>
            <h3>{{ editingId ? '상품 수정' : '새 상품 등록' }}</h3>
          </div>
          <button v-if="editingId" type="button" @click="clearForm">취소</button>
        </header>

        <form class="editor-form" @submit.prevent="submitProduct">
          <label>
            <span>상품명</span>
            <input v-model.trim="form.name" required maxlength="80" placeholder="예: 노트북 거치대" />
          </label>

          <div class="field-pair">
            <label>
              <span>카테고리</span>
              <select v-model="form.category">
                <option>장비</option>
                <option>도서</option>
                <option>강의</option>
                <option>기타</option>
              </select>
            </label>
            <label>
              <span>재고</span>
              <input v-model.number="form.stock" type="number" min="0" step="1" required />
            </label>
          </div>

          <label>
            <span>가격</span>
            <input v-model.number="form.price" type="number" min="0" step="100" required />
          </label>

          <label>
            <span>설명</span>
            <textarea v-model.trim="form.description" rows="4" maxlength="300" placeholder="상품의 특징을 입력하세요."></textarea>
          </label>

          <button class="save-button" :disabled="isSaving">
            {{ isSaving ? '저장 중' : editingId ? '변경 내용 저장' : '상품 등록' }}
            <i v-if="!isSaving" aria-hidden="true"></i>
          </button>
        </form>
      </article>

      <section class="collection-panel" aria-live="polite">
        <div v-if="isLoading" class="collection-state">
          <span class="loading-ring" aria-hidden="true"></span>
          상품을 불러오는 중입니다.
        </div>

        <div v-else-if="products.length === 0" class="collection-state">조건에 맞는 상품이 없습니다.</div>

        <ol v-else class="product-list">
          <li v-for="product in products" :key="product.id">
            <div class="product-index">
              <span>{{ String(product.id).padStart(2, '0') }}</span>
              <small>{{ product.category }}</small>
            </div>

            <div class="product-content">
              <div>
                <h3>{{ product.name }}</h3>
                <strong>{{ formatPrice(product.price) }}</strong>
              </div>
              <p>{{ product.description || '등록된 상품 설명이 없습니다.' }}</p>
              <span class="stock-label" :class="{ 'is-empty': product.stock === 0 }">
                {{ product.stock === 0 ? '품절' : `재고 ${product.stock}개` }}
              </span>
            </div>

            <div class="row-actions">
              <button type="button" @click="startEdit(product)">수정</button>
              <button type="button" :disabled="isDeleting" @click="deleteTarget = product">삭제</button>
            </div>
          </li>
        </ol>
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
.product-workspace {
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
  grid-template-columns: minmax(220px, 1fr) 140px auto auto;
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

.filter-strip input:not([type='checkbox']),
.filter-strip select,
.editor-form input,
.editor-form select,
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

.filter-strip input:not([type='checkbox']),
.filter-strip select,
.editor-form input,
.editor-form select {
  height: 42px;
  padding: 0 11px;
}

.editor-form textarea {
  min-height: 104px;
  padding: 10px 11px;
  resize: vertical;
}

.filter-strip input:focus,
.filter-strip select:focus,
.editor-form input:focus,
.editor-form select:focus,
.editor-form textarea:focus {
  border-color: color-mix(in srgb, var(--weather-accent) 58%, transparent);
  background: color-mix(in srgb, white 32%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--weather-accent) 10%, transparent);
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
  margin: 0 !important;
  font-size: 11px !important;
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

.field-pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.75fr);
  gap: 9px;
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

.product-list {
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 15%, transparent);
  list-style: none;
}

.product-list > li {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 15px;
  padding: 18px 4px;
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

.product-content > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.product-content h3 {
  min-width: 0;
  margin: 0;
  font-size: 14px;
  letter-spacing: -0.02em;
}

.product-content strong {
  flex: 0 0 auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.product-content p {
  display: -webkit-box;
  margin: 5px 0 8px;
  overflow: hidden;
  color: var(--hero-muted);
  font-size: 11px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.stock-label {
  color: #3f6f5d;
  font-size: 10px;
  font-weight: 820;
}

.stock-label.is-empty {
  color: #8a514c;
}

.row-actions {
  display: flex;
  align-items: flex-start;
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
  .filter-strip {
    grid-template-columns: minmax(0, 1fr) 140px;
  }

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

  .product-list > li {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
  }

  .row-actions {
    grid-column: 2;
    justify-content: flex-end;
    margin-top: -5px;
  }

  .product-content > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 380px) {
  .field-pair {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-ring {
    animation: none;
  }

  .filter-strip input,
  .filter-strip select,
  .editor-form input,
  .editor-form select,
  .editor-form textarea {
    transition: none;
  }
}
</style>
