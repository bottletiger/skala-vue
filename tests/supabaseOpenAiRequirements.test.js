import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('브라우저 Supabase 클라이언트에는 공개 설정만 사용하고 미설정 import를 허용한다', () => {
  const source = readSource('../src/lib/supabaseClient.js')
  const authSource = readSource('../src/services/authService.js')
  const loginSource = readSource('../src/views/LoginView.vue')
  const deployWorkflow = readSource('../.github/workflows/deploy-pages.yml')

  assert.match(source, /VITE_SUPABASE_URL/)
  assert.match(source, /VITE_SUPABASE_PUBLISHABLE_KEY/)
  assert.match(source, /isSupabaseConfigured/)
  assert.match(source, /SERVICE_NOT_CONFIGURED/)
  assert.doesNotMatch(source, /OPENAI_API_KEY|SERVICE_ROLE/)
  assert.match(authSource, /signInWithOAuth\(providerOrConfig, redirectTo\)/)
  assert.match(authSource, /options:\s*redirectTo \? \{ redirectTo \}/)
  assert.match(authSource, /invalid_credentials:\s*'이메일 또는 비밀번호가 맞지 않습니다\.'/)
  assert.match(authSource, /user_already_exists:\s*'이미 가입된 이메일입니다\.'/)
  assert.doesNotMatch(authSource, /new Error\(error\?\.message \|\| fallbackMessage\)/)
  assert.match(loginSource, /VITE_GOOGLE_AUTH_ENABLED === 'true'/)
  assert.match(loginSource, /<template v-if="isGoogleAuthEnabled">[\s\S]*Google로 계속하기[\s\S]*<\/template>/)
  assert.match(deployWorkflow, /Required Supabase repository variables are missing/)
  assert.match(deployWorkflow, /-z "\$VITE_SUPABASE_URL"/)
  assert.match(deployWorkflow, /-z "\$VITE_SUPABASE_PUBLISHABLE_KEY"/)
})

test('Edge Function은 사용자 JWT를 서버에서 검증한다', () => {
  const authSource = readSource('../supabase/functions/_shared/auth.ts')
  const adviceSource = readSource('../supabase/functions/weather-advice/index.ts')
  const itinerarySource = readSource('../supabase/functions/generate-itinerary/index.ts')

  assert.match(authSource, /client\.auth\.getUser\(accessToken\)/)
  assert.match(adviceSource, /requireAuthenticatedUser\(request\)/)
  assert.match(itinerarySource, /requireAuthenticatedUser\(request\)/)
})

