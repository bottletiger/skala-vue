# SKALA Vue 종합 실습

> 4기 판교 · 김기현

## 배포 링크
👉 https://zzl-hyun.github.io/skala-vue/

## 추가한 기능

| 기능 | 구현 내용 |
| --- | --- |
| 실시간 도시 검색 | 검색 즉시 카드 필터링, 쉼표를 이용한 다중 검색 |
| 검색 URL 동기화 | 검색어를 `?q=`에 저장하고 새로고침·URL 공유 시 복원 |
| 다중 기준 정렬 | 이름·기온·체감온도·습도·풍속 정렬 및 오름차순·내림차순 전환 |
| 즐겨찾기 | 도시별 즐겨찾기와 즐겨찾기 전용 필터, 브라우저 재접속 시 복원 |
| 온도 단위 변경 | Pinia를 이용해 전체 화면의 섭씨·화씨를 동시에 변경 |
| 라우팅 기반 모달 | URL이 변경되는 상세 라우트를 대시보드 위 모달로 표시 |
| 모달 스크롤 제어 | 상세 모달이 열리면 배경 스크롤을 잠그고 닫을 때 복원 |
| 7일 예보 | 도시별 최고·최저 기온, 날씨, 강수확률 표시 |
| API 캐싱 | 현재 날씨 목록과 도시별 7일 예보를 각각 1시간 캐싱 |
| 캐시 상태·갱신 | 캐시 사용 여부와 남은 시간을 표시하고 만료 시 자동 또는 버튼으로 갱신 |
| 사용자 도시 추가 | Geocoding 검색으로 원하는 도시를 목록과 즐겨찾기에 추가 |
| 컴포넌트 분리 | 검색·카드·지도·단위 기능을 분리하고 props/emits로 연결 |
| 날씨 지도 | Windy의 기온·강수·구름·기압·바람·레이더·UV 레이어 전환 |
| 예외 처리 | API 로딩·성공·실패 상태와 404 화면 제공 |
| 반응형 UI | 날씨 카드 2열·1열 전환과 모바일 상세 모달 대응 |

## 사용한 라이브러리

| 라이브러리 | 사용 목적 |
| --- | --- |
| `vue` | Composition API와 컴포넌트 기반 화면 구성 |
| `vue-router` | Hash 라우팅, 검색 쿼리, 중첩 라우트 기반 상세 모달 |
| `pinia` | 섭씨·화씨 전역 상태와 온도 변환 함수 관리 |
| `axios` | OpenWeather와 Open-Meteo HTTP 요청 |
| `@nuxt/ui` | 검색창, 셀렉트, 버튼, 배지 등 공통 UI 요소 |
| `tailwindcss` | Nuxt UI 스타일 시스템과 전역 디자인 토큰 |
| `vite` | 개발 서버, 프로덕션 빌드, GitHub Pages 배포 경로 설정 |
| `oxlint`, `eslint`, `prettier` | 코드 검사와 포맷 관리 |

## 외부 API 및 서비스

| 서비스 | 사용 목적 |
| --- | --- |
| OpenWeather Current Weather · Geocoding API | 기본·사용자 추가 도시의 위치 검색과 현재 관측 정보 조회 |
| Open-Meteo Forecast API | 선택 도시의 7일 일별 예보 조회 |
| Windy Embed Map | 대한민국 중심 날씨 지도와 레이어 표시 |
| GitHub Actions · GitHub Pages | `main` 브랜치 자동 빌드 및 배포 |

## 구현 기능

### 1. 현재 날씨 API와 캐싱

- 10개 도시의 현재 날씨를 `Promise.all()`로 병렬 요청했습니다.
- 도시 목록, API 요청, 화면 상태를 각각 별도 파일로 분리했습니다.
- 응답에서 현재 기온뿐 아니라 체감온도, 습도, 풍속, 구름량, 가시거리와 좌표를 보존했습니다.
- 로딩·성공·실패 상태를 화면에 구분해서 표시합니다.
- 현재 날씨 목록은 `localStorage`에 1시간 동안 캐싱하며, 만료되거나 손상된 캐시는 제거한 뒤 다시 요청합니다.
- 캐시 데이터 사용 여부와 다음 갱신까지 남은 시간을 표시하며, 만료 시 자동 갱신하거나 버튼으로 캐시를 우회할 수 있습니다.

관련 코드: [`weatherApi.js`](src/api/weatherApi.js), [`cities.js`](src/data/cities.js), [`weatherParent.vue`](src/components/exercise/weatherParent.vue)

### 2. 검색 상태와 URL 동기화

- 도시 이름을 실시간으로 검색하며 쉼표로 여러 검색어를 입력할 수 있습니다.
- 검색어를 `?q=` 쿼리 스트링과 양방향으로 동기화했습니다.
- 검색 URL을 공유하거나 새로고침해도 동일한 검색 상태가 복원됩니다.
- `watchEffect()`로 검색 반응을 확인하고, `computed()`에서 검색·즐겨찾기·정렬 결과를 한 번에 계산합니다.

관련 코드: [`SearchBar.vue`](src/components/exercise/SearchBar.vue), [`weatherParent.vue`](src/components/exercise/weatherParent.vue)

### 3. 정렬과 즐겨찾기

