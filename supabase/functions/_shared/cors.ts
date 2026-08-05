import { ApiError } from "./http.ts";

function configuredOrigins() {
  const configured = Deno.env.get("ALLOWED_ORIGINS") ?? "";

  return new Set(
    configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

export function isOriginAllowed(origin: string | null) {
  if (!origin) return true;

  const allowed = configuredOrigins();
  return allowed.has(origin);
}

export function assertAllowedOrigin(request: Request) {
  if (!isOriginAllowed(request.headers.get("origin"))) {
    throw new ApiError(
      403,
      "ORIGIN_NOT_ALLOWED",
      "허용되지 않은 요청 출처입니다.",
    );
  }
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = isOriginAllowed(origin);

  return {
    ...(allowed && origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
