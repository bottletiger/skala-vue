import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('Router 과제의 홈·소개·동적 상세·Catch-all 경로를 지연 로딩한다', () => {
  const routerSource = readSource('../src/router/index.js')

  assert.match(routerSource, /path:\s*'\/'[\s\S]*import\('@\/views\/WeatherHomeView\.vue'\)/)
  assert.match(routerSource, /path:\s*'\/about'[\s\S]*import\('@\/views\/WeatherAboutView\.vue'\)/)
  assert.match(routerSource, /path:\s*'\/weather\/:cityId'[\s\S]*import\('@\/views\/WeatherDetailView\.vue'\)/)
  assert.match(routerSource, /path:\s*'\/:pathMatch\(\.\*\)\*'[\s\S]*import\('@\/views\/NotFoundView\.vue'\)/)
})

test('App에 RouterLink Navigation Bar와 RouterView를 함께 배치한다', () => {
  const appSource = readSource('../src/App.vue')

  assert.match(appSource, /RouterLink/)
  assert.match(appSource, /<nav[\s\S]*?aria-label="주요 메뉴"/)
  assert.match(appSource, /name:\s*'WeatherHome'/)
  assert.match(appSource, /name:\s*'WeatherAbout'/)
  assert.match(appSource, /<RouterView\s*\/>/)
})

test('이전 컴포넌트 과제의 BaseDashboardCard slot을 홈 검색과 목록에 유지한다', () => {
  const baseCardSource = readSource('../src/components/exercise/BaseDashboardCard.vue')
  const homeSource = readSource('../src/views/WeatherHomeView.vue')

  assert.match(baseCardSource, /<slot\s*\/>/)
  assert.equal((homeSource.match(/<BaseDashboardCard/g) ?? []).length, 2)
})

test('홈의 상세보기는 모달 대신 동적 상세 경로로 Programmatic Navigation한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const cardSource = readSource('../src/components/exercise/WeatherCard.vue')
  const modalPath = `${projectRoot}src/components/weather/WeatherDetailModal.vue`

  assert.match(homeSource, /router\.push\(\{[\s\S]*name:\s*'WeatherDetail'[\s\S]*params:\s*\{\s*cityId\s*\}/)
  assert.match(cardSource, /emit\('click-detail',\s*props\.cityItem\.id\)/)
  assert.doesNotMatch(homeSource, /WeatherDetailModal|detailModal|aria-haspopup="dialog"/)
  assert.equal(existsSync(modalPath), false)
})

test('서비스 소개 화면에서 RouterLink로 메인 대시보드에 돌아간다', () => {
  const aboutSource = readSource('../src/views/WeatherAboutView.vue')

  assert.match(aboutSource, /<h1>/)
  assert.match(aboutSource, /<RouterLink[\s\S]*name:\s*'WeatherHome'/)
  assert.match(aboutSource, /날씨 대시보드로 돌아가기/)
})

test('Navigation Bar는 하단 고정형이며 활성 RouterLink 표시가 슬라이딩한다', () => {
  const appSource = readSource('../src/App.vue')

  assert.match(appSource, /\.app-navigation\s*\{[^}]*position:\s*fixed;[^}]*bottom:\s*calc\(12px \+ env\(safe-area-inset-bottom\)\);/s)
  assert.match(appSource, /class="navigation-slider"/)
  assert.match(appSource, /transform:\s*translateX\(calc\(var\(--active-route-index\) \* 100%\)\);/)
  assert.match(appSource, /transition:[\s\S]*transform 360ms/)
  assert.match(appSource, /route\.name === 'WeatherHome' \|\| route\.name === 'WeatherDetail'/)
})

