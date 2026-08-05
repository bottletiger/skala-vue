import { ApiError } from "./http.ts";

type JsonSchema = Record<string, unknown>;

type StructuredResponseOptions = {
  schemaName: string;
  schema: JsonSchema;
  instructions: string;
  input: unknown;
  userId: string;
  maxOutputTokens: number;
  webSearch?: {
    city: string;
    countryCode?: string;
    region?: string;
    timezone?: string;
  };
};

export type ResponseCitation = {
  title: string;
  url: string;
  annotations?: Array<{
    startIndex: number;
    endIndex: number;
  }>;
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new ApiError(500, "AI_NOT_CONFIGURED", `${name} 설정이 필요합니다.`);
  }
  return value;
}

function secondaryApiKey(primaryApiKey: string) {
  const value = Deno.env.get("OPENAI_API_KEY_SECONDARY")?.trim() ||
    Deno.env.get("BACKUP_OPENAI_API_KEY")?.trim();
  return value && value !== primaryApiKey ? value : null;
}

function providerErrorCode(body: Record<string, unknown>) {
  const error = body.error && typeof body.error === "object"
    ? body.error as Record<string, unknown>
    : null;
  return typeof error?.code === "string" ? error.code : null;
}

async function requestOpenAI(
  apiKey: string,
  body: string,
  signal: AbortSignal,
) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
    signal,
  });
  const responseBody = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  return { response, responseBody };
}

async function safetyIdentifier(userId: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(userId),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function normalizeCitation(value: unknown): ResponseCitation | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const nested = source.url_citation && typeof source.url_citation === "object"
    ? (source.url_citation as Record<string, unknown>)
    : source;
  if (typeof nested.url !== "string") return null;

  try {
    const url = new URL(nested.url);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const title = typeof nested.title === "string" && nested.title.trim()
      ? nested.title.trim()
      : url.hostname;
    const startIndex = Number(nested.start_index);
    const endIndex = Number(nested.end_index);
    const hasValidAnnotation = Number.isInteger(startIndex) &&
      Number.isInteger(endIndex) && startIndex >= 0 && endIndex >= startIndex;
    return {
      title: title.slice(0, 240),
      url: url.toString().slice(0, 2_000),
      ...(hasValidAnnotation
        ? { annotations: [{ startIndex, endIndex }] }
        : {}),
    };
  } catch {
    return null;
  }
}

function addCitation(
  citations: Map<string, ResponseCitation>,
  citation: ResponseCitation,
) {
  const existing = citations.get(citation.url);
  const annotations = [
    ...(existing?.annotations ?? []),
    ...(
      citation.annotations ?? []
    ),
  ].filter((annotation, index, values) =>
    values.findIndex((candidate) =>
      candidate.startIndex === annotation.startIndex &&
      candidate.endIndex === annotation.endIndex
    ) === index
  );

  citations.set(citation.url, {
    title: citation.title || existing?.title || citation.url,
    url: citation.url,
    ...(annotations.length ? { annotations } : {}),
  });
}

function responseOutput(response: Record<string, unknown>) {
  const output = Array.isArray(response.output) ? response.output : [];
  const citations = new Map<string, ResponseCitation>();
  let text = "";
  let webSearchUsed = false;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const typedItem = item as Record<string, unknown>;

    if (typedItem.type === "web_search_call") {
      webSearchUsed = true;
      const action = typedItem.action && typeof typedItem.action === "object"
        ? (typedItem.action as Record<string, unknown>)
        : null;
      const sources = Array.isArray(action?.sources) ? action.sources : [];
      for (const source of sources) {
        const citation = normalizeCitation(source);
        if (citation) addCitation(citations, citation);
      }
    }

    const content = Array.isArray(typedItem.content)
      ? (typedItem.content as unknown[])
      : [];

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const typedPart = part as Record<string, unknown>;
      if (typedPart.type === "refusal") {
        throw new ApiError(
          422,
          "AI_REFUSED",
          "요청하신 추천을 생성할 수 없습니다.",
        );
      }
      if (
        typedPart.type === "output_text" && typeof typedPart.text === "string"
      ) {
        text ||= typedPart.text;
        const annotations = Array.isArray(typedPart.annotations)
          ? typedPart.annotations
          : [];
        for (const annotation of annotations) {
          const citation = normalizeCitation(annotation);
          if (citation) addCitation(citations, citation);
        }
      }
    }
  }

  if (!text) {
    throw new ApiError(
      502,
      "AI_EMPTY_RESPONSE",
      "AI 추천 결과가 비어 있습니다.",
    );
  }

  return {
    text,
    citations: [...citations.values()].slice(0, 12),
    webSearchUsed,
  };
}

