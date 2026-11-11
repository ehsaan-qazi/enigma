import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { id, message: "POST /api/viva/:id/responses stub — owned by Qazi (Backend)" },
    { status: 501 }
  );
}
