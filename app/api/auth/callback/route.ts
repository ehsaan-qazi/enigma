import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { localStore } from "@/lib/supabase/local-store";
import { Database } from "@/lib/database.types";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Determine correct public redirect origin (handles reverse proxy / Vercel forwarded headers)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocal =
    process.env.NODE_ENV === "development" || requestUrl.origin.includes("localhost");
  const redirectOrigin = isLocal
    ? requestUrl.origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (error || errorDescription) {
    const errorMsg = encodeURIComponent(
      errorDescription || error || "Google sign in was cancelled or failed"
    );
    return NextResponse.redirect(`${redirectOrigin}/login?error=${errorMsg}`);
  }

  const destination = next.startsWith("/") ? next : `/${next}`;
  const response = NextResponse.redirect(`${redirectOrigin}${destination}`);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Ignore if called in context where cookieStore cannot be modified
              }
              try {
                response.cookies.set(name, value, options);
              } catch {
                // Ignore
              }
            });
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError && data.user) {
      try {
        const meta = data.user.user_metadata || {};
        const fullName =
          meta.full_name ||
          meta.name ||
          (data.user.email ? data.user.email.split("@")[0] : "Student");
        const institution = meta.institution || "";

        // Upsert profile with admin client to bypass any RLS restriction during initial oauth callback
        const admin = createAdminClient();
        await admin.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email || null,
            full_name: fullName,
            institution: institution || null,
            role: "student",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        // Sync with localStore for offline / in-memory fallback
        localStore.upsertProfile({
          id: data.user.id,
          email: data.user.email || "",
          full_name: fullName,
          institution,
          role: "student",
        });
      } catch (profileErr) {
        console.error("Profile sync error on OAuth callback:", profileErr);
      }

      return response;
    }

    if (exchangeError) {
      console.error("Supabase exchangeCodeForSession error:", exchangeError);
    }
  }

  return NextResponse.redirect(`${redirectOrigin}/login?error=auth_callback_failed`);
}
