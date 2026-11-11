import { NextResponse } from "next/server";
import { authService } from "@/modules/auth/server/services/auth.service";
import { loginSchema } from "@/modules/auth/server/validators/auth.validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const result = await authService.login(validatedData);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to log in with provided credentials.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}
