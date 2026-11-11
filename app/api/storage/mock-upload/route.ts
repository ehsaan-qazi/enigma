import { NextRequest, NextResponse } from "next/server";

/**
 * Mock storage upload endpoint for local development and offline testing.
 * Accepts direct PUT/POST uploads when live Supabase Storage credentials are not active.
 */
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "unknown-file";

  // Consume the stream or buffer to verify upload payload
  const arrayBuffer = await request.arrayBuffer();
  const bytesReceived = arrayBuffer.byteLength;

  return NextResponse.json({
    success: true,
    message: "Mock storage upload successful",
    path,
    bytesReceived,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