- 이름, 현재 기온, 체감온도, 습도, 풍속 기준 정렬을 제공합니다.
- 정렬 기준과 오름차순·내림차순 토글을 분리했습니다.
- 도시별 즐겨찾기를 추가하고 즐겨찾기 도시만 따로 볼 수 있습니다.
- 즐겨찾기 ID는 composable에서 관리하고 `localStorage`에 저장합니다.

관련 코드: [`weatherParent.vue`](src/components/exercise/weatherParent.vue), [`weatherCard.vue`](src/components/exercise/weatherCard.vue), [`useFavoriteCities.js`](src/composables/useFavoriteCities.js)

### 4. 전역 온도 단위 변경

- Pinia store에서 섭씨·화씨 상태와 변환 함수를 관리합니다.
- 헤더에서 단위를 변경하면 현재 날씨 카드, 상세 정보, 7일 예보가 함께 갱신됩니다.
- API 원본 데이터는 섭씨로 유지하고 출력 시점에만 변환합니다.

관련 코드: [`configStore.js`](src/stores/configStore.js), [`UnitToggler.vue`](src/components/exercise/UnitToggler.vue)

### 5. 라우팅 기반 상세 모달

- 상세보기를 누르면 URL이 `/weather/:cityId`로 변경되지만 대시보드는 배경에 유지됩니다.
- 중첩 라우트의 named `<RouterView>`에 상세 화면을 렌더링해 라우팅과 모달 UI를 함께 구현했습니다.
- 모달이 열리면 `watch()`로 감지해 배경 스크롤을 잠그고, 닫힐 때 원래 상태로 복구합니다.
- 카드에서 전달받은 직렬화 가능한 데이터가 있으면 재사용하고, 상세 URL로 직접 접근한 경우에는 캐시 또는 API 목록에서 도시를 다시 찾습니다.

관련 코드: [`router/index.js`](src/router/index.js), [`WeatherHomeView.vue`](src/views/WeatherHomeView.vue), [`WeatherDetailView.vue`](src/views/WeatherDetailView.vue)

### 6. 도시별 7일 예보

- 상세 모달이 열렸을 때만 선택한 도시 좌표로 Open-Meteo API를 요청합니다.
- 날짜, 날씨 코드, 최고·최저 기온, 최대 강수확률을 표시합니다.
- `weekly-forecast-{cityId}` 키로 도시별 예보를 1시간 캐싱합니다.
- 빠르게 다른 도시로 이동했을 때 이전 요청 결과가 현재 도시에 표시되지 않도록 요청 도시 ID를 확인합니다.

관련 코드: [`weatherApi.js`](src/api/weatherApi.js), [`WeatherDetailView.vue`](src/views/WeatherDetailView.vue)

### 7. 원하는 도시 직접 추가

- OpenWeather Geocoding API에서 국문·영문 도시 이름으로 최대 5개 후보를 검색합니다.
- 같은 이름의 도시는 지역과 국가 코드를 함께 표시해 구분할 수 있습니다.
- 선택한 후보의 좌표로 현재 날씨를 조회하고 기존 목록에 추가합니다.
- 추가된 도시는 자동으로 즐겨찾기에 포함되며 위치 정보와 날씨 목록을 `localStorage`에 저장합니다.
- 기존 10개 도시를 다시 검색하면 중복 카드를 만들지 않고 기존 카드를 즐겨찾기에 추가합니다.

관련 코드: [`CityAddForm.vue`](src/components/exercise/CityAddForm.vue), [`weatherApi.js`](src/api/weatherApi.js), [`weatherParent.vue`](src/components/exercise/weatherParent.vue)

### 8. 날씨 지도와 예외 화면

- Windy 지도에서 기온, 강수, 구름, 기압, 바람, 레이더, UV 레이어를 전환할 수 있습니다.
- 정의되지 않은 주소는 현재 경로를 표시하는 404 화면으로 연결됩니다.
- 카드 목록은 데스크톱 2열, 작은 화면 1열로 반응형 처리했습니다.

관련 코드: [`WeatherMap.vue`](src/components/exercise/WeatherMap.vue), [`NotFoundView.vue`](src/views/NotFoundView.vue)


## 실행 방법

Node.js `20.19.0` 이상 또는 `22.12.0` 이상이 필요합니다.

```bash
npm install
```

프로젝트 루트에 `.env` 파일을 만들고 OpenWeather API 키를 설정합니다.

```env
VITE_OPENWEATHER_API_KEY=발급받은_API_KEY
```

```bash
npm run dev
```

기본 개발 서버 주소는 `http://localhost:3000`입니다. Open-Meteo 7일 예보는 별도 API 키가 필요하지 않습니다.

## 확인한 항목

```bash
npm run build
npx oxlint src
```

- Vite 프로덕션 빌드 성공
- oxlint 오류 및 경고 0건
- GitHub Actions에서 `main` 브랜치 빌드 후 GitHub Pages 자동 배포

빌드 검증은 완료했으며, 별도의 자동화 테스트 코드는 아직 추가하지 않았습니다.

## Git Flow

| 브랜치 | 용도 |
| --- | --- |
| `main` | 배포 가능한 안정 버전 관리 및 GitHub Pages 자동 배포 |
| `dev` | 기능 통합 및 개발 기준 브랜치 |
| `feat` | 기능 단위 개발 브랜치 |
