import { getSupabaseClient, isSupabaseConfigured, requireSupabaseClient, ServiceNotConfiguredError } from '@/lib/supabaseClient.js'

function serviceError(error, fallbackMessage) {
  if (error instanceof ServiceNotConfiguredError) return error

  const status = Number(error?.status || error?.context?.status) || null
  const code = error?.code || 'TRIPS_SERVICE_ERROR'
  let message = fallbackMessage

  if (code === 'AUTH_REQUIRED' || status === 401) {
    message = '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  } else if (code === 'INVALID_TRIP_INPUT') {
    message = '여행지와 날짜 정보를 다시 확인해 주세요.'
  } else if (code === 'AI_RATE_LIMITED') {
    message = '이번 시간대의 AI 추천 생성 횟수를 모두 사용했습니다. 잠시 후 다시 시도해 주세요.'
  } else if (code === 'AI_PROVIDER_RATE_LIMITED' || status === 429) {
    message = 'AI 요청이 잠시 많습니다. 잠시 후 다시 시도해 주세요.'
  } else if (status === 403) {
    message = '이 여행 정보를 변경할 권한이 없습니다.'
  } else if (status && status >= 500) {
    message = '여행 서비스가 잠시 불안정합니다. 잠시 후 다시 시도해 주세요.'
  }

  const normalized = new Error(message)
  normalized.name = 'TripsServiceError'
  normalized.code = code
  normalized.status = status
  return normalized
}

async function requireUser(client) {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    const authError = new Error('로그인이 필요합니다.')
    authError.code = 'AUTH_REQUIRED'
    authError.status = 401
    throw authError
  }
  return data.user
}

function destinationFromInput(input = {}) {
  const destination = typeof input.destination === 'object' && input.destination ? input.destination : input
  const name = String(destination.name || destination.displayName || destination.cityName || destination.city || '').trim()
  const rawId = destination.id ?? destination.destinationId ?? destination.slug ?? name
  const latitude = Number(destination.latitude ?? destination.lat)
  const longitude = Number(destination.longitude ?? destination.lon ?? destination.lng)

  if (!name || rawId === '' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    const error = new Error('여행지 이름과 좌표가 필요합니다.')
    error.code = 'INVALID_TRIP_INPUT'
    throw error
  }

  return {
    id: String(rawId),
    name,
    countryName: String(destination.countryName || destination.country || '').trim() || null,
    countryCode: String(destination.countryCode || destination.country_code || '').toUpperCase() || null,
    latitude,
    longitude,
    timezone: String(destination.timezone || destination.timeZone || '').trim() || null,
  }
}

