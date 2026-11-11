import { NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { profileRepository } from "@/modules/auth/server/repositories/profile.repository";

export async function GET() {
  try {
    const { user, userId } = await requireAuth();
    const profile = await profileRepository.findById(userId);

    const userProfile = {
      id: userId,
      email: user.email,
      fullName: profile?.full_name || "Enigma Student",
      institution: profile?.institution || "Imperial College London",
      role: profile?.role || "student",
      createdAt: user.created_at,
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      data: { user: userProfile },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Unauthorized",
      },
      { status: 401 }
    );
  }
}
