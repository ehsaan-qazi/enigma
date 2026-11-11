import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/modules/auth/server/repositories/profile.repository";
import { localStore } from "@/lib/supabase/local-store";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Determine correct public redirect origin (handles reverse proxy / Vercel forwarded headers)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocal = process.env.NODE_ENV === "development" || origin.includes("localhost");
  const redirectOrigin = isLocal
    ? origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin;

  if (error || errorDescription) {
    const errorMsg = encodeURIComponent(
      errorDescription || error || "Google sign in was cancelled or failed"
    );
    return NextResponse.redirect(`${redirectOrigin}/login?error=${errorMsg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError && data.user) {
      try {
        const meta = data.user.user_metadata || {};
        const fullName =
          meta.full_name ||
          meta.name ||
          (data.user.email ? data.user.email.split("@")[0] : "Student");
        const institution = meta.institution || "";

        // Sync with profiles table
        await profileRepository.create({
          id: data.user.id,
          email: data.user.email || null,
          full_name: fullName,
          institution: institution || null,
          role: "student",
        });

        // Sync with localStore
        localStore.upsertProfile({
          id: data.user.id,
          email: data.user.email || "",
          full_name: fullName,
          institution,
          role: "student",
        });
      } catch {
        // Profile sync is non-blocking if already handled
      }
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${redirectOrigin}/login?error=auth_callback_failed`);
}