function mapTrip(row) {
  if (!row) return null

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    destination: {
      id: row.destination_id,
      name: row.destination_name,
      countryName: row.country_name,
      countryCode: row.country_code,
      latitude: row.latitude,
      longitude: row.longitude,
      timezone: row.timezone,
    },
    startDate: row.start_date,
    endDate: row.end_date,
    preferences: row.preferences || {},
    weatherSnapshot: row.weather_snapshot || {},
    airQualitySnapshot: row.air_quality_snapshot || {},
    places: row.attraction_candidates || [],
    itinerary: row.ai_itinerary,
    itineraryGeneratedAt: row.ai_itinerary_generated_at,
    weatherAdvice: row.ai_weather_advice,
    weatherAdviceGeneratedAt: row.ai_weather_advice_generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function snapshot(value, key) {
  if (value === undefined || value === null) return key === 'daily' ? { daily: [] } : {}
  if (Array.isArray(value) && key) return { [key]: value }
  return value
}

function createTripRow(input, userId) {
  const destination = destinationFromInput(input)
  const itinerary = input.itinerary ?? input.aiItinerary ?? null
  const weatherAdvice = input.weatherAdvice ?? input.aiWeatherAdvice ?? null
  const now = new Date().toISOString()

  return {
    user_id: userId,
    title: String(input.title || `${destination.name} 여행`)
      .trim()
      .slice(0, 80),
    destination_id: destination.id.slice(0, 160),
    destination_name: destination.name.slice(0, 120),
    country_name: destination.countryName?.slice(0, 120) || null,
    country_code: destination.countryCode,
    latitude: destination.latitude,
    longitude: destination.longitude,
    timezone: destination.timezone,
    start_date: input.startDate,
    end_date: input.endDate,
    preferences: input.preferences || {},
    weather_snapshot: snapshot(input.weatherSnapshot ?? input.forecast, 'daily'),
    air_quality_snapshot: snapshot(input.airQualitySnapshot ?? input.airQuality),
    attraction_candidates: input.places || input.attractionCandidates || [],
    ai_itinerary: itinerary,
    ai_itinerary_generated_at: itinerary ? input.itineraryGeneratedAt || now : null,
    ai_weather_advice: weatherAdvice,
    ai_weather_advice_generated_at: weatherAdvice ? input.weatherAdviceGeneratedAt || now : null,
  }
}

function updateTripRow(input) {
  const row = {}

  if (input.title !== undefined) row.title = String(input.title).trim().slice(0, 80)
  if (input.startDate !== undefined) row.start_date = input.startDate
  if (input.endDate !== undefined) row.end_date = input.endDate
  if (input.preferences !== undefined) row.preferences = input.preferences
  if (input.forecast !== undefined || input.weatherSnapshot !== undefined) {
    row.weather_snapshot = snapshot(input.weatherSnapshot ?? input.forecast, 'daily')
  }
  if (input.airQuality !== undefined || input.airQualitySnapshot !== undefined) {
    row.air_quality_snapshot = snapshot(input.airQualitySnapshot ?? input.airQuality)
  }
  if (input.places !== undefined || input.attractionCandidates !== undefined) {
    row.attraction_candidates = input.places ?? input.attractionCandidates
  }
  if (input.itinerary !== undefined || input.aiItinerary !== undefined) {
    row.ai_itinerary = input.itinerary ?? input.aiItinerary
    row.ai_itinerary_generated_at = row.ai_itinerary ? input.itineraryGeneratedAt || new Date().toISOString() : null
  }
  if (input.weatherAdvice !== undefined || input.aiWeatherAdvice !== undefined) {
    row.ai_weather_advice = input.weatherAdvice ?? input.aiWeatherAdvice
    row.ai_weather_advice_generated_at = row.ai_weather_advice ? input.weatherAdviceGeneratedAt || new Date().toISOString() : null
  }
  if (input.destination !== undefined) {
    const destination = destinationFromInput(input)
    Object.assign(row, {
      destination_id: destination.id.slice(0, 160),
      destination_name: destination.name.slice(0, 120),
      country_name: destination.countryName?.slice(0, 120) || null,
      country_code: destination.countryCode,
      latitude: destination.latitude,
      longitude: destination.longitude,
      timezone: destination.timezone,
    })
  }

  return row
}

async function functionError(error, fallbackMessage) {
  let payload = null
  const response = error?.context

  if (response && typeof response.clone === 'function') {
    const cloned = response.clone()
    if (typeof cloned.json === 'function') payload = await cloned.json().catch(() => null)
  }

  return serviceError(
    {
      message: payload?.error?.message || payload?.message || error?.message || fallbackMessage,
      code: payload?.error?.code || payload?.code || error?.code,
      status: response?.status,
    },
    fallbackMessage,
  )
}

export const isTripsServiceConfigured = () => isSupabaseConfigured
export const isConfigured = isTripsServiceConfigured

export async function listTrips() {
  const client = getSupabaseClient()
  if (!client) return []

  try {
    const { data, error } = await client.from('trips').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapTrip)
  } catch (error) {
    throw serviceError(error, '저장한 여행을 불러오지 못했습니다.')
  }
}

export async function getTrip(id) {
  const client = getSupabaseClient()
  if (!client) return null

  try {
    const { data, error } = await client.from('trips').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return mapTrip(data)
  } catch (error) {
    throw serviceError(error, '여행 정보를 불러오지 못했습니다.')
  }
}

export async function createTrip(input) {
  const client = requireSupabaseClient()

  try {
    const currentUser = await requireUser(client)
    const { data, error } = await client.from('trips').insert(createTripRow(input, currentUser.id)).select().single()
    if (error) throw error
    return mapTrip(data)
  } catch (error) {
    throw serviceError(error, '여행을 저장하지 못했습니다.')
  }
}

export async function updateTrip(id, input) {
  const client = requireSupabaseClient()

  try {
    const row = updateTripRow(input)
    if (!Object.keys(row).length) return getTrip(id)
    const { data, error } = await client.from('trips').update(row).eq('id', id).select().single()
    if (error) throw error
    return mapTrip(data)
  } catch (error) {
    throw serviceError(error, '여행을 수정하지 못했습니다.')
  }
}

export async function removeTrip(id) {
  const client = requireSupabaseClient()

  try {
    const { error } = await client.from('trips').delete().eq('id', id)
    if (error) throw error
  } catch (error) {
    throw serviceError(error, '여행을 삭제하지 못했습니다.')
  }
}

export async function getWeatherAdvice(input) {
  const client = requireSupabaseClient()

  try {
    const { data, error } = await client.functions.invoke('weather-advice', { body: input })
    if (error) throw await functionError(error, '날씨 추천을 생성하지 못했습니다.')
    return { advice: data?.data ?? data?.advice ?? data, meta: data?.meta || {} }
  } catch (error) {
    throw serviceError(error, '날씨 추천을 생성하지 못했습니다.')
  }
}

export async function generateItinerary(input) {
  const client = requireSupabaseClient()

  try {
    const { data, error } = await client.functions.invoke('generate-itinerary', { body: input })
    if (error) throw await functionError(error, '여행 일정을 생성하지 못했습니다.')
    return { itinerary: data?.data ?? data?.itinerary ?? data, trip: data?.trip || null, meta: data?.meta || {} }
  } catch (error) {
    throw serviceError(error, '여행 일정을 생성하지 못했습니다.')
  }
}

export const tripsService = {
  isConfigured,
  listTrips,
  getTrip,
  createTrip,
  updateTrip,
  removeTrip,
  getWeatherAdvice,
  generateItinerary,
}

export default tripsService
