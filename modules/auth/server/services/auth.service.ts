import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/lib/api/errors";
import { User } from "@supabase/supabase-js";

export interface AuthContext {
  user: User;
  userId: string;
}

/**
 * Verifies that the incoming request has a valid Supabase authenticated user session.
 * Throws UnauthorizedError if no active session is found.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Authentication required. Please log in.");
  }

  return {
    user,
    userId: user.id,
  };
}
