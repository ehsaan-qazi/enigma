import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "POST /api/viva/initiate stub — owned by Qazi (Backend)" },
    { status: 501 }
  );
}
