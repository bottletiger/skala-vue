<template>
    <div class="container">
        <h2 class="info">ℹ️ 서비스 소개</h2>
        <BaseDashboardCard class="about-card">
            <p>본 앱은 Vue 3 및 Vue Router 4 기반 제작된 실습용 기상 관측 대시보드 시스템입니다.</p>
            <ul>
                <li><mark>components/exercise/</mark> 폴더 내부의 독립 부품 연동</li>
                <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
                <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
            </ul>
        </BaseDashboardCard>
        <RouterLink to="/" class="btn-home">대시보드 홈으로 이동</RouterLink>
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
  margin: 0 0 24px;
  padding: 0 2px 7px;
  border-bottom: 2px solid #e5e7eb;
  color: #334155;
  font-size: 20px;
  font-weight: 500;
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
  padding: 1px 4px;
  border-radius: 3px;
  color: #ff5a3d;
  background: #fff3b0;
}

.btn-home {
  display: block;
  padding: 10px 16px;
  border-radius: 4px;
  background: #0ea5e9;
  color: white;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.btn-home:hover {
  background: #0284c7;
}
</style>
