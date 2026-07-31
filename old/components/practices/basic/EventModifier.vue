<script setup>
const handleLink = () => {
  alert('수식어 덕분에 네이버로 이동하지 않고 함수만 실행됩니다!')
}

const handleBox = () => {
  alert('부모 박스가 클릭되었습니다!')
}
</script>

<template>
  <div class="practice-section">
    <h2>이벤트 수식어(Modifiers) 학습</h2>
    <h3>1) .prevent (기본 동작 막기)</h3>
    <a href="https://www.naver.com" @click.prevent="handleLink">네이버 링크</a>
    <br />

    <h3>2) .stop (이벤트 버블링 막기)</h3>
    <div @click="handleBox" style="padding: 20px; background-color: #eee">
      <p>부모 영역 (클릭 시 alert 발동)</p>
      <button @click="window.alert('1번 자식 클릭!')">버블링 발생 버튼</button>
      <button @click.stop="window.alert('2번 자식(나만 켜짐) 클릭!')">버블링 차단 버튼</button>
    </div>
  </div>
</template>
