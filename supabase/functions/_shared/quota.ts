import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { ApiError } from "./http.ts";

export type AiGenerationKind = "weather_advice" | "travel_itinerary";

type QuotaRow = {
  allowed?: unknown;
  request_count?: unknown;
  request_limit?: unknown;
  remaining?: unknown;
  reset_at?: unknown;
};

const finiteInteger = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};

export async function consumeAiQuota(
  client: SupabaseClient,
  generationKind: AiGenerationKind,
) {
  const { data, error } = await client.rpc("consume_ai_request_quota", {
    p_generation_kind: generationKind,
  });

  if (error) {
    console.error("AI request quota RPC failed", error.code);
    throw new ApiError(
      503,
      "AI_QUOTA_UNAVAILABLE",
      "AI 요청 한도를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const row = (Array.isArray(data) ? data[0] : data) as QuotaRow | null;
  if (!row || typeof row.allowed !== "boolean") {
    throw new ApiError(
      503,
      "AI_QUOTA_UNAVAILABLE",
      "AI 요청 한도를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const result = {
    allowed: row.allowed,
    requestCount: finiteInteger(row.request_count),
    requestLimit: finiteInteger(row.request_limit),
    remaining: finiteInteger(row.remaining),
    resetAt: typeof row.reset_at === "string" ? row.reset_at : null,
  };

  if (!result.allowed) {
    throw new ApiError(
      429,
      "AI_RATE_LIMITED",
      "한 시간 동안 사용할 수 있는 AI 요청 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.",
      {
        limit: result.requestLimit,
        remaining: 0,
        resetAt: result.resetAt,
      },
    );
  }

  return result;
}
