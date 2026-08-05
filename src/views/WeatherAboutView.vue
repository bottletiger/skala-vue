<template>
    <div class="container">
        <h2 class="info">ℹ️ 서비스 소개</h2>
        <BaseDashboardCard class="about-card">
            <p>본 앱은 Vue 3 및 Vue Router 4 기반 제작된 실습용 기상 관측 대시보드 시스템입니다.</p>
            <ul>
                <li><mark>components/exercise/</mark> 폴더 내부의 독립 부품 연동</li>
                <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
                <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
                <li>즐겨찾기 도시를 localStorage에 저장하고 다시 불러오기</li>
                <li>상세 라우트를 모달로 표시하고 배경 화면 스크롤 잠금 처리</li>
                <li>도시별 7일 예보 조회 및 localStorage 캐싱</li>
            </ul>
        </BaseDashboardCard>
        <UButton to="/" color="neutral" class="btn-home">대시보드로 이동</UButton>
    </div>
</template>

<script setup>
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue';


</script>

<style scoped>
.container {
  margin: 20px auto 0;
}

.info {
  display: flex;
  align-items: center;
  margin: 0 0 14px;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.about-card {
  color: #475569;
  font-size: 15px;
  line-height: 1.65;
}

.about-card p {
  margin: 0 0 4px;
}

.about-card ul {
  margin: 0;
  padding-left: 20px;
}

.about-card li + li {
  margin-top: 3px;
}

.about-card mark {
  padding: 2px 5px;
  border-radius: 4px;
  color: #4b5563;
  background: #f3f4f6;
}

.btn-home {
  margin-top: 14px;
}
</style>
