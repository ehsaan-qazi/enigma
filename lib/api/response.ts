import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { ZodError } from "zod";

export interface ApiResponseMeta {
  timestamp: string;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta: ApiResponseMeta;
}

export function apiSuccess<T>(data: T, status = 200, extraMeta?: Record<string, unknown>) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...extraMeta,
    },
  };
  return NextResponse.json(payload, { status });
}

export function apiError(error: unknown) {
  const timestamp = new Date().toISOString();

  if (error instanceof ZodError) {
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        message: "Validation Error",
        code: "VALIDATION_ERROR",
        details: error.flatten(),
      },
      meta: { timestamp },
    };
    return NextResponse.json(payload, { status: 400 });
  }

  if (error instanceof ApiError) {
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        message: error.message,
        details: error.details,
      },
      meta: { timestamp },
    };
    return NextResponse.json(payload, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : "An unexpected internal error occurred";
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      message,
    },
    meta: { timestamp },
  };
  return NextResponse.json(payload, { status: 500 });
}
