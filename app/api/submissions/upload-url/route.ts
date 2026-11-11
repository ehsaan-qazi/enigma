import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "POST /api/submissions/upload-url stub — owned by Qazi (Backend)" },
    { status: 501 }
  );
}
