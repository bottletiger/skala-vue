# Supabase + OpenAI 설정

브라우저에는 Supabase 공개 클라이언트 값만 두고, OpenAI 호출은 인증된 Supabase Edge Function에서만 수행한다. 두 Edge Function 모두 사용자 JWT를 다시 검증하며 OpenAI Responses API 요청에는 `store: false`와 strict JSON Schema를 사용한다.

## 1. Supabase 프로젝트 연결

Supabase 프로젝트를 만든 뒤 Authentication에서 Email 로그인을 켠다. Google 로그인은 선택 기능이다. 사용할 때만 Google provider를 활성화하고 Client Secret은 Supabase provider 설정에만 입력한 뒤 프런트엔드의 `VITE_GOOGLE_AUTH_ENABLED=true`를 함께 설정한다. GitHub Pages를 사용한다면 Authentication URL Configuration에 다음 값을 등록한다.

- Site URL: `https://kngyeol.github.io/skala-vue/`
- Redirect URLs: 실제 Pages 주소와 `http://localhost:3000/**`

Google 로그인을 활성화한 경우 `redirectTo`는 앱이 `${location.origin}${location.pathname}#/trips`처럼 생성해 전달하며, `authService.signInWithOAuth`는 해당 값을 Supabase SDK에 그대로 전달한다. 이 환경 변수가 `true`가 아니면 로그인 화면은 동작하지 않는 Google 버튼을 노출하지 않는다.

프로젝트 루트에서 CLI 설정을 초기화한 뒤 마이그레이션을 적용한다. `supabase/config.toml`이 이미 있으면 `supabase init`은 생략한다. CLI를 전역으로 설치하지 않았다면 아래 `supabase` 명령을 `npx supabase`로 실행한다.

```bash
supabase init
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

마이그레이션은 `trips`와 사용자별 `ai_generation_cache`를 생성한다. `trips`는 RLS를 통해 로그인한 사용자가 자신의 행만 읽고 변경할 수 있다. AI 캐시는 브라우저의 `authenticated` 역할에서도 직접 CRUD할 수 없고 Edge Function의 service-role 클라이언트만 접근한다. 기존 배포에 사용자 작성 캐시가 남지 않도록 hardening migration은 적용 시 캐시를 한 번 비운다. 캐시는 재생성 가능한 데이터이며, 이후 동일한 입력의 날씨 조언은 30분, 여행 일정은 6시간 동안 재사용한다.

캐시에 없는 생성 요청은 DB의 원자적 quota RPC를 먼저 통과한다. 한도는 서버 함수 안에 고정되어 있으며 날씨 조언은 사용자당 시간당 20회, 여행 일정은 시간당 6회다. `ai_request_limits` 테이블은 `anon`과 `authenticated` 역할에서 직접 읽거나 수정할 수 없고, 사용자는 자신의 JWT로 `consume_ai_request_quota`만 호출할 수 있다. 초과 요청은 Edge Function에서 `429 AI_RATE_LIMITED`로 응답한다.

## 2. 프런트엔드 공개 환경 변수

루트의 `.env.example`을 `.env.local`로 복사하고 Supabase 대시보드의 Project URL과 publishable key를 입력한다.

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_GOOGLE_AUTH_ENABLED=false
```

publishable key는 RLS와 함께 브라우저에서 사용하는 공개 값이다. `service_role` 키나 OpenAI 키에는 절대 `VITE_` 접두사를 붙이지 않는다.

설정이 없을 때도 모듈 import와 빌드는 정상 동작한다. 읽기 API는 빈 값 또는 `null`을 반환하고, 로그인·저장·AI 생성처럼 쓰기가 필요한 API는 `code === 'SERVICE_NOT_CONFIGURED'` 오류를 반환한다.

## 3. Edge Function 비밀값과 배포

실제 키를 명령줄 인자로 남기지 않도록 예시 파일을 로컬 파일로 복사한 후 비밀값을 등록한다.

```bash
cp supabase/.env.example supabase/.env.local
supabase secrets set --env-file supabase/.env.local
supabase functions deploy weather-advice
supabase functions deploy generate-itinerary
```

`supabase/.env.local`에는 다음 값을 넣는다. `OPENAI_MODEL`은 Structured Outputs와 Responses API `web_search`를 모두 지원하는 모델이어야 한다.