test('Hero는 배경에 직접 표시하고 검색과 새로고침을 지정 위치에 배치한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const heroStart = homeSource.indexOf('ref="weatherHero"')
  const heroEnd = homeSource.indexOf('</section>', heroStart)
  const refreshButton = homeSource.indexOf('class="refresh-button"', heroStart)
  const search = homeSource.indexOf('class="hero-search"')
  const citySection = homeSource.indexOf('class="city-section"')

  assert.ok(heroStart >= 0 && refreshButton > heroStart && refreshButton < heroEnd)
  assert.ok(search > heroEnd && search < citySection)
  assert.match(homeSource, /\.hero-face,\s*\.hero-placeholder\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
})

test('Hero 설명은 테두리 없이 표시하고 검색까지를 첫 뷰포트로 구성한다', () => {
  const appSource = readSource('../src/App.vue')
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const indexSource = readSource('../index.html')

  assert.match(homeSource, /\.condition-label\s*\{[^}]*padding:\s*0;[^}]*border:\s*0;/s)
  assert.match(homeSource, /\.hero-stage\s*\{[^}]*min-height:\s*100svh;[^}]*grid-template-rows:\s*minmax\(min-content, 1fr\) auto;/s)
  assert.match(homeSource, /padding:[^;]*var\(--floating-nav-clearance/)
  assert.match(appSource, /--floating-nav-clearance:/)
  assert.match(appSource, /\.app-navigation--weather\s*\{\s*background:\s*rgba\(246, 249, 248, 0\.34\);/s)
  assert.match(indexSource, /viewport-fit=cover/)
})

test('도시 목록 제목과 개수를 숨기고 구체적인 날씨 설명을 한 번만 표시한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const cardSource = readSource('../src/components/exercise/WeatherCard.vue')
  const detailSource = readSource('../src/views/WeatherDetailView.vue')

  assert.doesNotMatch(homeSource, /city-section-heading|>다른 도시</)
  assert.match(homeSource, /heroWeather\.status \|\| heroTheme\.label/)
  assert.match(cardSource, /cityItem\.status \|\| weatherTheme\.label/)
  assert.match(detailSource, /cityData\.status \|\| weatherTheme\.label/)
  assert.doesNotMatch(detailSource, /<span>\{\{ weatherTheme\.label \}\}<\/span>/)
})

test('로딩 중 회전 아이콘을 표시하고 Hero 날씨 아이콘과 설명의 우선순위를 조정한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const spinnerSource = readSource('../src/components/weather/LoadingSpinner.vue')
  const locationStart = homeSource.indexOf('class="hero-location"')
  const cityName = homeSource.indexOf('id="weather-hero-title"', locationStart)
  const condition = homeSource.indexOf('class="condition-label"', locationStart)

  assert.match(homeSource, /<LoadingSpinner v-if="heroState === 'loading'"/)
  assert.match(detailSource, /<LoadingSpinner class="detail-loading-spinner"/)
  assert.match(spinnerSource, /@keyframes loading-spin/)
  assert.match(spinnerSource, /animation:\s*loading-spin 820ms linear infinite/)
  assert.ok(cityName >= 0 && condition > cityName)
  assert.match(homeSource, /width:\s*clamp\(118px, 16vw, 172px\)/)
})

test('도시 카드는 전체 검색 결과를 표시하고 더보기 컨트롤을 사용하지 않는다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')

  assert.match(homeSource, /matchesSearchQuery\(item\.name, query\)/)
  assert.match(homeSource, /v-for="item in otherWeatherList"/)
  assert.doesNotMatch(homeSource, /INITIAL_VISIBLE_CITY_COUNT|isShowingAllCities|show-more-button|showAllCities|>더보기</)
})

test('검색창은 기본 취소 아이콘을 숨기고 사용자 정의 지우기 버튼만 표시한다', () => {
  const searchSource = readSource('../src/components/exercise/SearchBar.vue')

  assert.match(searchSource, /v-if="currentQuery"[^>]*aria-label="검색어 지우기"/)
  assert.match(searchSource, /input::-webkit-search-cancel-button/)
  assert.match(searchSource, /input::-ms-clear/)
})

