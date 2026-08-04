# Weather

OpenWeatherMap의 현재 관측과 5일·3시간 예보 데이터를 날씨와 낮·밤에 따라 달라지는
몰입형 화면으로 보여주는 Vue 애플리케이션입니다. 임의 데이터나 대체 날씨를 만들지
않으며, API 키가 설정된 경우에만 실제 데이터를 요청합니다.

## 화면 구성

- 선택한 도시의 날씨 팔레트가 화면 전체 배경에 반영됩니다.
- 현재 기온과 상태는 카드 경계 없이 날씨 배경 위 중앙 Hero에 표시합니다.
- 세계 날씨 서랍에서는 48개 주요 도시를 지역·검색어로 좁혀 보고, 구분선 기반의
  목록에서 도시를 선택해 해당 날씨와 배경 테마를 메인 화면에 적용할 수 있습니다.
- 도시 목록과 Hero의 `상세 보기`를 선택하면 Vue Router의 동적 경로
  (`/weather/:cityId`)를 통해 도시별 상세 기상관측 페이지로 이동합니다.
- 화면 하단의 투명 Navigation Bar는 스크롤 중에도 떠 있으며 날씨, 로그인 또는
  대시보드, 소개 화면을 전환합니다. 세계 날씨 서랍을 열면 같은 폭·재질의 하나의
  연결된 표면으로 이어집니다.
- 세계 날씨 서랍의 검색 영역은 상단에 고정되고, 도시 목록은 검색 영역 뒤에서
  자연스럽게 블러되며 스크롤됩니다. 스크롤바는 숨기되 목록의 잘림과 움직임으로
  스크롤 가능성을 유지합니다.
- 데이터를 불러오는 동안 회전 로딩 아이콘을 표시하고, 정적인 날씨 아이콘에는
  불필요한 hover 이동을 적용하지 않습니다.
- 슬라이드 방식의 섭씨·화씨 전환은 하단 Navigation Bar에 함께 제공합니다.
- 상세 화면에서는 이미 확인한 현재 날씨와 관측 시각을 compact 가로 요약으로 줄이고,
  체감온도, 습도, 풍속, 기압, 시정거리, 일출·일몰을 데스크톱에서 한 줄짜리 지표로
  먼저 표시합니다. 좁은 화면에서는 3열과 2열로 재배치하고, 이어서 앞으로 약 24시간의
  3시간 단위 예보와 현지 날짜 기준 5일 예보를 제공합니다. 우상단 새로고침으로 현재
  관측과 예보를 함께 갱신합니다.
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

## Mock API와 로그인

하단 내비게이션은 날씨, 계정, 소개의 세 자리로 구성됩니다. 계정 자리는 인증 전에는
로그인, 인증 후에는 대시보드로 바뀝니다. 대시보드는 JWT 로그인이 필요한 보호
경로이며, 로그인 후 한 화면에서 상품과 게시글 API를 탭으로 전환해
조회·등록·수정·삭제할 수 있습니다.

로컬 Mock API는 다음 기능을 제공합니다.

- 상품·게시글 REST CRUD와 검색·필터
- 데이터 초기화와 최대 3초 응답 지연
- JWT 로그인, 사용자 프로필 조회, Bearer Token 보호 API

테스트 계정은 다음과 같습니다.

- 수강생: `student@skala.com` / `1234`
- 관리자: `admin@skala.com` / `admin1234`

Mock 데이터와 JWT는 수업용이며 실제 사용자 계정이나 비밀번호를 사용하면 안 됩니다.

## 로컬 실행

```sh
npm ci
cp .env.example .env.local
```

`.env.local`에 실제 키를 입력합니다.

```env
VITE_OPENWEATHER_API_KEY=your_openweathermap_key
```

Vue와 Mock API 서버를 함께 실행합니다.

```sh
npm run dev:all
```

기본 주소는 Vue <http://localhost:3000>, Mock API
<http://localhost:3001/api>입니다. 날씨 화면만 확인할 때는 `npm run dev`를 사용할
수 있지만 로그인과 대시보드 기능에는 `npm run dev:all`이 필요합니다. 환경변수를
추가하거나 변경한 경우 개발 서버를 다시 시작해야 합니다. VS Code의
`python.terminal.useEnvFile` 안내는 Python 터미널용이며, Vite는 프로젝트의
`.env.local`을 자체적으로 읽습니다.

## 검증

```sh
npm run check
```

테스트, 정적 검사, 프로덕션 빌드를 순서대로 실행합니다.

## GitHub Pages 배포

GitHub Pages는 정적 호스팅이므로 로컬 Node Mock API를 실행하지 않습니다. 따라서
배포된 페이지에서 로그인·상품·게시글 기능을 사용하려면 별도로 배포한 API 주소를
`VITE_API_BASE_URL`에 설정해야 합니다. 아래 절차는 날씨 화면의 정적 배포 기준입니다.

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
