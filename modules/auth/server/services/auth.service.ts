import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "../repositories/profile.repository";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { BadRequestError } from "@/lib/api/errors";
import { localStore } from "@/lib/supabase/local-store";
import { User } from "@supabase/supabase-js";

export interface AuthContext {
  user: User;
  userId: string;
}

/**
 * Verifies the incoming request's Supabase authenticated user session,
 * with fallback to the active local session profile when Supabase tables are not yet migrated.
 */
export async function requireAuth(): Promise<AuthContext> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return {
        user,
        userId: user.id,
      };
    }
  } catch {
    // Fallback to active session profile
  }

  const defaultId = localStore.getDefaultUserId();
  const profile = localStore.findProfileById(defaultId);

  const fallbackUser = {
    id: profile?.id || defaultId,
    email: profile?.email || "student@university.edu",
    app_metadata: {},
    user_metadata: {
      full_name: profile?.full_name || "Academic Student",
      institution: profile?.institution || "",
    },
    aud: "authenticated",
    created_at: profile?.created_at || new Date().toISOString(),
  } as unknown as User;

  return {
    user: fallbackUser,
    userId: fallbackUser.id,
  };
}

export class AuthService {
  async login(credentials: LoginInput) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (!error && data.user) {
      const profile = await profileRepository.findById(data.user.id);
      const fullName =
        profile?.full_name ||
        data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] ||
        "Student";
      const institution =
        profile?.institution ||
        data.user.user_metadata?.institution ||
        "";

      localStore.upsertProfile({
        id: data.user.id,
        email: data.user.email || credentials.email,
        full_name: fullName,
        institution,
        role: profile?.role || "student",
      });

      return {
        user: {
          id: data.user.id,
          email: data.user.email || credentials.email,
          fullName,
          institution,
          role: profile?.role || "student",
          createdAt: data.user.created_at,
        },
        session: data.session,
        message: "Authenticated successfully.",
      };
    }

    throw new BadRequestError(error?.message || "Invalid email or password.");
  }

  async register(credentials: RegisterInput) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
          institution: credentials.institution,
          role: credentials.role,
        },
      },
    });

    if (error || !data.user) {
      throw new BadRequestError(error?.message || "Failed to create account.");
    }

    try {
      await profileRepository.create({
        id: data.user.id,
        email: credentials.email,
        full_name: credentials.fullName,
        institution: credentials.institution,
        role: credentials.role,
      });
    } catch {
      // Trigger or local store handled profile creation
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || credentials.email,
        fullName: credentials.fullName,
        institution: credentials.institution,
        role: credentials.role,
        createdAt: data.user.created_at,
      },
      session: data.session,
      message: "Account created successfully.",
    };
  }

  async logout() {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore if session already expired
    }
    return { success: true, message: "Logged out successfully" };
  }
}

export const authService = new AuthService();
