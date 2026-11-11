import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/modules/auth/server/repositories/profile.repository";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      try {
        const existing = await profileRepository.findById(data.user.id);
        if (!existing) {
          const meta = data.user.user_metadata || {};
          await profileRepository.create({
            id: data.user.id,
            email: data.user.email || null,
            full_name:
              meta.full_name ||
              meta.name ||
              (data.user.email ? data.user.email.split("@")[0] : "Student"),
            institution: meta.institution || null,
            role: "student",
          });
        }
      } catch {
        // Profile creation is non-blocking if DB trigger already handled it
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
