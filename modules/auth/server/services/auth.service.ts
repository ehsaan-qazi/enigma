import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "../repositories/profile.repository";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { UnauthorizedError, BadRequestError } from "@/lib/api/errors";
import { User } from "@supabase/supabase-js";

export interface AuthContext {
  user: User;
  userId: string;
}

/**
 * Verifies that the incoming request has a valid Supabase authenticated user session.
 * In offline local dev mode with placeholder credentials, provides a deterministic mock user.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const isMockDev =
      process.env.NODE_ENV === "development" &&
      (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref"));

    if (isMockDev) {
      const mockUser = {
        id: "00000000-0000-0000-0000-000000000001",
        email: "student@enigma.edu",
        app_metadata: {},
        user_metadata: { full_name: "Ahmed Al-Mansoor" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;

      return {
        user: mockUser,
        userId: mockUser.id,
      };
    }

    throw new UnauthorizedError("Authentication required. Please log in.");
  }

  return {
    user,
    userId: user.id,
  };
}

export class AuthService {
  async login(credentials: LoginInput) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.user) {
        if (
          process.env.NODE_ENV === "development" &&
          (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
            process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"))
        ) {
          return {
            user: {
              id: "00000000-0000-0000-0000-000000000001",
              email: credentials.email,
              fullName: "Ahmed Al-Mansoor",
              institution: "Imperial College London",
              role: "student" as const,
              createdAt: new Date().toISOString(),
            },
            message: "Authenticated successfully (Mock Adapter).",
          };
        }
        throw new BadRequestError(error?.message || "Invalid email or password");
      }

      const profile = await profileRepository.findById(data.user.id);

      return {
        user: {
          id: data.user.id,
          email: data.user.email || credentials.email,
          fullName: profile?.full_name || "Enigma Student",
          institution: profile?.institution || "Imperial College London",
          role: profile?.role || "student",
          createdAt: data.user.created_at,
        },
        session: data.session,
        message: "Authenticated successfully.",
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestError || err instanceof UnauthorizedError) throw err;
      if (process.env.NODE_ENV === "development") {
        return {
          user: {
            id: "00000000-0000-0000-0000-000000000001",
            email: credentials.email,
            fullName: "Ahmed Al-Mansoor",
            institution: "Imperial College London",
            role: "student" as const,
            createdAt: new Date().toISOString(),
          },
          message: "Authenticated successfully (Mock Adapter).",
        };
      }
      throw new BadRequestError(err instanceof Error ? err.message : "Failed to log in.");
    }
  }

  async register(credentials: RegisterInput) {
    try {
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
        if (
          process.env.NODE_ENV === "development" &&
          (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
            process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"))
        ) {
          return {
            user: {
              id: "00000000-0000-0000-0000-000000000001",
              email: credentials.email,
              fullName: credentials.fullName,
              institution: credentials.institution,
              role: credentials.role,
              createdAt: new Date().toISOString(),
            },
            message: "Account created successfully (Mock Adapter).",
          };
        }
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
        // Trigger or concurrent write may have populated profile
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
    } catch (err: unknown) {
      if (err instanceof BadRequestError) throw err;
      if (process.env.NODE_ENV === "development") {
        return {
          user: {
            id: "00000000-0000-0000-0000-000000000001",
            email: credentials.email,
            fullName: credentials.fullName,
            institution: credentials.institution,
            role: credentials.role,
            createdAt: new Date().toISOString(),
          },
          message: "Account created successfully (Mock Adapter).",
        };
      }
      throw new BadRequestError(err instanceof Error ? err.message : "Failed to create account.");
    }
  }

  async logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true, message: "Logged out successfully" };
  }
}

export const authService = new AuthService();
