<template>
  <ol class="auth-journey" aria-label="JWT 로그인 처리 흐름">
    <li>
      <span class="auth-journey__index">01</span>
      <div>
        <strong>계정 확인</strong>
        <small>입력한 이메일과 비밀번호를 서버로 전송합니다.</small>
      </div>
    </li>
    <li>
      <span class="auth-journey__index">02</span>
      <div>
        <strong>토큰 발급</strong>
        <small>서버가 인증 정보를 확인하고 JWT를 발급합니다.</small>
      </div>
    </li>
    <li>
      <span class="auth-journey__index">03</span>
      <div>
        <strong>실습 시작</strong>
        <small>인증된 상태로 상품과 게시글 API를 사용합니다.</small>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.auth-journey {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  list-style: none;
}

.auth-journey li {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 20px 22px 0;
}

.auth-journey li:first-child {
  padding-left: 0;
}

.auth-journey li + li::before {
  position: absolute;
  top: 20px;
  bottom: 0;
  left: 0;
  width: 1px;
  background: color-mix(in srgb, var(--hero-text) 14%, transparent);
  content: '';
}

.auth-journey__index {
  color: var(--weather-accent);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.auth-journey div {
  display: grid;
  gap: 4px;
}

.auth-journey strong {
  color: var(--hero-text);
  font-size: 13px;
  line-height: 1.35;
}

.auth-journey small {
  color: var(--hero-muted);
  font-size: 11px;
  line-height: 1.55;
}

@media (max-width: 620px) {
  .auth-journey {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .auth-journey li,
  .auth-journey li:first-child {
    padding: 15px 0;
  }

  .auth-journey li + li::before {
    top: 0;
    right: 0;
    bottom: auto;
    width: auto;
    height: 1px;
  }
}
</style>
