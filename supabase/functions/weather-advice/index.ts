import { requireAuthenticatedUser } from "../_shared/auth.ts";
import {
  cacheUpdatedAt,
  hashGenerationInput,
  readGenerationCache,
  writeGenerationCache,
} from "../_shared/cache.ts";
import { assertAllowedOrigin, corsHeaders } from "../_shared/cors.ts";
import {
  ApiError,
  assertPost,
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "../_shared/http.ts";
import { createStructuredResponse } from "../_shared/openai.ts";
import { consumeAiQuota } from "../_shared/quota.ts";
import {
  asObject,
  cleanEnum,
  cleanNumber,
  cleanString,
  cleanStringArray,
  cleanUuid,
} from "../_shared/validation.ts";

const WEATHER_ADVICE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", maxLength: 90 },
    outfit: {
      type: "array",
      items: { type: "string", maxLength: 80 },
      minItems: 1,
      maxItems: 4,
    },
    carry: {
      type: "array",
      items: { type: "string", maxLength: 80 },
      maxItems: 4,
    },
    cautions: {
      type: "array",
      items: { type: "string", maxLength: 100 },
      maxItems: 4,
    },
  },
  required: ["headline", "outfit", "carry", "cautions"],
  additionalProperties: false,
};

const numberFrom = (
  source: Record<string, unknown>,
  keys: string[],
  field: string,
  min: number,
  max: number,
  required = false,
) => {
  const key = keys.find((candidate) =>
    source[candidate] !== undefined && source[candidate] !== null
  );
  return cleanNumber(key ? source[key] : null, field, { min, max, required });
};

const stringFrom = (
  source: Record<string, unknown>,
  keys: string[],
  field: string,
  max: number,
) => {
  const key = keys.find((candidate) =>
    source[candidate] !== undefined && source[candidate] !== null
  );
  return cleanString(key ? source[key] : null, field, { max });
};

function sanitizeForecast(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 8).map((entry, index) => {
    const item = asObject(entry, `forecast[${index}]`);
    return {
      time: stringFrom(
        item,
        ["time", "localTime", "date"],
        `forecast[${index}].time`,
        40,
      ),
      temperature: numberFrom(
        item,
        ["temperature", "temp"],
        `forecast[${index}].temperature`,
        -100,
        80,
      ),
      precipitationProbability: numberFrom(
        item,
        ["precipitationProbability", "precipitation_probability"],
        `forecast[${index}].precipitationProbability`,
        0,
        100,
      ),
      condition: stringFrom(
        item,
        ["condition", "status", "weatherDescription"],
        `forecast[${index}].condition`,
        80,
      ),
    };
  });
}

function sanitizeInput(value: unknown) {
  const body = asObject(value);
  const weather = asObject(body.weather, "weather");
  const locationValue = body.location && typeof body.location === "object" &&
      !Array.isArray(body.location)
    ? asObject(body.location, "location")
    : null;
  const location = locationValue
    ? {
      name: stringFrom(
        locationValue,
        ["name", "displayName", "city"],
        "location.name",
        120,
      ),
      country: stringFrom(
        locationValue,
        ["countryName", "country"],
        "location.country",
        120,
      ),
    }
    : {
      name: cleanString(body.location ?? weather.name, "location", {
        max: 120,
        fallback: "현재 위치",
      }),
      country: stringFrom(
        weather,
        ["countryName", "country"],
        "weather.country",
        120,
      ),
    };

  const current = {
    temperature: numberFrom(
      weather,
      ["temperature", "temp", "temperature_2m"],
      "weather.temperature",
      -100,
      80,
      true,
    ),
    apparentTemperature: numberFrom(
      weather,
      ["apparentTemperature", "feelsLike", "apparent_temperature"],
      "weather.apparentTemperature",
      -100,
      100,
    ),
    humidity: numberFrom(
      weather,
      ["humidity", "relativeHumidity", "relative_humidity_2m"],
      "weather.humidity",
      0,
      100,
    ),
    windSpeed: numberFrom(
      weather,
      ["windSpeed", "wind", "wind_speed_10m"],
      "weather.windSpeed",
      0,
      150,
    ),
    precipitationProbability: numberFrom(
      weather,
      ["precipitationProbability", "precipitation_probability"],
      "weather.precipitationProbability",
      0,
      100,
    ),
    condition: stringFrom(
      weather,
      ["status", "condition", "weatherDescription"],
      "weather.condition",
      80,
    ),
  };

  return {
    tripId: cleanUuid(body.tripId, "tripId"),
    location,
    unit: cleanEnum(
      body.unit,
      "unit",
      ["celsius", "fahrenheit"] as const,
      "celsius",
    ),
    current,
    forecast: sanitizeForecast(body.forecast),
  };
}