test('OpenAI Responses 요청은 비저장 strict schema와 내장 web search 출처를 사용한다', () => {
  const source = readSource('../supabase/functions/_shared/openai.ts')
  const itinerary = readSource('../supabase/functions/generate-itinerary/index.ts')

  assert.match(source, /store:\s*false/)
  assert.match(source, /type:\s*"json_schema"/)
  assert.match(source, /strict:\s*true/)
  assert.match(source, /type:\s*"web_search"/)
  assert.match(source, /web_search_call\.action\.sources/)
  assert.match(source, /OPENAI_API_KEY/)
  assert.match(source, /OPENAI_API_KEY_SECONDARY/)
  assert.match(source, /BACKUP_OPENAI_API_KEY/)
  assert.match(source, /providerErrorCode\(responseBody\) === "credit_balance_exhausted"/)
  assert.match(source, /OPENAI_MODEL/)
  assert.match(source, /start_index/)
  assert.match(source, /end_index/)
  assert.match(source, /annotations/)
  assert.match(source, /AI_PROVIDER_RATE_LIMITED/)
  assert.match(source, /retryAfterSeconds/)

  const fallbackCodes = itinerary.match(/const FALLBACKABLE_WEB_ERRORS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? ''
  assert.doesNotMatch(fallbackCodes, /AI_PROVIDER_RATE_LIMITED|AI_PROVIDER_ERROR|AI_PROVIDER_UNAVAILABLE|AI_TIMEOUT/)
})

test('여행 일정은 클라이언트 지오코딩 좌표를 요구하고 웹 검색 실패 시 날씨 일정으로 대체한다', () => {
  const source = readSource('../supabase/functions/generate-itinerary/index.ts')

  assert.match(source, /GEOCODED_DESTINATION_REQUIRED/)
  assert.match(source, /destination\.latitude[\s\S]*required:\s*true/)
  assert.match(source, /destination\.longitude[\s\S]*required:\s*true/)
  assert.match(source, /FALLBACKABLE_WEB_ERRORS/)
  assert.match(source, /webGrounded/)
  assert.match(source, /citations:\s*sources/)
  assert.match(source, /sourceUrls/)
  assert.match(source, /allowedSources\.has\(canonical\)/)
  assert.match(source, /sources = usedWebSources/)
  assert.match(source, /webGrounded = sources\.length > 0/)
  assert.match(source, /정확한 전체 URL을 변경하거나 추측하지 말고 그대로 복사/)
  assert.match(source, /historicalClimateReference/)
  assert.match(source, /startYear !== 2001 \|\| endYear !== 2020/)
  assert.match(source, /예보 범위 밖 · 과거 기후 참고/)
  assert.match(source, /Intl\.DateTimeFormat\("en-CA"/)
})

test('여행 데이터는 사용자 RLS로 제한하고 AI 캐시는 service-role 전용으로 격리한다', () => {
  const source = readSource('../supabase/migrations/20260805010000_create_travel_planner.sql')
  const hardening = readSource('../supabase/migrations/20260805012000_harden_ai_generation_cache.sql')
  const cache = readSource('../supabase/functions/_shared/cache.ts')
  const advice = readSource('../supabase/functions/weather-advice/index.ts')
  const itinerary = readSource('../supabase/functions/generate-itinerary/index.ts')

  assert.match(source, /create table public\.trips/)
  assert.match(source, /create table public\.ai_generation_cache/)
  assert.match(source, /alter table public\.trips enable row level security/)
  assert.match(source, /alter table public\.ai_generation_cache enable row level security/)
  assert.match(source, /\(select auth\.uid\(\)\) = user_id/)
  assert.doesNotMatch(source, /Users can (?:read|create|update|delete) their AI cache/)
  assert.match(source, /revoke all on public\.ai_generation_cache from public, anon, authenticated/)
  assert.match(source, /grant select, insert, update, delete on public\.ai_generation_cache to service_role/)
  assert.doesNotMatch(source, /create table public\.profiles/)
  assert.doesNotMatch(source, /saved_destinations/)

  assert.match(hardening, /drop policy if exists "Users can read their AI cache"/)
  assert.match(hardening, /revoke all on public\.ai_generation_cache[\s\S]*from public, anon, authenticated/)
  assert.match(hardening, /grant select, insert, update, delete on public\.ai_generation_cache[\s\S]*to service_role/)
  assert.match(hardening, /truncate table public\.ai_generation_cache/)

  assert.match(cache, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(cache, /createClient\(url, serviceRoleKey/)
  assert.doesNotMatch(cache, /readGenerationCache\(\s*client/)
  assert.doesNotMatch(cache, /writeGenerationCache\(\s*client/)
  assert.doesNotMatch(advice, /readGenerationCache\(\s*client/)
  assert.doesNotMatch(itinerary, /readGenerationCache\(\s*client/)
  assert.match(advice, /cacheUpdatedAt\(cached\.updated_at\)/)
  assert.match(itinerary, /cacheUpdatedAt\(cached\?\.updated_at\)/)
})

test('브라우저 Origin은 명시적 allowlist만 허용하고 미설정 상태에서는 거부한다', () => {
  const cors = readSource('../supabase/functions/_shared/cors.ts')
  const edgeEnv = readSource('../supabase/.env.example')
  const advice = readSource('../supabase/functions/weather-advice/index.ts')
  const itinerary = readSource('../supabase/functions/generate-itinerary/index.ts')

  assert.doesNotMatch(cors, /LOCAL_ORIGINS/)
  assert.match(cors, /Deno\.env\.get\("ALLOWED_ORIGINS"\) \?\? ""/)
  assert.match(cors, /if \(!origin\) return true/)
  assert.match(cors, /return allowed\.has\(origin\)/)
  assert.doesNotMatch(cors, /origin \|\| "\*"/)
  assert.match(edgeEnv, /ALLOWED_ORIGINS=http:\/\/localhost:3000,https:\/\/kngyeol\.github\.io/)

  for (const source of [advice, itinerary]) {
    const originCheck = source.indexOf('assertAllowedOrigin(request)')
    const preflight = source.indexOf('request.method === "OPTIONS"')
    assert.notEqual(originCheck, -1)
    assert.notEqual(preflight, -1)
    assert.ok(originCheck < preflight)
  }
})

test('AI 비용 한도는 직접 수정할 수 없는 원자적 사용자별 RPC로 강제한다', () => {
  const migration = readSource('../supabase/migrations/20260805011000_add_ai_request_limits.sql')
  const quota = readSource('../supabase/functions/_shared/quota.ts')
  const advice = readSource('../supabase/functions/weather-advice/index.ts')
  const itinerary = readSource('../supabase/functions/generate-itinerary/index.ts')

  assert.match(migration, /create table public\.ai_request_limits/)
  assert.match(migration, /primary key \(user_id, generation_kind\)/)
  assert.match(migration, /alter table public\.ai_request_limits enable row level security/)
  assert.match(migration, /security definer/)
  assert.match(migration, /set search_path = ''/)
  assert.match(migration, /on conflict \(user_id, generation_kind\) do update/)
  assert.match(migration, /current_limit\.request_count \+ 1/)
  assert.match(migration, /current_limit\.request_count < v_limit/)
  assert.match(migration, /when 'weather_advice' then 20/)
  assert.match(migration, /when 'travel_itinerary' then 6/)
  assert.match(migration, /revoke all on public\.ai_request_limits from public, anon, authenticated/)
  assert.match(migration, /revoke all on function public\.consume_ai_request_quota\(text\)[\s\S]*from public, anon/)
  assert.match(migration, /grant execute on function public\.consume_ai_request_quota\(text\)[\s\S]*to authenticated/)
  assert.doesNotMatch(migration, /p_user_id|p_request_limit|p_window/)

  assert.match(quota, /client\.rpc\("consume_ai_request_quota"/)
  assert.match(quota, /429,[\s\S]*"AI_RATE_LIMITED"/)
  const adviceQuotaCall = advice.indexOf('await consumeAiQuota(client, "weather_advice")')
  const adviceOpenAiCall = advice.indexOf('await createStructuredResponse')
  assert.notEqual(adviceQuotaCall, -1)
  assert.notEqual(adviceOpenAiCall, -1)
  assert.ok(adviceQuotaCall < adviceOpenAiCall)

  const itineraryQuotaCall = itinerary.indexOf('await consumeAiQuota(client, "travel_itinerary")')
  const itineraryOpenAiCall = itinerary.indexOf('await createStructuredResponse')
  assert.notEqual(itineraryQuotaCall, -1)
  assert.notEqual(itineraryOpenAiCall, -1)
  assert.ok(itineraryQuotaCall < itineraryOpenAiCall)
})
