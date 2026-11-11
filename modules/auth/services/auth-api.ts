import { createClient } from "@/lib/supabase/client";
import { LoginCredentials, RegisterCredentials, AuthResponse } from "../types/auth.types";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      "Invalid email or password. Please check your credentials.";
    throw new Error(msg);
  }

  return json.data || json;
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      "Failed to create account. Please try again.";
    throw new Error(msg);
  }

  return json.data || json;
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback?next=/dashboard`
      : "/api/auth/callback?next=/dashboard";

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to initiate Google OAuth sign-in.");
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Continue to clear server session
  }
  await fetch("/api/auth/logout", { method: "POST" });
}
