<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ==========================================
// [실습 1] 비즈니스 Form: 초간단 회원가입 및 유효성 체크
// ==========================================
const userForm = ref({
  email: '',
  agree: false,
})

const handleRegister = () => {
  if (!userForm.value.email.includes('@')) {
    ElMessage.error('❌ 올바른 이메일 형식이 아닙니다.')
    return
  }
  if (!userForm.value.agree) {
    ElMessage.warning('⚠️ 이용약관에 동의하셔야 합니다.')
    return
  }
  ElMessage.success('🎉 가입 신청이 정상적으로 완료되었습니다!')
}

// ==========================================
// [실습 2] 커머스 Data: 쇼핑몰 수량 및 별점 관리
// ==========================================
const productQuantity = ref(1) // 수량 카운터 기본값
const productRate = ref(4) // 별점 기본값 (별 4개)

// ==========================================
// [실습 3] 시스템 Feedback: 안전한 파일 삭제 및 프로그레스 바
// ==========================================
const downloadProgress = ref(0)
const isDownloading = ref(false)

// 파일 삭제 확인창 예시 (ElMessageBox)
const confirmDelete = () => {
  ElMessageBox.confirm('서버에서 해당 파일을 영구히 삭제하시겠습니까?', '🔥 최종 경고', {
    confirmButtonText: '네, 삭제합니다',
    cancelButtonText: '취소',
    type: 'danger',
  })
    .then(() => {
      ElMessage.success('🗑️ 파일이 안전하게 파쇄되었습니다.')
    })
    .catch(() => {
      ElMessage.info('❌ 삭제 작업이 취소되었습니다.')
    })
}

// 게이지 바 애니메이션 가동
const startDownload = () => {
  if (isDownloading.value) return (isDownloading.value = true)
  downloadProgress.value = 0

  const interval = setInterval(() => {
    downloadProgress.value += 20
    if (downloadProgress.value >= 100) {
      clearInterval(interval)
      isDownloading.value = false
      ElMessage.success('💾 대용량 데이터 로드가 완료되었습니다!')
    }
  }, 400)
}
</script>

<template>
  <div class="practice-section">
    <h2>🧪 Element Plus 활용 실습</h2>
    <p class="subtitle">외부 API와 무관하게 템플릿과 상태값 변동만을 관측하는 샘플입니다.</p>

    <el-card class="box-card">
      <template #header><strong>📝 실습 1. 회원가입 Form & 인풋 제어</strong></template>
      <div class="card-body">
        <div class="input-group">
          <span>이메일 주소:</span>
          <el-input v-model="userForm.email" placeholder="example@email.com" clearable style="width: 300px" />
        </div>

        <div class="input-group">
          <el-switch v-model="userForm.agree" active-text="개인정보 수집 및 필수 이용약관에 동의합니다." />
        </div>

        <el-button type="success" @click="handleRegister">🚀 회원가입하기</el-button>
      </div>
    </el-card>

    <el-card class="box-card">
      <template #header><strong>🛒 실습 2. 커머스 상품 수량 및 평점 시스템</strong></template>
      <div class="card-body">
        <div class="input-group">
          <span>구매 수량 선택:</span>
          <el-input-number v-model="productQuantity" :min="1" :max="10" />
          <span class="hint-text">(최대 10개 구매 가능)</span>
        </div>

        <div class="input-group">
          <span>상품 만족도 별점:</span>
          <el-rate v-model="productRate" show-score score-template="{value} 점" />
        </div>

        <div class="result-preview">🟢 <strong>실시간 장부 요약:</strong> 선택 수량 {{ productQuantity }}개 / 내가 준 점수 {{ productRate }}점</div>
      </div>
    </el-card>

    <el-card class="box-card">
      <template #header><strong>⚙️ 실습 3. 시스템 피드백 & 프로그레스 인터랙션</strong></template>
      <div class="card-body">
        <div class="btn-zone">
          <el-button type="danger" plain @click="confirmDelete">🗑️ 서버 파일 삭제 테스트</el-button>

          <el-button type="primary" :loading="isDownloading" @click="startDownload">
            {{ isDownloading ? '동기화 중...' : '💾 데이터 동기화 시작' }}
          </el-button>
        </div>

        <div class="progress-zone">
          <el-progress :percentage="downloadProgress" :status="downloadProgress === 100 ? 'success' : ''" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.subtitle {
  color: #909399;
  margin-bottom: 30px;
}
.box-card {
  margin-bottom: 25px;
  border-radius: 8px;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.input-group {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
}
.hint-text {
  color: #909399;
  font-size: 12px;
}
.result-preview {
  background: #f4f4f5;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}
.btn-zone {
  display: flex;
  gap: 10px;
}
.progress-zone {
  margin-top: 10px;
}
</style>
