"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles client-side OAuth completion:
 * 1. Forwards any `code` arriving on non-callback routes (e.g. Supabase fallback to Site URL)
 * 2. Handles OAuth token hash fragments (#access_token=...) from implicit flows
 * 3. Ensures the student is automatically navigated into /dashboard
 */
export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. If an auth code landed on the page (e.g., Supabase fell back to Site URL http://localhost:3000/?code=...)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !window.location.pathname.startsWith("/api/auth/callback")) {
      router.push(`/api/auth/callback?code=${encodeURIComponent(code)}&next=/dashboard`);
      return;
    }

    // 2. If OAuth hash fragment contains access_token or token error
    if (window.location.hash.includes("access_token")) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.push("/dashboard");
          router.refresh();
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          router.push("/dashboard");
          router.refresh();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [router]);

  return null;
}
