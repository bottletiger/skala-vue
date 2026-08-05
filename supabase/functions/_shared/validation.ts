import { ApiError } from "./http.ts";

export type JsonRecord = Record<string, unknown>;

export function asObject(value: unknown, field = "body"): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "INVALID_INPUT", `${field} 값은 객체여야 합니다.`);
  }
  return value as JsonRecord;
}

export function optionalObject(value: unknown): JsonRecord | null {
  if (value === undefined || value === null) return null;
  return asObject(value);
}

export function cleanString(
  value: unknown,
  field: string,
  options: { max: number; required?: boolean; fallback?: string } = {
    max: 120,
  },
) {
  if (value === undefined || value === null || value === "") {
    if (options.required) {
      throw new ApiError(400, "INVALID_INPUT", `${field} 값이 필요합니다.`);
    }
    return options.fallback ?? "";
  }

  if (typeof value !== "string") {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `${field} 값은 문자열이어야 합니다.`,
    );
  }

  const cleaned = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 ? " " : character;
  }).join("").replace(/\s+/g, " ").trim();
  if (!cleaned && options.required) {
    throw new ApiError(400, "INVALID_INPUT", `${field} 값이 필요합니다.`);
  }
  if (cleaned.length > options.max) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `${field} 값은 ${options.max}자 이하여야 합니다.`,
    );
  }
  return cleaned;
}

export function cleanNumber(
  value: unknown,
  field: string,
  options: { min: number; max: number; required?: boolean },
) {
  if (value === undefined || value === null || value === "") {
    if (options.required) {
      throw new ApiError(400, "INVALID_INPUT", `${field} 값이 필요합니다.`);
    }
    return null;
  }

  const number = typeof value === "number" ? value : Number(value);
  if (
    !Number.isFinite(number) || number < options.min || number > options.max
  ) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `${field} 값이 허용 범위를 벗어났습니다.`,
    );
  }
  return number;
}

export function cleanStringArray(
  value: unknown,
  field: string,
  maxItems: number,
  maxLength: number,
) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `${field} 항목 수가 허용 범위를 벗어났습니다.`,
    );
  }

  return value.map((item, index) =>
    cleanString(item, `${field}[${index}]`, { max: maxLength, required: true })
  );
}

export function cleanEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  fallback: T,
) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `${field} 값이 올바르지 않습니다.`,
    );
  }
  return value as T;
}

export function cleanIsoDate(value: unknown, field: string) {
  const date = cleanString(value, field, { max: 10, required: true });
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed) ||
    new Date(parsed).toISOString().slice(0, 10) !== date
  ) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `${field} 값은 YYYY-MM-DD 형식이어야 합니다.`,
    );
  }
  return date;
}

export function cleanUuid(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const uuid = cleanString(value, field, { max: 36, required: true });
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(uuid)
  ) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `${field} 값이 올바르지 않습니다.`,
    );
  }
  return uuid;
}

export function ensureDateRange(
  startDate: string,
  endDate: string,
  maxDays = 14,
) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const durationDays = Math.floor((end - start) / 86_400_000) + 1;

  if (durationDays < 1 || durationDays > maxDays) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      `여행 기간은 1일부터 ${maxDays}일까지 가능합니다.`,
    );
  }
  return durationDays;
}

export function limitJson(value: unknown, field: string, maxBytes: number) {
  const bytes =
    new TextEncoder().encode(JSON.stringify(value ?? null)).byteLength;
  if (bytes > maxBytes) {
    throw new ApiError(400, "INVALID_INPUT", `${field} 데이터가 너무 큽니다.`);
  }
  return value;
}
