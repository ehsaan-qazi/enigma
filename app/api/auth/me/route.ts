import { NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { profileRepository } from "@/modules/auth/server/repositories/profile.repository";

export async function GET() {
  try {
    const { user, userId } = await requireAuth();
    const profile = await profileRepository.findById(userId);

    const meta = (user as { user_metadata?: { full_name?: string; name?: string; institution?: string } }).user_metadata;
    const emailPrefix = user.email ? user.email.split("@")[0] : "Student";
    const userProfile = {
      id: userId,
      email: user.email,
      fullName: profile?.full_name || meta?.full_name || meta?.name || emailPrefix,
      institution: profile?.institution || meta?.institution || "",
      role: profile?.role || "student",
      createdAt: user.created_at,
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      data: { user: userProfile },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 }
    );
  }
}
