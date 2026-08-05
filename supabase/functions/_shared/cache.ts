import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

type GenerationKind = "weather_advice" | "travel_itinerary";

let serviceCacheClient: SupabaseClient | null = null;
let serviceCacheClientInitialized = false;

function getServiceCacheClient() {
  if (serviceCacheClientInitialized) return serviceCacheClient;
  serviceCacheClientInitialized = true;

  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !serviceRoleKey) {
    console.warn("AI cache disabled: service-role configuration is missing");
    return null;
  }

  try {
    serviceCacheClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch {
    console.warn(
      "AI cache disabled: service-role client initialization failed",
    );
  }

  return serviceCacheClient;
}

export async function hashGenerationInput(value: unknown) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function readGenerationCache(
  userId: string,
  generationKind: GenerationKind,
  inputHash: string,
) {
  const client = getServiceCacheClient();
  if (!client) return null;

  const { data, error } = await client
    .from("ai_generation_cache")
    .select("result,sources,updated_at")
    .eq("user_id", userId)
    .eq("generation_kind", generationKind)
    .eq("input_hash", inputHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("AI cache read failed", error.code);
    return null;
  }

  return data;
}

export async function writeGenerationCache(
  userId: string,
  generationKind: GenerationKind,
  inputHash: string,
  result: Record<string, unknown>,
  sources: unknown[],
  ttlMinutes: number,
) {
  const client = getServiceCacheClient();
  if (!client) return;

  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const { error } = await client.from("ai_generation_cache").upsert(
    {
      user_id: userId,
      generation_kind: generationKind,
      input_hash: inputHash,
      result,
      sources,
      expires_at: expiresAt,
    },
    { onConflict: "user_id,generation_kind,input_hash" },
  );

  if (error) console.error("AI cache write failed", error.code);
}

export function cacheUpdatedAt(value: unknown) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}
