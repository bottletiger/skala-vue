import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
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

test('화면별 동적 문서 제목은 공통 composable을 통해 기존 문구를 유지한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const titleSource = readSource('../src/composables/useDocumentTitle.js')

  assert.match(homeSource, /useDocumentTitle\(\(\) => \(selectedWeather\.value \? `\$\{selectedWeather\.value\.name\} 현재 날씨` : '오늘의 날씨'\)\)/)
  assert.match(detailSource, /useDocumentTitle\(\(\) => \{[\s\S]*`\$\{cityName\} 상세 날씨`[\s\S]*'도시 날씨'/)
  assert.match(titleSource, /document\.title = pageTitle \? `\$\{pageTitle\} \| Weather` : 'Weather'/)
})

test('이전 컴포넌트 과제의 BaseDashboardCard slot을 세계 날씨 서랍 검색과 목록에 유지한다', () => {
  const baseCardSource = readSource('../src/components/exercise/BaseDashboardCard.vue')
  const drawerSource = readSource('../src/components/weather/WorldWeatherDrawer.vue')
  const searchSource = readSource('../src/components/exercise/SearchBar.vue')
  const weatherCardSource = readSource('../src/components/exercise/WeatherCard.vue')

  assert.match(baseCardSource, /<slot\s*\/>/)
  assert.equal((drawerSource.match(/<BaseDashboardCard/g) ?? []).length, 2)
  assert.match(baseCardSource, /:deep\(\.dashboard-surface\)/)
  assert.match(baseCardSource, /dashboard-surface--search/)
  assert.match(baseCardSource, /dashboard-surface--weather/)
  assert.match(baseCardSource, /dashboard-surface--state/)
  assert.match(searchSource, /class="input-row dashboard-surface dashboard-surface--search"/)
  assert.match(weatherCardSource, /class="weather-card dashboard-surface dashboard-surface--weather"/)
  assert.equal((drawerSource.match(/dashboard-surface--state/g) ?? []).length, 3)
})

test('메인과 도시 카드의 온도 아래에 테두리 없는 선형 상태 표시를 사용한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const cardSource = readSource('../src/components/exercise/WeatherCard.vue')
  const conditionSource = readSource('../src/components/weather/TemperatureConditionLabel.vue')

  assert.match(homeSource, /<TemperatureConditionLabel[^>]*:temperature="heroWeather\.temp"/)
  assert.match(cardSource, /<TemperatureConditionLabel[^>]*:temperature="cityItem\.temp"/)
  assert.match(conditionSource, /condition\.key === 'hot'/)
  assert.match(conditionSource, /\{\{ condition\.label \}\}/)
  assert.match(conditionSource, /\.temperature-condition\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.doesNotMatch(conditionSource, /🔥|❄️/)
})

test('세계 도시 선택 토스트와 지역·검색 필터를 조용한 피드백으로 제공한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const drawerSource = readSource('../src/components/weather/WorldWeatherDrawer.vue')
  const mainCssSource = readSource('../src/assets/main.css')

  assert.match(homeSource, /const showCitySelectionMessage = \(city\) => \{[\s\S]*message: `\$\{city\.name\}이 선택되었습니다\.`[\s\S]*duration: 1500[\s\S]*customClass: 'weather-selection-message'/)
  assert.match(homeSource, /const handleSelect = async \(city\) => \{[\s\S]*if \(city\.id === selectedCityId\.value\) return[\s\S]*showCitySelectionMessage\(city\)/)
  assert.match(homeSource, /matchesSearchQuery\(\[item\.name, item\.displayName, item\.countryName, item\.countryCode\]/)
  assert.match(drawerSource, /class="region-filters"[\s\S]*aria-pressed="activeRegion === region\.id"/)
  assert.match(mainCssSource, /\.el-message\.weather-selection-message\s*\{[^}]*border-radius:\s*999px;[^}]*backdrop-filter:\s*blur\(20px\) saturate\(125%\);/s)
})

test('과제용 watch와 watchEffect 콘솔 기록은 개발 모드에서만 실행한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const devBlockStart = homeSource.indexOf('if (import.meta.env.DEV)')
  const devBlock = homeSource.slice(devBlockStart, homeSource.indexOf('</script>'))

  assert.match(homeSource, /import \{[^}]*watchEffect[^}]*\} from 'vue'/)
  assert.ok(devBlockStart >= 0)
  assert.match(devBlock, /watch\(selectedCityInfo,[\s\S]*console\.log\(`\[watch\] 선택 상태 변경:/)
  assert.match(devBlock, /watchEffect\(\(\) => \{[\s\S]*console\.log\(`\[watchEffect\] 검색어 변경: \$\{searchQuery\.value\}`\)/)
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

test('Navigation Bar는 모든 탭에서 온도 전환을 유지하고 모바일 Lab 화면을 전체 폭으로 표시한다', () => {
  const appSource = readSource('../src/App.vue')

  assert.match(appSource, /<UnitToggler\s*\/>/)
  assert.doesNotMatch(appSource, /UnitToggler v-if|app-navigation--without-unit/)
  assert.match(appSource, /\.page-container:not\(\.page-container--weather\):not\(\.page-container--lab\)/)
})

test('Hero는 배경 중앙에 직접 표시하고 메인 검색을 제거한 채 새로고침을 유지한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const drawerSource = readSource('../src/components/weather/WorldWeatherDrawer.vue')
  const heroStart = homeSource.indexOf('ref="weatherHero"')
  const heroEnd = homeSource.indexOf('</section>', heroStart)
  const refreshButton = homeSource.indexOf('class="refresh-button"', heroStart)

  assert.ok(heroStart >= 0 && refreshButton > heroStart && refreshButton < heroEnd)
  assert.doesNotMatch(homeSource, /hero-search|list-jump-button|<SearchBar/)
  assert.match(drawerSource, /<SearchBar :current-query="currentQuery"/)
  assert.match(homeSource, /\.hero-face,\s*\.hero-placeholder\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
})

test('Hero 날씨 묶음은 검색 제거 후 화면 중앙에 배치한다', () => {
  const appSource = readSource('../src/App.vue')
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const indexSource = readSource('../index.html')

  assert.match(homeSource, /class="hero-weather-lockup"/)
  assert.match(homeSource, /\.hero-stage\s*\{[^}]*min-height:\s*100svh;[^}]*place-items:\s*center;[^}]*padding:[^;]*var\(--floating-nav-height/s)
  assert.doesNotMatch(homeSource, /grid-template-rows:\s*minmax\(min-content, 1fr\) auto/)
  assert.match(appSource, /--world-drawer-height:/)
  assert.match(appSource, /\.app-navigation--weather\s*\{\s*background:\s*rgba\(246, 249, 248, 0\.34\);/s)
  assert.match(indexSource, /viewport-fit=cover/)
})

test('도시 목록 제목과 개수를 숨기고 구체적인 날씨 설명을 한 번만 표시한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const cardSource = readSource('../src/components/exercise/WeatherCard.vue')
  const currentSummarySource = readSource('../src/components/weather/CurrentWeatherSummary.vue')

  assert.doesNotMatch(homeSource, /city-section-heading|>다른 도시</)
  assert.match(homeSource, /heroWeather\.status \|\| heroTheme\.label/)
  assert.match(cardSource, /cityItem\.status \|\| weatherTheme\.label/)
  assert.match(currentSummarySource, /weather\.status \|\| theme\.label/)
  assert.doesNotMatch(currentSummarySource, /<span>\{\{ theme\.label \}\}<\/span>/)
})

test('로딩 중 회전 아이콘을 표시하고 Hero를 도시·국가·날씨 묶음 순서로 표시한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const spinnerSource = readSource('../src/components/weather/LoadingSpinner.vue')
  const locationStart = homeSource.indexOf('class="hero-location"')
  const cityName = homeSource.indexOf('id="weather-hero-title"', locationStart)
  const countryName = homeSource.indexOf('class="hero-country-line"', locationStart)
  const weatherLockup = homeSource.indexOf('class="hero-weather-lockup"', locationStart)
  const condition = homeSource.indexOf('class="hero-condition-summary"', weatherLockup)
  const temperature = homeSource.indexOf('class="hero-temperature"', weatherLockup)
  const weatherIcon = homeSource.indexOf('class="hero-icon"', weatherLockup)

  assert.match(homeSource, /<LoadingSpinner v-if="heroState === 'loading'"/)
  assert.match(detailSource, /<LoadingSpinner class="detail-loading-spinner"/)
  assert.match(spinnerSource, /@keyframes loading-spin/)
  assert.match(spinnerSource, /animation:\s*loading-spin 820ms linear infinite/)
  assert.ok(cityName >= 0 && countryName > cityName && weatherLockup > countryName)
  assert.ok(condition > weatherLockup && temperature > condition && weatherIcon > temperature)
  assert.match(homeSource, /font-size:\s*clamp\(58px, 10\.5vw, 112px\)/)
  assert.match(homeSource, /grid-template-columns:\s*auto auto auto/)
})

test('세계 도시 카드는 검색·지역 필터 결과를 가로 레일에 모두 표시한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const drawerSource = readSource('../src/components/weather/WorldWeatherDrawer.vue')

  assert.match(homeSource, /activeRegion\.value === 'all' \|\| item\.region === activeRegion\.value/)
  assert.match(drawerSource, /v-for="item in items"/)
  assert.match(drawerSource, /scroll-snap-type:\s*x mandatory/)
  assert.doesNotMatch(homeSource, /INITIAL_VISIBLE_CITY_COUNT|otherWeatherList|weather-list/)
})

test('검색창은 기본 취소 아이콘을 숨기고 사용자 정의 지우기 버튼만 표시한다', () => {
  const searchSource = readSource('../src/components/exercise/SearchBar.vue')

  assert.match(searchSource, /v-if="currentQuery"[^>]*aria-label="검색어 지우기"/)
  assert.match(searchSource, /input::-webkit-search-cancel-button/)
  assert.match(searchSource, /input::-ms-clear/)
})

test('내비게이션 손잡이가 세계 날씨 서랍과 함께 올라가 열린 영역 맨 위에 머문다', () => {
  const appSource = readSource('../src/App.vue')
  const drawerSource = readSource('../src/components/weather/WorldWeatherDrawer.vue')
  const dashboardSource = readSource('../src/composables/useHomeWeatherDashboard.js')
  const storeSource = readSource('../src/stores/homeWeatherStore.js')

  assert.match(storeSource, /const isWorldDrawerOpen = ref\(false\)/)
  assert.match(dashboardSource, /const \{ weatherList, selectedCityId, lastUpdated, isWorldDrawerOpen \} = storeToRefs\(homeWeatherStore\)/)
  assert.match(appSource, /class="world-drawer-handle"[\s\S]*aria-controls="world-weather-drawer"[\s\S]*:aria-expanded="isWorldDrawerOpen"/)
  assert.match(appSource, /\.app-navigation\.is-world-drawer-open \.world-drawer-handle\s*\{[^}]*transform:\s*translate\(-50%, calc\(-50% - var\(--world-drawer-height\) - var\(--world-drawer-gap\)\)\);/s)
  assert.match(drawerSource, /id="world-weather-drawer" class="world-weather-drawer"/)
  assert.match(drawerSource, /\.world-weather-drawer\s*\{[^}]*position:\s*absolute;[^}]*bottom:\s*var\(--world-drawer-bottom\);[^}]*height:\s*var\(--world-drawer-height\);/s)
})

test('검색과 지역 필터는 메인이 아니라 세계 날씨 서랍 안에만 배치한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const drawerSource = readSource('../src/components/weather/WorldWeatherDrawer.vue')

  assert.doesNotMatch(homeSource, /<SearchBar|class="region-filters"/)
  assert.match(homeSource, /<WorldWeatherDrawer/)
  assert.match(drawerSource, /<SearchBar/)
  assert.match(drawerSource, /class="region-filters"/)
})

test('히스토리로 홈에 돌아오면 최근 날씨와 세계 서랍 상태를 cache에서 즉시 복원한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const dashboardSource = readSource('../src/composables/useHomeWeatherDashboard.js')
  const locationSource = readSource('../src/composables/useCurrentLocationWeather.js')
  const storeSource = readSource('../src/stores/homeWeatherStore.js')

  assert.match(storeSource, /HOME_WEATHER_CACHE_TTL = 5 \* 60 \* 1000/)
  assert.match(storeSource, /const weatherList = ref\(\[\]\)/)
  assert.match(storeSource, /const selectedCityId = ref\(''\)/)
  assert.match(storeSource, /const isWorldDrawerOpen = ref\(false\)/)
  assert.match(storeSource, /const hasFreshWeather = \(now = Date\.now\(\)\)/)
  assert.match(homeSource, /useHomeWeatherDashboard\(getRouteSelectedCityId\)/)
  assert.match(homeSource, /startLocationExperience\(\)/)
  assert.match(locationSource, /weatherInitialization = Promise\.resolve\(initializeWeather\(\)\)/)
  assert.match(dashboardSource, /const restoreCachedWeather = \(\) => \{/)
  assert.match(dashboardSource, /if \(apiReady && homeWeatherStore\.hasFreshWeather\(\)\) \{[\s\S]*restoreCachedWeather\(\)[\s\S]*return/)
  assert.match(dashboardSource, /homeWeatherStore\.markWeatherLoaded\(\)/)
  assert.match(dashboardSource, /homeWeatherStore\.clearWeatherData\(\)/)
})

test('날씨별 배경 영상은 테마 전환을 유지하며 저용량 로컬 루프로 제공한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const videoSource = readSource('../src/components/weather/WeatherBackgroundVideo.vue')
  const videoFiles = ['clear.mp4', 'clouds.mp4', 'rain.mp4', 'snow.mp4', 'night.mp4']

  assert.match(homeSource, /<WeatherBackgroundVideo :category="heroTheme\.category" :theme-name="heroTheme\.name"/)
  assert.match(videoSource, /mist:\s*'clouds\.mp4'/)
  assert.match(videoSource, /thunderstorm:\s*'rain\.mp4'/)
  assert.match(videoSource, /props\.themeName === 'night' \? 'night' : props\.category/)
  assert.match(videoSource, /autoplay[\s\S]*loop[\s\S]*muted[\s\S]*playsinline/)
  assert.match(videoSource, /prefers-reduced-motion: reduce/)
  assert.match(videoSource, /networkConnection\?\.saveData/)

  const totalVideoBytes = videoFiles.reduce((sum, fileName) => {
    const filePath = `${projectRoot}public/weather-videos/${fileName}`
    assert.equal(existsSync(filePath), true)
    return sum + statSync(filePath).size
  }, 0)

  assert.ok(totalVideoBytes < 4 * 1024 * 1024)
})

test('현재 위치 진입 흐름은 서비스·composable·사이트 안내창으로 분리한다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const locationSource = readSource('../src/composables/useCurrentLocationWeather.js')
  const dialogSource = readSource('../src/components/weather/LocationPermissionDialog.vue')

  assert.match(homeSource, /useCurrentLocationWeather\(\{/)
  assert.match(homeSource, /<LocationPermissionDialog/)
  assert.doesNotMatch(homeSource, /navigator\.geolocation|getCurrentPosition/)
  assert.match(locationSource, /getGeolocationPermissionState/)
  assert.match(locationSource, /requestCurrentCoordinates/)
  assert.match(dialogSource, /지금 있는 곳의 날씨부터 볼까요/)
})

test('세계 날씨 서랍은 내부 스크롤을 사용하고 열린 동안 배경 스크롤을 잠근다', () => {
  const homeSource = readSource('../src/views/WeatherHomeView.vue')
  const drawerSource = readSource('../src/components/weather/WorldWeatherDrawer.vue')

  assert.match(homeSource, /\.weather-scene\s*\{[^}]*overflow:\s*clip;/s)
  assert.match(drawerSource, /:global\(html\.world-drawer-open body\)[\s\S]*overflow:\s*hidden;/)
  assert.match(drawerSource, /\.world-weather-drawer\s*\{[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/s)
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
  const detailsListSource = readSource('../src/components/weather/WeatherDetailsList.vue')

  assert.match(homeSource, /\.hero-metrics > div\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(homeSource, /\.hero-metrics > div \+ div::before/)
  assert.match(homeSource, /\.hero-metrics > div:nth-child\(even\)::before/)
  assert.match(cardSource, /\.weather-card-hover-zone:hover \.weather-card:not\(\.is-promoting\)/)
  assert.match(cardSource, /\.weather-card-hover-zone:hover \.weather-card:not\(\.is-promoting\) \.weather-mark/)
  assert.match(detailsListSource, /\.detail-row:hover \.detail-icon/)
  assert.match(cardSource, /prefers-reduced-motion:\s*no-preference/)
  assert.match(homeSource, /\.weather-hero:not\(\.is-promoting\):hover \.hero-icon/)
  assert.match(detailSource, /\.current-panel:hover :deep\(\.current-visual\)/)
})

test('상세 화면은 compact 현재 요약과 단일 행 목록형 상세 패널을 사용한다', () => {
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const currentSummarySource = readSource('../src/components/weather/CurrentWeatherSummary.vue')
  const detailsListSource = readSource('../src/components/weather/WeatherDetailsList.vue')
  const routerSource = readSource('../src/router/index.js')
  const currentSummary = detailSource.indexOf('<CurrentWeatherSummary')
  const detailsSection = detailSource.indexOf('<WeatherDetailsList')
  const hourlyForecast = detailSource.indexOf('<HourlyForecastStrip')
  const dailyForecast = detailSource.indexOf('<DailyForecastList')

  assert.ok(currentSummary >= 0 && detailsSection > currentSummary && hourlyForecast > detailsSection && dailyForecast > hourlyForecast)
  assert.match(routerSource, /meta:\s*\{\s*title:\s*'도시 날씨',\s*layout:\s*'weather-scene'\s*\}/)
  assert.match(detailSource, /\.detail-topbar\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(detailSource, /\.back-button,\s*\.detail-refresh-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(detailSource, /\.current-panel\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s)
  assert.match(currentSummarySource, /\.current-content\s*\{[^}]*grid-template-columns:\s*82px minmax\(0, 1fr\) auto;/s)
  assert.match(currentSummarySource, /\.current-visual\s*\{[^}]*width:\s*82px;[^}]*height:\s*82px;/s)
  assert.match(currentSummarySource, /<span>관측 \{\{ observedAt \}\}<\/span>/)
  assert.match(detailsListSource, /<strong>\{\{ sunriseTime \}\}<\/strong>/)
  assert.match(detailsListSource, /<strong>\{\{ sunsetTime \}\}<\/strong>/)
  assert.equal((detailsListSource.match(/class="detail-row(?: detail-row--solar)?"/g) ?? []).length, 6)
  assert.match(detailsListSource, /<dl class="details-list">/)
  assert.match(detailSource, /<h2 id="forecast-overview-title" class="sr-only">날씨 예보<\/h2>/)
  assert.match(detailsListSource, /\.details-list\s*\{[^}]*border:\s*1px solid rgba\(255, 255, 255, 0\.22\);[^}]*background:\s*linear-gradient/s)
  assert.match(detailsListSource, /\.detail-row \+ \.detail-row\s*\{[^}]*border-top:/s)
  assert.match(currentSummarySource, /@media \(max-width: 560px\)[\s\S]*\.current-content\s*\{[^}]*grid-template-columns:\s*60px minmax\(0, 1fr\) auto;/s)
  assert.doesNotMatch(detailSource, /<MetricCard|class="metric-grid"/)
  assert.equal(existsSync(`${projectRoot}src/components/weather/MetricCard.vue`), false)

  for (const label of ['체감 온도', '습도', '풍속', '기압', '시정거리', '일출 · 일몰']) {
    assert.match(detailsListSource, new RegExp(label))
  }
})

test('상세 화면은 현재 날씨와 분리된 3시간·5일 예보 상태와 전용 목록을 제공한다', () => {
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const hourlySource = readSource('../src/components/weather/HourlyForecastStrip.vue')
  const dailySource = readSource('../src/components/weather/DailyForecastList.vue')
  const detailWeatherSource = readSource('../src/composables/useCityWeatherDetail.js')
  const serviceSource = readSource('../src/services/weatherApi.js')

  assert.match(serviceSource, /data\/2\.5\/forecast/)
  assert.match(serviceSource, /export const mapForecastResponse/)
  assert.match(serviceSource, /hourly:\s*forecastEntries\.slice\(0, FORECAST_ITEM_LIMIT\)/)
  assert.match(serviceSource, /daily:\s*timezoneOffset === null \? \[\] : mapDailyForecast/)
  assert.match(detailSource, /useCityWeatherDetail\(cityId, redirectUnknownCity\)/)
  assert.match(detailWeatherSource, /const isForecastLoading = ref/)
  assert.match(detailWeatherSource, /const forecastErrorMessage = ref/)
  assert.match(detailWeatherSource, /fetchCityWeather\(city\)/)
  assert.match(detailWeatherSource, /fetchCityForecast\(city\)/)
  assert.match(detailWeatherSource, /Promise\.allSettled\(\[currentWeatherRequest, forecastRequest\]\)/)
  assert.match(detailSource, /<section v-if="cityConfig && apiReady" class="forecast-section"/)
  assert.doesNotMatch(detailSource, /<section v-if="cityData" class="forecast-section"/)
  assert.match(detailSource, /<HourlyForecastStrip[^>]*:items="forecastData\.hourly"/)
  assert.match(detailSource, /<DailyForecastList[^>]*:items="forecastData\.daily"/)
  assert.match(hourlySource, /시간대별 날씨/)
  assert.match(hourlySource, /role="region"[^>]*tabindex="0"/)
  assert.match(dailySource, /5일 예보/)
  assert.match(dailySource, /<ol class="daily-list">/)
})

test('상세 화면 우상단에서 현재 날씨와 예보를 함께 새로고침한다', () => {
  const detailSource = readSource('../src/views/WeatherDetailView.vue')
  const detailWeatherSource = readSource('../src/composables/useCityWeatherDetail.js')
  const titleStart = detailSource.indexOf('class="topbar-title"')
  const refreshButton = detailSource.indexOf('class="detail-refresh-button"')

  assert.ok(titleStart >= 0 && refreshButton > titleStart)
  assert.match(detailSource, /const isRefreshing = computed\(\(\) => isLoading\.value \|\| isForecastLoading\.value\)/)
  assert.match(detailSource, /class="detail-refresh-button"[\s\S]*?:disabled="!cityConfig \|\| !apiReady \|\| isRefreshing"[\s\S]*?@click="refreshDetail"/)
  assert.match(detailSource, /\.detail-topbar\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\) auto;/s)
  assert.match(detailSource, /\.detail-refresh-button svg\.is-spinning\s*\{[^}]*animation:\s*detail-refresh-spin 900ms linear infinite;/s)
  assert.match(detailWeatherSource, /const refreshDetail = \(\) => loadDetail\(cityConfig\.value\)/)
  assert.match(detailWeatherSource, /isLoading,\s*refreshDetail,\s*weatherTheme/)
})

test('소개 화면은 실제 제공 범위·예보 기준·기술 구성을 구체적으로 안내한다', () => {
  const routerSource = readSource('../src/router/index.js')
  const aboutSource = readSource('../src/views/WeatherAboutView.vue')

  assert.match(routerSource, /meta:\s*\{\s*title:\s*'서비스 소개',\s*layout:\s*'weather-scene'\s*\}/)
  assert.match(aboutSource, /useSharedWeatherTheme\(\)/)
  assert.match(aboutSource, /:data-theme="aboutTheme\.name"/)
  assert.match(aboutSource, /\.about-scene\s*\{[^}]*overflow:\s*clip;[^}]*linear-gradient\(158deg/s)
  assert.match(aboutSource, /\.about-shell\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
  assert.match(aboutSource, /<ul class="feature-list">[\s\S]*v-for="feature in features"[\s\S]*class="feature-row"/)
  assert.match(aboutSource, /\.feature-list\s*\{[^}]*border:\s*1px solid rgba\(255, 255, 255, 0\.22\);[^}]*backdrop-filter:\s*blur\(14px\) saturate\(108%\);/s)
  assert.match(aboutSource, /\.feature-row\s*\{[^}]*min-height:\s*72px;/s)
  assert.match(aboutSource, /\.feature-row \+ \.feature-row\s*\{[^}]*border-top:/s)
  assert.doesNotMatch(aboutSource, /feature-grid|feature-card|features\.slice/)
  assert.match(aboutSource, /대한민국 10개 도시/)
  assert.match(aboutSource, /초성, 완성 전 음절과 두벌식 영문 오타/)
  assert.match(aboutSource, /3시간 간격의 기온·날씨·강수확률/)
  assert.match(aboutSource, /Current Weather<br \/>5 Day \/ 3 Hour Forecast/)
  assert.match(aboutSource, /const technologyStack = \['Vue 3', 'Vue Router', 'Pinia', 'Axios', 'Element Plus'\]/)
  assert.match(aboutSource, /\.service-facts\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/s)
  assert.match(aboutSource, /\.data-panel\s*\{[^}]*grid-template-columns:\s*minmax\(240px, 0\.78fr\) minmax\(0, 1\.35fr\);/s)
  assert.match(aboutSource, /\.home-link\s*\{[^}]*min-height:\s*44px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s)
})