test('검색창 아래 버튼으로 도시 목록을 처음에는 숨기고 펼치거나 다시 접는다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const storeSource = readSource('../src/stores/homeWeatherStore.js')

  assert.match(storeSource, /const isCityListOpen = ref\(false\)/)
  assert.match(homeSource, /const \{ weatherList, selectedCityId, lastUpdated, isCityListOpen \} = storeToRefs\(homeWeatherStore\)/)
  assert.match(homeSource, /ref="cityListEntry" class="hero-search-stack"/)
  assert.match(homeSource, /class="list-jump-button"[\s\S]*?aria-controls="city-weather-region"[\s\S]*?:aria-expanded="isCityListOpen"[\s\S]*?@click="toggleCityList"/)
  assert.match(homeSource, /<Transition name="city-list" @after-enter="scrollToOpenedCityList">[\s\S]*?<div v-show="isCityListOpen" class="city-list-reveal">/)
  assert.match(homeSource, /id="city-weather-region" class="city-section"/)
  assert.match(homeSource, /const toggleCityList = \(\) => \{[\s\S]*?const shouldOpen = !isCityListOpen\.value[\s\S]*?isCityListOpen\.value = shouldOpen/)
  assert.match(homeSource, /const scrollToOpenedCityList = \(\) => \{[\s\S]*?cityListEntry\.value\?\.scrollIntoView\(\{[\s\S]*behavior: reduceMotion \? 'auto' : 'smooth',[\s\S]*block: 'start'/)
  assert.match(homeSource, /\.hero-search-stack\s*\{[^}]*scroll-margin-top:\s*clamp\(52px, 9svh, 132px\);/s)
  assert.match(homeSource, /\.list-jump-button\s*\{[^}]*position:\s*absolute;[^}]*top:\s*calc\(100% - 10px\);/s)
  assert.match(homeSource, /\.list-jump-button svg\.is-open\s*\{[^}]*transform:\s*rotate\(180deg\);/s)
  assert.match(homeSource, /\.city-list-reveal\s*\{[^}]*--city-list-lift:\s*108px;[^}]*grid-template-rows:\s*1fr;[^}]*margin-top:\s*calc\(0px - var\(--city-list-lift\)\);/s)
  assert.match(homeSource, /\.city-list-enter-from,[\s\S]*?\.city-list-leave-to\s*\{[^}]*grid-template-rows:\s*0fr;[^}]*opacity:\s*0;/s)
  assert.doesNotMatch(homeSource, /scrollToCityList/)
  assert.doesNotMatch(homeSource, /weather-scroll-snap|scroll-snap-/)
})