function validateOutput(value: unknown) {
  const result = asObject(value, "AI response");
  const advice = {
    headline: cleanString(result.headline, "headline", {
      max: 90,
      required: true,
    }),
    outfit: cleanStringArray(result.outfit, "outfit", 4, 80),
    carry: cleanStringArray(result.carry, "carry", 4, 80),
    cautions: cleanStringArray(result.cautions, "cautions", 4, 100),
  };
  if (!advice.outfit.length) {
    throw new ApiError(
      502,
      "AI_INVALID_RESPONSE",
      "AI 옷차림 추천 결과가 비어 있습니다.",
    );
  }
  return advice;
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request);

  try {
    assertAllowedOrigin(request);
    if (request.method === "OPTIONS") return new Response("ok", { headers });
    assertPost(request);
    const { client, user } = await requireAuthenticatedUser(request);
    const input = sanitizeInput(await readJsonBody(request, 48 * 1024));

    const generationInput = {
      location: input.location,
      unit: input.unit,
      currentWeather: input.current,
      nearTermForecast: input.forecast,
    };
    const inputHash = await hashGenerationInput(generationInput);
    const cached = await readGenerationCache(
      user.id,
      "weather_advice",
      inputHash,
    );
    let model: string | null = null;
    let cacheHit = false;
    let advice;
    let generatedAt: string;

    if (cached) {
      advice = validateOutput(cached.result);
      cacheHit = true;
      generatedAt = cacheUpdatedAt(cached.updated_at) ??
        new Date().toISOString();
    } else {
      await consumeAiQuota(client, "weather_advice");
      const generated = await createStructuredResponse<unknown>({
        schemaName: "weather_advice",
        schema: WEATHER_ADVICE_SCHEMA,
        userId: user.id,
        maxOutputTokens: 700,
        instructions:
          "당신은 한국어 날씨 안내 도우미입니다. 입력 JSON의 실제 날씨 수치만 근거로 옷차림, 준비물, 주의사항을 간결하게 추천하세요. 없는 수치나 예보를 추측하지 말고, 의학적 진단이나 확정적인 안전 보장을 하지 마세요. 과장, 인사말, AI라는 표현 없이 자연스러운 한국어로 작성하고 headline은 반드시 줄바꿈 없는 한 문장으로 작성하세요.",
        input: generationInput,
      });
      advice = validateOutput(generated.data);
      model = generated.model;
      await writeGenerationCache(
        user.id,
        "weather_advice",
        inputHash,
        advice,
        [],
        30,
      );
      generatedAt = new Date().toISOString();
    }

    if (input.tripId) {
      const { data: updatedTrip, error } = await client
        .from("trips")
        .update({
          ai_weather_advice: advice,
          ai_weather_advice_generated_at: generatedAt,
        })
        .eq("id", input.tripId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!updatedTrip) {
        return jsonResponse(
          {
            error: {
              code: "TRIP_NOT_FOUND",
              message: "저장할 여행을 찾을 수 없습니다.",
            },
          },
          404,
          headers,
        );
      }
    }

    return jsonResponse(
      {
        data: advice,
        meta: {
          model,
          generatedAt,
          storedOnTrip: Boolean(input.tripId),
          cacheHit,
        },
      },
      200,
      headers,
    );
  } catch (error) {
    return errorResponse(error, headers);
  }
});
