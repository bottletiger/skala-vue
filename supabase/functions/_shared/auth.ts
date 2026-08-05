import {
  createClient,
  type SupabaseClient,
  type User,
} from "npm:@supabase/supabase-js@2";

import { ApiError } from "./http.ts";

type AuthContext = {
  client: SupabaseClient;
  user: User;
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new ApiError(
      500,
      "SERVER_NOT_CONFIGURED",
      `${name} 설정이 필요합니다.`,
    );
  }
  return value;
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthContext> {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.startsWith("Bearer ") || authorization.length > 8192) {
    throw new ApiError(401, "AUTH_REQUIRED", "로그인이 필요합니다.");
  }

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) {
    throw new ApiError(401, "AUTH_REQUIRED", "로그인이 필요합니다.");
  }

  const client = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new ApiError(
      401,
      "INVALID_SESSION",
      "로그인 세션이 만료되었거나 올바르지 않습니다.",
    );
  }

  return { client, user: data.user };
}