test('히스토리로 홈에 돌아오면 최근 날씨와 펼친 목록 상태를 cache에서 즉시 복원한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const storeSource = readSource('../src/stores/homeWeatherStore.js')

  assert.match(storeSource, /HOME_WEATHER_CACHE_TTL = 5 \* 60 \* 1000/)
  assert.match(storeSource, /const weatherList = ref\(\[\]\)/)
  assert.match(storeSource, /const selectedCityId = ref\(''\)/)
  assert.match(storeSource, /const isCityListOpen = ref\(false\)/)
  assert.match(storeSource, /const hasFreshWeather = \(now = Date\.now\(\)\)/)
  assert.match(homeSource, /const restoreCachedWeather = \(\) => \{/)
  assert.match(homeSource, /if \(apiReady && homeWeatherStore\.hasFreshWeather\(\)\) \{[\s\S]*restoreCachedWeather\(\)[\s\S]*return/)
  assert.match(homeSource, /homeWeatherStore\.markWeatherLoaded\(\)/)
  assert.match(homeSource, /homeWeatherStore\.clearWeatherData\(\)/)
})

test('도시 목록을 펼친 뒤에도 문서 스크롤로 자연스럽게 위아래를 오간다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const baseSource = readSource('../src/assets/base.css')

  assert.match(homeSource, /\.weather-scene\s*\{[^}]*overflow:\s*clip;/s)
  assert.doesNotMatch(homeSource, /\.weather-scene\s*\{[^}]*overflow:\s*hidden;/s)
  assert.match(baseSource, /html\s*\{[^}]*overflow-x:\s*clip;/s)
  assert.match(baseSource, /body,\s*#app\s*\{[^}]*overflow-x:\s*clip;/s)
})

test('리스트 카드와 Hero 액션을 경계가 옅은 compact·quiet 스타일로 표시한다', () => {
  const appSource = readSource('../src/App.vue')
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const cardSource = readSource('../src/components/exercise/WeatherCard.vue')

  assert.match(appSource, /--floating-nav-clearance:\s*calc\(/)
  assert.match(homeSource, /\.refresh-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(homeSource, /\.hero-detail-button\s*\{[^}]*min-height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(cardSource, /grid-template-columns:\s*52px minmax\(0, 1fr\) auto/)
  assert.match(cardSource, /\.weather-mark\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(cardSource, /transform:\s*translateY\(-4px\) scale\(1\.006\)/)
  assert.doesNotMatch(cardSource, /promote-cue|>상세 정보</)
})

test('Hero 지표는 세로선으로 구분하고 카드와 아이콘에 포인터 플로팅 모션을 적용한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const cardSource = readSource('../src/components/exercise/WeatherCard.vue')
  const detailSource = readSource('../src/views/WeatherDetailView.vue')

  assert.match(homeSource, /\.hero-metrics > div\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(homeSource, /\.hero-metrics > div \+ div::before/)
  assert.match(homeSource, /\.hero-metrics > div:nth-child\(even\)::before/)
  assert.match(cardSource, /\.weather-card-hover-zone:hover \.weather-card:not\(\.is-promoting\)/)
  assert.match(cardSource, /\.weather-card-hover-zone:hover \.weather-card:not\(\.is-promoting\) \.weather-mark/)
  assert.match(detailSource, /\.detail-row:hover \.detail-icon/)
  assert.match(cardSource, /prefers-reduced-motion:\s*no-preference/)
  assert.match(homeSource, /\.weather-hero:not\(\.is-promoting\):hover \.hero-icon/)
  assert.match(detailSource, /\.current-panel:hover \.current-visual/)
})

test('상세 화면은 compact 현재 요약과 단일 행 목록형 상세 패널을 사용한다', () => {
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const routerSource = readSource('../src/router/index.js')
  const location = detailSource.indexOf('class="current-location"')
  const reading = detailSource.indexOf('class="current-reading"')
  const detailsSection = detailSource.indexOf('class="details-section"')
  const hourlyForecast = detailSource.indexOf('<HourlyForecastStrip')
  const dailyForecast = detailSource.indexOf('<DailyForecastList')

  assert.ok(location >= 0 && reading > location)
  assert.ok(detailsSection > reading && hourlyForecast > detailsSection && dailyForecast > hourlyForecast)
  assert.match(routerSource, /meta:\s*\{\s*title:\s*'도시 날씨',\s*layout:\s*'weather-scene'\s*\}/)
  assert.match(detailSource, /\.detail-topbar\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(detailSource, /\.back-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(detailSource, /\.current-panel\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
  assert.match(detailSource, /\.current-content\s*\{[^}]*grid-template-columns:\s*82px minmax\(0, 1fr\) auto;/s)
  assert.match(detailSource, /\.current-visual\s*\{[^}]*width:\s*82px;[^}]*height:\s*82px;/s)
  assert.match(detailSource, /<span>관측 \{\{ observedAt \}\}<\/span>/)
  assert.match(detailSource, /<strong>\{\{ sunriseTime \}\}<\/strong>/)
  assert.match(detailSource, /<strong>\{\{ sunsetTime \}\}<\/strong>/)
  assert.equal((detailSource.match(/class="detail-row(?: detail-row--solar)?"/g) ?? []).length, 6)
  assert.match(detailSource, /<dl class="details-list">/)
  assert.match(detailSource, /<h2 id="forecast-overview-title" class="sr-only">날씨 예보<\/h2>/)
  assert.match(detailSource, /\.details-list\s*\{[^}]*border:\s*1px solid rgba\(255, 255, 255, 0\.22\);[^}]*background:\s*linear-gradient/s)
  assert.match(detailSource, /\.detail-row \+ \.detail-row\s*\{[^}]*border-top:/s)
  assert.match(detailSource, /@media \(max-width: 560px\)[\s\S]*\.current-content\s*\{[^}]*grid-template-columns:\s*60px minmax\(0, 1fr\) auto;/s)
  assert.doesNotMatch(detailSource, /<MetricCard|class="metric-grid"/)

  for (const label of ['체감 온도', '습도', '풍속', '기압', '시정거리', '일출 · 일몰']) {
    assert.match(detailSource, new RegExp(label))
  }
})

test('상세 화면은 현재 날씨와 분리된 3시간·5일 예보 상태와 전용 목록을 제공한다', () => {
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const hourlySource = readSource('../src/components/weather/HourlyForecastStrip.vue')
  const dailySource = readSource('../src/components/weather/DailyForecastList.vue')
  const serviceSource = readSource('../src/services/weatherApi.js')

  assert.match(serviceSource, /data\/2\.5\/forecast/)
  assert.match(serviceSource, /export const mapForecastResponse/)
  assert.match(serviceSource, /hourly:\s*forecastEntries\.slice\(0, FORECAST_ITEM_LIMIT\)/)
  assert.match(serviceSource, /daily:\s*timezoneOffset === null \? \[\] : mapDailyForecast/)
  assert.match(detailSource, /const isForecastLoading = ref/)
  assert.match(detailSource, /const forecastErrorMessage = ref/)
  assert.match(detailSource, /fetchCityWeather\(requestedCity\)/)
  assert.match(detailSource, /fetchCityForecast\(requestedCity\)/)
  assert.match(detailSource, /Promise\.allSettled\(\[currentWeatherRequest, forecastRequest\]\)/)
  assert.match(detailSource, /<section v-if="cityConfig && apiReady" class="forecast-section"/)
  assert.doesNotMatch(detailSource, /<section v-if="cityData" class="forecast-section"/)
  assert.match(detailSource, /<HourlyForecastStrip[^>]*:items="forecastData\.hourly"/)
  assert.match(detailSource, /<DailyForecastList[^>]*:items="forecastData\.daily"/)
  assert.match(hourlySource, /시간대별 날씨/)
  assert.match(hourlySource, /role="region"[^>]*tabindex="0"/)
  assert.match(dailySource, /5일 예보/)
  assert.match(dailySource, /<ol class="daily-list">/)
})

test('소개 화면은 날씨 배경과 메인 계열의 기능 카드·quiet 복귀 링크를 사용한다', () => {
  const routerSource = readSource('../src/router/index.js')
  const aboutSource = readSource('../src/views/WeatherAboutView.vue')

  assert.match(routerSource, /meta:\s*\{\s*title:\s*'서비스 소개',\s*layout:\s*'weather-scene'\s*\}/)
  assert.match(aboutSource, /getWeatherTheme\(null\)/)
  assert.match(aboutSource, /\.about-scene\s*\{[^}]*overflow:\s*clip;[^}]*linear-gradient\(158deg/s)
  assert.match(aboutSource, /\.about-shell\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(aboutSource, /\.feature-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s)
  assert.match(aboutSource, /\.feature-card\s*\{[^}]*border:\s*1px solid rgba\(255, 255, 255, 0\.22\)/s)
  assert.match(aboutSource, /\.home-link\s*\{[^}]*min-height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
})
