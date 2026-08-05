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

function optionalEnv(...names: string[]) {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();
    if (value) return value;
  }
  return null;
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

function isQuotaExhausted(response: Response, body: Record<string, unknown>) {
  const error = body.error && typeof body.error === "object"
    ? body.error as Record<string, unknown>
    : null;
  const code = providerErrorCode(body);
  const type = typeof error?.type === "string" ? error.type : null;
  return [
    "credit_balance_exhausted",
    "insufficient_quota",
    "billing_hard_limit_reached",
  ].includes(code ?? "") ||
    (response.status === 429 && type === "insufficient_quota");
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

async function requestGemini(
  apiKey: string,
  model: string,
  body: string,
  signal: AbortSignal,
) {
  const normalizedModel = model.replace(/^models\//, "");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${
      encodeURIComponent(normalizedModel)
    }:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body,
      signal,
    },
  );
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
    const startIndex = Number(nested.start_index ?? nested.startIndex);
    const endIndex = Number(nested.end_index ?? nested.endIndex);
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

function geminiGroundingOutput(response: Record<string, unknown>) {
  const candidates = Array.isArray(response.candidates)
    ? response.candidates
    : [];
  const candidate = candidates[0] && typeof candidates[0] === "object"
    ? candidates[0] as Record<string, unknown>
    : null;
  const content = candidate?.content && typeof candidate.content === "object"
    ? candidate.content as Record<string, unknown>
    : null;
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const textParts: string[] = [];

  for (const part of parts) {
    if (!part || typeof part !== "object") continue;
    const typedPart = part as Record<string, unknown>;
    if (typeof typedPart.text === "string") textParts.push(typedPart.text);
  }

  if (!textParts.length) {
    throw new ApiError(
      502,
      "AI_EMPTY_RESPONSE",
      "AI 추천 결과가 비어 있습니다.",
    );
  }

  const metadata = candidate?.groundingMetadata &&
      typeof candidate.groundingMetadata === "object"
    ? candidate.groundingMetadata as Record<string, unknown>
    : null;
  const chunks = Array.isArray(metadata?.groundingChunks)
    ? metadata.groundingChunks
    : [];
  const citations = new Map<string, ResponseCitation>();

  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== "object") continue;
    const web = (chunk as Record<string, unknown>).web;
    if (!web || typeof web !== "object") continue;
    const source = web as Record<string, unknown>;
    const citation = normalizeCitation({
      title: source.title,
      url: source.uri,
    });
    if (citation) addCitation(citations, citation);
  }

  const supports = Array.isArray(metadata?.groundingSupports)
    ? metadata.groundingSupports
    : [];
  for (const support of supports) {
    if (!support || typeof support !== "object") continue;
    const typedSupport = support as Record<string, unknown>;
    const segment = typedSupport.segment &&
        typeof typedSupport.segment === "object"
      ? typedSupport.segment as Record<string, unknown>
      : null;
    const sourceIndexes = Array.isArray(typedSupport.groundingChunkIndices)
      ? typedSupport.groundingChunkIndices
      : [];
    if (!segment || sourceIndexes.length === 0) continue;

    for (const sourceIndex of sourceIndexes) {
      if (!Number.isInteger(sourceIndex)) continue;
      const chunk = chunks[sourceIndex];
      if (!chunk || typeof chunk !== "object") continue;
      const web = (chunk as Record<string, unknown>).web;
      if (!web || typeof web !== "object") continue;
      const source = web as Record<string, unknown>;
      const citation = normalizeCitation({
        title: source.title,
        url: source.uri,
        startIndex: segment.startIndex,
        endIndex: segment.endIndex,
      });
      if (citation) addCitation(citations, citation);
    }
  }

  return {
    text: textParts.join(""),
    citations: [...citations.values()].slice(0, 12),
    webSearchUsed: Boolean(
      metadata && (
        (Array.isArray(metadata.webSearchQueries) &&
          metadata.webSearchQueries.length > 0) ||
        chunks.length > 0 ||
        supports.length > 0
      )
    ),
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
  const primaryApiKey = optionalEnv("OPENAI_API_KEY");
  const geminiApiKey = optionalEnv("GEMINI_KEY", "GEMINI_API_KEY");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    webSearch ? 45_000 : 25_000,
  );

  const parseStructuredJson = (text: string) => {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError(
        502,
        "AI_INVALID_RESPONSE",
        "AI 추천 결과를 해석하지 못했습니다.",
      );
    }
  };

  const geminiSchema = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(geminiSchema);
    if (!value || typeof value !== "object") return value;

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "maxLength")
        .map(([key, nested]) => [key, geminiSchema(nested)]),
    );
  };

  const createGeminiResponse = async () => {
    if (!geminiApiKey) {
      throw new ApiError(
        500,
        "AI_NOT_CONFIGURED",
        "OPENAI_API_KEY 또는 GEMINI_KEY 설정이 필요합니다.",
      );
    }

    const model = optionalEnv("GEMINI_MODEL") ||
      "gemini-3.1-flash-lite";
    const requestBody = JSON.stringify({
      systemInstruction: {
        parts: [{ text: instructions }],
      },
      contents: [{
        role: "user",
        parts: [{ text: JSON.stringify(input) }],
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiSchema(schema),
        maxOutputTokens,
      },
      ...(webSearch ? { tools: [{ google_search: {} }] } : {}),
    });

    let response: Response;
    let responseBody: Record<string, unknown>;
    try {
      ({ response, responseBody } = await requestGemini(
        geminiApiKey,
        model,
        requestBody,
        controller.signal,
      ));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError(504, "AI_TIMEOUT", "AI 응답 시간이 초과되었습니다.");
      }
      throw new ApiError(
        502,
        "AI_PROVIDER_UNAVAILABLE",
        "AI 서비스에 연결할 수 없습니다.",
      );
    }

    if (!response.ok) {
      console.error("Gemini API error", {
        status: response.status,
        model,
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
        { providerStatus: response.status },
      );
    }

    const output = geminiGroundingOutput(responseBody);
    return {
      data: parseStructuredJson(output.text),
      model,
      citations: output.citations,
      webSearchUsed: output.webSearchUsed,
    };
  };

  if (!primaryApiKey) {
    try {
      return await createGeminiResponse();
    } finally {
      clearTimeout(timeout);
    }
  }

  const model = requiredEnv("OPENAI_MODEL");

  let response: Response;
  let responseBody: Record<string, unknown>;
  try {
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
      isQuotaExhausted(response, responseBody)
    ) {
      ({ response, responseBody } = await requestOpenAI(
        backupApiKey,
        requestBody,
        controller.signal,
      ));
    }

    if (!response.ok && geminiApiKey && isQuotaExhausted(response, responseBody)) {
      clearTimeout(timeout);
      return await createGeminiResponse();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
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

  const output = responseOutput(responseBody);

  return {
    data: parseStructuredJson(output.text),
    model,
    citations: output.citations,
    webSearchUsed: output.webSearchUsed,
  };
}