```dotenv
OPENAI_API_KEY=sk-...
# 선택: OPENAI_API_KEY_SECONDARY=sk-...
OPENAI_MODEL=gpt-5.6
ALLOWED_ORIGINS=http://localhost:3000,https://kngyeol.github.io
```

보조 키는 `OPENAI_API_KEY_SECONDARY`를 우선 사용하고 기존 이름 `BACKUP_OPENAI_API_KEY`도 인식한다. primary 응답의 오류 코드가 정확히 `credit_balance_exhausted`일 때만 동일한 여행 입력을 secondary OpenAI 프로젝트·조직으로 한 번 재전송한다. 일반 429, 인증 실패, timeout, 5xx, 프로젝트·조직 지출 한도 오류에는 보조 키를 사용하지 않으며 세 번째 요청도 보내지 않는다. 두 키가 같으면 전환하지 않는다.

`ALLOWED_ORIGINS`에는 경로 없이 origin만 쉼표로 구분해 입력한다. 값이 비어 있으면 Origin 헤더가 있는 모든 브라우저 요청을 거부한다. localhost도 자동 허용되지 않으므로 개발에 사용할 정확한 origin을 목록에 넣어야 한다. Origin이 없는 서버 간 요청은 허용한다. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 배포된 Edge Function에 Supabase가 제공한다. service-role 키는 캐시에만 사용하며 브라우저 환경 변수나 GitHub secret의 `VITE_` 값으로 넣지 않는다.

로컬 함수 검증이 필요하면 같은 비밀값 파일로 실행한다.

```bash
supabase functions serve --env-file supabase/.env.local
```

## 4. 프런트엔드 서비스 계약

- `src/services/authService.js`: 세션 확인, 이메일 로그인·회원가입·로그아웃, auth 상태 구독
- `src/services/tripsService.js`: 여행 일정 CRUD, 날씨 코디 추천, AI 일정 생성
- `generateItinerary(input)`: `{ itinerary, trip, meta }`
- `getWeatherAdvice(input)`: `{ advice, meta }`

일정 생성 입력은 `destination`, `startDate`, `endDate`, `preferences`, `forecast`, `airQuality`, `places`, 선택적인 `climateReference`를 사용한다. `destination`은 Open-Meteo Geocoding 검색 결과의 위도·경도를 포함해야 하므로 등록 목록에 없는 국가와 도시도 검색해 사용할 수 있다. 모델은 좌표와 날씨를 생성하지 않고 이 입력을 사실 원본으로 사용한다.

`climateReference`는 예보 범위 밖의 미래 날짜에만 사용한다. Edge Function은 NASA POWER 2001–2020 월별 기후 자료와 해당 월만 허용하고, 응답의 날씨 문구 앞에 `예보 범위 밖 · 과거 기후 참고`를 강제로 붙인다. 예보 데이터와 합치거나 특정 날짜의 실제·예측 날씨처럼 표시하면 안 된다.

결과는 `summary`, `days[].blocks.{morning,afternoon,evening}`, `packing`, `weatherNotes`, `travelBrief`, `sources` 구조다. `travelBrief`의 세 목록은 문자열이 아니라 `{ text, sourceUrls[] }` claim 객체를 사용한다. Edge Function은 각 `sourceUrls`를 Responses API의 실제 citation/source URL allowlist와 교차 검증하고 유효한 URL이 하나도 없는 claim을 버린다. `sources`에는 살아남은 claim이 실제 사용한 URL과 기후 참고처럼 실제 입력에 사용한 출처만 들어가며, 가능한 경우 OpenAI annotation 위치도 함께 보존한다. 검증된 claim이 있을 때만 `webGrounded`가 `true`다. 웹 검색이나 출처 확인이 실패하면 `travelBrief`의 세 배열과 웹 출처를 비운 채 기존 날씨·후보 장소 기반 일정으로 한 번 더 생성한다. 장소 추천은 입력으로 전달한 후보의 ID만 일정에 사용할 수 있도록 서버와 응답 검증 양쪽에서 제한한다. 화면에서 웹 정보를 표시할 때 claim의 `sourceUrls` 또는 `sources` 링크를 클릭 가능하게 제공해야 한다.