function retryAfterSeconds(response: Response) {
  const value = response.headers.get("retry-after")?.trim();
  if (!value) return null;

  if (/^\d+$/.test(value)) {
    return Math.min(Number(value), 86_400);
  }

  const retryAt = Date.parse(value);
  if (!Number.isFinite(retryAt)) return null;
  return Math.min(
    Math.max(Math.ceil((retryAt - Date.now()) / 1_000), 0),
    86_400,
  );
}

export async function createStructuredResponse<T>({
  schemaName,
  schema,
  instructions,
  input,
  userId,
  maxOutputTokens,
  webSearch,
}: StructuredResponseOptions): Promise<{
  data: T;
  model: string;
  citations: ResponseCitation[];
  webSearchUsed: boolean;
}> {
  const model = requiredEnv("OPENAI_MODEL");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    webSearch ? 45_000 : 25_000,
  );

  let response: Response;
  let responseBody: Record<string, unknown>;
  try {
    const primaryApiKey = requiredEnv("OPENAI_API_KEY");
    const requestBody = JSON.stringify({
      model,
      store: false,
      safety_identifier: await safetyIdentifier(userId),
      instructions,
      input: JSON.stringify(input),
      max_output_tokens: maxOutputTokens,
      ...(webSearch
        ? {
          tools: [
            {
              type: "web_search",
              search_context_size: "low",
              user_location: {
                type: "approximate",
                city: webSearch.city,
                ...(webSearch.countryCode
                  ? { country: webSearch.countryCode }
                  : {}),
                ...(webSearch.region ? { region: webSearch.region } : {}),
                ...(webSearch.timezone ? { timezone: webSearch.timezone } : {}),
              },
            },
          ],
          tool_choice: "required",
          include: ["web_search_call.action.sources"],
        }
        : {}),
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    });
    ({ response, responseBody } = await requestOpenAI(
      primaryApiKey,
      requestBody,
      controller.signal,
    ));

    const backupApiKey = secondaryApiKey(primaryApiKey);
    if (
      !response.ok && backupApiKey &&
      providerErrorCode(responseBody) === "credit_balance_exhausted"
    ) {
      ({ response, responseBody } = await requestOpenAI(
        backupApiKey,
        requestBody,
        controller.signal,
      ));
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(504, "AI_TIMEOUT", "AI 응답 시간이 초과되었습니다.");
    }
    throw new ApiError(
      502,
      "AI_PROVIDER_UNAVAILABLE",
      "AI 서비스에 연결할 수 없습니다.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error("OpenAI Responses API error", {
      status: response.status,
      requestId: response.headers.get("x-request-id"),
    });
    if (response.status === 429) {
      const retryAfter = retryAfterSeconds(response);
      throw new ApiError(
        429,
        "AI_PROVIDER_RATE_LIMITED",
        "AI 요청이 잠시 많습니다. 잠시 후 다시 시도해 주세요.",
        {
          providerStatus: 429,
          ...(retryAfter === null ? {} : { retryAfterSeconds: retryAfter }),
        },
      );
    }
    throw new ApiError(
      502,
      "AI_PROVIDER_ERROR",
      "AI 추천을 생성하지 못했습니다.",
      {
        providerStatus: response.status,
      },
    );
  }

  let parsed: T;
  const output = responseOutput(responseBody);
  try {
    parsed = JSON.parse(output.text) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      502,
      "AI_INVALID_RESPONSE",
      "AI 추천 결과를 해석하지 못했습니다.",
    );
  }

  return {
    data: parsed,
    model,
    citations: output.citations,
    webSearchUsed: output.webSearchUsed,
  };
}
