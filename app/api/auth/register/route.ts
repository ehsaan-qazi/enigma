import { NextResponse } from "next/server";
import { authService } from "@/modules/auth/server/services/auth.service";
import { registerSchema } from "@/modules/auth/server/validators/auth.validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const result = await authService.register(validatedData);
    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to create account.",
      },
      { status: 400 }
    );
  }
}
