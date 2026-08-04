# Weather

OpenWeatherMap의 현재 관측과 5일·3시간 예보 데이터를 날씨와 낮·밤에 따라 달라지는
몰입형 화면으로 보여주는 Vue 애플리케이션입니다. 임의 데이터나 대체 날씨를 만들지
않으며, API 키가 설정된 경우에만 실제 데이터를 요청합니다.

## 화면 구성

- 선택한 도시의 날씨 팔레트가 화면 전체 배경에 반영됩니다.
- 현재 기온과 상태는 카드 경계 없이 날씨 배경 위 중앙 Hero에 표시하고,
  서울·수원·부산·인천·대전·대구·광주·울산·제주·세종의 날씨를 반투명 카드 그리드로
  비교합니다.
- 도시 카드를 선택하면 해당 날씨가 Hero로 이동하며 배경 테마도 함께 전환됩니다.
- 도시 카드와 Hero의 `상세 보기`를 선택하면 Vue Router의 동적 경로
  (`/weather/:cityId`)를 통해 도시별 상세 기상관측 페이지로 이동합니다.
- 화면 하단의 반투명 Navigation Bar가 스크롤 중에도 떠 있으며, 슬라이딩 표시로 날씨
  대시보드와 서비스 소개 화면을 전환합니다.
- 검색창은 Hero 아래에서 하단 Navigation Bar와 여유를 두고 배치하며, 새로고침은 Hero
  우상단의 경계 없는 아이콘 컨트롤로 제공합니다.
- 초성·완성 전 음절·두벌식 영문 입력을 지원하는 도시 검색과 전체 도시 카드 목록을
  제공합니다. 목록은 처음에는 숨기고 검색창 아래 `도시 목록` 버튼으로 부드럽게
  펼치거나 다시 접을 수 있으며, 펼친 뒤에는 일반 문서 스크롤로 메인과 목록을
  자유롭게 오갈 수 있습니다.
- 데이터를 불러오는 동안 회전 로딩 아이콘을 표시하며, 카드와 주요 날씨 아이콘에는
  포인터 hover 플로팅 모션을 제공합니다.
- 슬라이드 방식의 섭씨·화씨 전환은 하단 Navigation Bar에 함께 제공합니다.
- 상세 화면에서는 이미 확인한 현재 날씨를 compact 가로 요약으로 줄이고, 체감온도,
  습도, 기압, 시정거리, 풍속, 일출, 일몰, 관측 시각을 단일 행 목록으로 먼저
  표시합니다. 이어서 앞으로 약 24시간의 3시간 단위 예보와 현지 날짜 기준 5일
  예보를 차례로 제공합니다.
- 로딩, 요청 오류, 검색 결과 없음, 결측값을 실제 데이터와 명확히 구분합니다.
- 390px 모바일 화면부터 데스크톱까지 반응형으로 표시합니다.

## 데이터와 테마

OpenWeatherMap의 Current Weather와 5 Day / 3 Hour Forecast 응답에서 `weather`,
`main.temp`, `main.feels_like`, `main.humidity`, `main.pressure`, `visibility`,
`wind.speed`, `pop`, `rain.3h`, `snow.3h`, `dt`,
`sys.sunrise`, `sys.sunset`, `timezone`을 화면 모델로 매핑합니다. 응답에 값이 없으면
숫자를 만들지 않고 `정보 없음`으로 표시합니다. 일별 예보는 도시의 현지 시차로
날짜를 나눈 뒤 그 날짜에 포함된 3시간별 예상 기온의 최저·최고와 최대 강수확률을
집계합니다.

날씨 상태는 맑음, 구름, 비, 눈, 안개, 뇌우, 중립 범주로 정규화합니다. 관측 시각이
일출 전이거나 일몰 이후이면 실제 날씨 범주는 유지하면서 야간 팔레트를 적용합니다.
테마는 다음 CSS 변수로 화면에 전달됩니다.

- `--hero-start`
- `--hero-end`
- `--weather-accent`
- `--hero-text`
- `--hero-muted`

## 실행 환경

- Node.js 20.19 이상 또는 22.12 이상
- npm
- OpenWeatherMap API Key

## 로컬 실행

```sh
npm ci
cp .env.example .env.local
```

`.env.local`에 실제 키를 입력합니다.

```env
VITE_OPENWEATHER_API_KEY=your_openweathermap_key
```

개발 서버를 실행합니다.

```sh
npm run dev
```

기본 주소는 <http://localhost:3000>입니다. 환경변수를 추가하거나 변경한 경우 개발
서버를 다시 시작해야 합니다. VS Code의 `python.terminal.useEnvFile` 안내는 Python
터미널용이며, Vite는 프로젝트의 `.env.local`을 자체적으로 읽습니다.

## 검증

```sh
npm run check
```

테스트, 정적 검사, 프로덕션 빌드를 순서대로 실행합니다.

## GitHub Pages 배포

1. GitHub 저장소의 `Settings > Secrets and variables > Actions`에서
   `VITE_OPENWEATHER_API_KEY` Repository Secret을 등록합니다.
2. `Settings > Pages > Build and deployment`의 Source를 `GitHub Actions`로 선택합니다.
3. `main` 브랜치에 푸시하거나 `Deploy GitHub Pages` 워크플로를 실행합니다.

배포 주소는 `https://<GitHub계정>.github.io/skala-vue/` 형식입니다. Router가 Hash
History를 사용하므로 상세 주소는 `/#/weather/city_01`처럼 `#` 뒤에 표시됩니다.

`VITE_` 접두사의 값은 최종 브라우저 번들에 포함됩니다. Repository Secret은 키가 Git
기록과 Actions 로그에 직접 남지 않도록 할 뿐, 배포된 브라우저에서 키를 숨기지는
않습니다. 별도 키를 사용하고 OpenWeather 계정에서 일일 호출 한도를 낮게 설정하세요.
이미 노출된 키는 폐기하고 새 키로 교체해야 합니다.

## 공개 전 확인

- API 성공·실패·로딩·빈 결과가 서로 겹치지 않는지 확인
- 검색어와 URL 쿼리 문자열이 함께 유지되는지 확인
- 도시 선택, 상세 이동, 섭씨·화씨 전환을 확인
- 홈, 상세 동적 경로, 404를 각각 새로고침해 확인
- 390px 화면에서 가로 스크롤과 잘린 컨트롤이 없는지 확인
- GitHub Pages의 홈과 Hash 상세 URL을 시크릿 창에서 확인
- Git 기록에 API 키가 없는지 확인
- `npm run check` 통과 확인
