<template>
  <main class="home-page">
    <section class="intro">
      <p class="eyebrow">SKALA VUE</p>
      <h1>Vue 학습</h1>
    </section>

    <nav class="page-menu" aria-label="페이지 선택">
      <RouterLink class="menu-item practice" to="/practice">
        <span class="menu-number">01</span>
        <span>
          <strong>실습 페이지</strong>
          <small>수업 실습 모음</small>
        </span>
        <span class="arrow" aria-hidden="true">→</span>
      </RouterLink>

      <RouterLink class="menu-item assignment" to="/assignment">
        <span class="menu-number">02</span>
        <span>
          <strong>과제 페이지</strong>
          <small>과제 모음</small>
        </span>
        <span class="arrow" aria-hidden="true">→</span>
      </RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.home-page {
  width: min(100%, 880px);
  margin: 0 auto;
  padding-top: clamp(3rem, 12vh, 8rem);
}

.intro {
  margin-bottom: 3rem;
}

.eyebrow {
  margin-bottom: 0.5rem;
  color: #c44536;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

h1 {
  color: #14213d;
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 900;
  line-height: 1.05;
}

.description {
  margin-top: 1rem;
  color: #52616b;
  font-size: 1.1rem;
}

.page-menu {
  border-top: 2px solid #14213d;
}

.menu-item {
  display: grid;
  grid-template-columns: 3rem 1fr auto;
  gap: 1.25rem;
  align-items: center;
  min-height: 118px;
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #a8b5b9;
  color: #14213d;
  transition: background-color 180ms ease, padding 180ms ease;
}

.menu-item:hover {
  padding-inline: 1.5rem;
  background: #e8f0e8;
}

.menu-number {
  color: #6c7a80;
  font-size: 0.8rem;
  font-weight: 800;
}

.menu-item strong,
.menu-item small {
  display: block;
}

.menu-item strong {
  font-size: 1.5rem;
  font-weight: 800;
}

.menu-item small {
  margin-top: 0.25rem;
  color: #66757c;
  font-size: 0.9rem;
}

.arrow {
  font-size: 1.8rem;
}

@media (max-width: 520px) {
  .home-page {
    padding-top: 2rem;
  }

  .intro {
    margin-bottom: 2rem;
  }

  .menu-item {
    grid-template-columns: 2rem 1fr auto;
    gap: 0.75rem;
    padding-inline: 0.25rem;
  }

  .menu-item:hover {
    padding-inline: 0.5rem;
  }

  .menu-item strong {
    font-size: 1.2rem;
  }
}
</style>
