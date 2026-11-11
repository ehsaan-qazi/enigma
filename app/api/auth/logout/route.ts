import { NextResponse } from "next/server";
import { authService } from "@/modules/auth/server/services/auth.service";

export async function POST() {
  try {
    const result = await authService.logout();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to log out.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
