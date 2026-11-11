import { NextRequest, NextResponse } from "next/server";
import { localStore } from "@/lib/supabase/local-store";

/**
 * Mock storage upload endpoint for local development and offline testing.
 * Persists uploaded PDF/audio bytes into localStore so the Python AI pipeline
 * can extract real PDF text and transcribe real uploaded audio.
 */
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "unknown-file";
  const contentType = request.headers.get("content-type") || "application/octet-stream";

  const arrayBuffer = await request.arrayBuffer();
  const bytesReceived = arrayBuffer.byteLength;
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  localStore.saveUploadedFile(path, base64, contentType, bytesReceived);

  return NextResponse.json({
    success: true,
    message: "Storage upload successful",
    path,
    bytesReceived,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
