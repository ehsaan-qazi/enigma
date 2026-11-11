import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { id, message: "GET /api/viva/:id stub — owned by Qazi (Backend)" },
    { status: 501 }
  );
}
