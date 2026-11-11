import { NextResponse } from "next/server";
import { authService } from "@/modules/auth/server/services/auth.service";

export async function POST() {
  try {
    const result = await authService.logout();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to log out.",
      },
      { status: 500 }
    );
  }
}
