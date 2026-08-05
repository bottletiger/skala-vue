# Weather

현재 위치와 세계 주요 도시의 날씨를 확인하고, 여행 날짜의 예보·대기질·주변 장소를 바탕으로 일정을 준비하는 Vue 웹 서비스입니다. 날씨 사실은 전용 데이터 API가 제공하고, OpenAI는 로그인 사용자의 옷차림과 여행 정보를 가공하는 데만 사용합니다.

## 주요 기능

- 현재 위치 및 48개 주요 도시의 현재 날씨
- 지역·도시명 검색이 가능한 세계 날씨 서랍
- 3시간 간격 단기 예보와 5일 도시 상세 예보
- 자유 입력 도시 지오코딩, 최대 16일 여행 예보와 대기질
- 예보 범위를 벗어난 날짜의 NASA POWER 2001–2020 과거 기후 참고
- Wikimedia 주변 장소 후보와 선택형 여행 취향
- OpenAI 웹 검색 출처가 표시되는 최대 14일 여행 일정
- 현재 날씨 기반 AI 옷차림·준비물 추천
- 날씨 상태에 맞는 Spotify 플레이리스트 임베드
- Supabase 이메일 로그인과 사용자별 여행 저장 (Google OAuth 선택 구성)

## 서비스 구조

| 영역           | 사용 서비스            | 역할                                                         |
| -------------- | ---------------------- | ------------------------------------------------------------ |
| 현재·예보 날씨 | Open-Meteo Forecast    | WMO 상태 코드, 기온, 습도, 풍속, 일출·일몰, 시간별·일별 예보 |
| 도시 검색      | Open-Meteo Geocoding   | 자유 입력 도시를 실제 좌표와 국가로 확정                     |
| 대기질         | Open-Meteo Air Quality | AQI, 미세먼지, 초미세먼지, 자외선                            |
| 장기 날짜 참고 | NASA POWER             | 예보가 아닌 2001–2020 월별 기후 참고                         |
| 주변 장소      | Wikimedia API          | 좌표 주변 장소 후보와 원문 링크                              |
| 인증·저장      | Supabase Auth/Postgres | 사용자 세션, 여행 일정, RLS                                  |
| AI 가공        | OpenAI Responses API   | 날씨 조언, 웹 검색 기반 여행 정보, 클릭 가능한 출처          |
| 음악           | Spotify Embed          | 별도 OAuth 없는 플레이리스트 재생·외부 열기                  |

OpenAI 비밀키는 브라우저에 전달하지 않습니다. 인증된 Supabase Edge Function만 Responses API를 호출하며, 웹 검색이 실패해도 날씨와 선택한 장소만 사용하는 일정 생성으로 한 번 대체합니다.

## 화면 경로

- `/#/`: 현재 위치·세계 날씨
- `/#/weather/:cityId`: 도시 상세 날씨, 맞춤 준비, 음악
- `/#/travel`: 여행지 검색과 일정 생성
- `/#/login`: 로그인·회원가입
- `/#/trips`: 로그인 사용자의 저장 일정

Router는 GitHub Pages 새로고침 호환성을 위해 Hash History를 사용합니다.

## 로컬 실행

Node.js 20.19 이상 또는 22.12 이상이 필요합니다.

```sh
npm ci
npm run dev
```

기본 주소는 <http://localhost:3000>입니다. Open-Meteo, NASA POWER, Wikimedia를 사용하는 공개 조회 기능에는 개인 날씨 API 키가 필요하지 않습니다.

로그인·저장·AI 기능을 함께 확인하려면 `.env.example`을 `.env.local`로 복사하고 Supabase의 공개 클라이언트 값만 설정합니다.

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
VITE_GOOGLE_AUTH_ENABLED=false
```

OpenAI 키, Supabase service role key에는 `VITE_` 접두사를 붙이지 않습니다. Edge Function과 데이터베이스 설정은 [Supabase 설정 문서](docs/SUPABASE_SETUP.md)를 따릅니다.

## 검증

```sh
npm run check
```

Node 단위·정적 계약 테스트, Oxlint, ESLint, 프로덕션 빌드를 순서대로 실행합니다. Edge Function은 별도로 다음과 같이 확인할 수 있습니다.

```sh
deno check supabase/functions/weather-advice/index.ts
deno check supabase/functions/generate-itinerary/index.ts
```

## GitHub Pages 배포

1. `Settings > Pages`에서 Source를 `GitHub Actions`로 선택합니다.
2. `Settings > Secrets and variables > Actions > Variables`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 등록합니다. Google provider를 실제로 구성했다면 `VITE_GOOGLE_AUTH_ENABLED=true`도 등록합니다.
3. `main`에 푸시하거나 `Deploy GitHub Pages` 워크플로를 실행합니다.

두 Vite 값은 공개 클라이언트 설정이므로 최종 브라우저 번들에서도 볼 수 있습니다. 보안은 Supabase RLS와 서버 측 사용자 JWT 검증으로 보장하며 비밀키는 Supabase Function secret에만 둡니다.

## 데이터 표시 원칙

- 누락된 날씨 수치를 임의로 만들지 않고 `정보 없음`으로 표시합니다.
- NASA POWER 값은 `과거 기후 참고 · 예보 아님`으로 분리합니다.
- 서버는 좌표·날씨 입력의 형식과 범위를 제한하고, 모델이 새로운 수치를 만들지 않도록 프롬프트와 응답을 검증합니다.
- OpenAI 웹 검색 정보를 표시할 때 실제 응답의 출처를 클릭 가능한 링크로 함께 제공합니다.
- 공개 API의 호출 한도나 장애가 AI 기능까지 연쇄적으로 막지 않도록 각 데이터 요청을 분리합니다.
- 홈은 선택 도시만 먼저 조회하고, 48개 세계 날씨는 서랍을 열 때 불러옵니다. 성공한 실제 응답은 관측 시각과 함께 브라우저에서 30분간 재사용합니다.

## 문서

- [Supabase + OpenAI 배포 설정](docs/SUPABASE_SETUP.md)
- [자연스러운 서비스 UI 플레이북](docs/FRONTEND_DESIGN_PLAYBOOK.md)
- [배경 영상 출처와 라이선스](docs/MEDIA_SOURCES.md)
