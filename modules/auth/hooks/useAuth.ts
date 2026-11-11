"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoginCredentials, RegisterCredentials, UserProfile } from "../types/auth.types";
import { loginUser, registerUser, signInWithGoogle, logoutUser } from "../services/auth-api";
import {
  validateEmail,
  validatePassword,
  validateFullName,
  validateInstitution,
} from "../schemas/auth.schema";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setError(null);

      const emailErr = validateEmail(credentials.email);
      if (emailErr) {
        setError(emailErr);
        return;
      }

      const passErr = validatePassword(credentials.password);
      if (passErr) {
        setError(passErr);
        return;
      }

      setIsLoading(true);
      try {
        const response = await loginUser(credentials);
        setUser(response.user);
        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred during sign in.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      setError(null);

      const nameErr = validateFullName(credentials.fullName);
      if (nameErr) {
        setError(nameErr);
        return;
      }

      const emailErr = validateEmail(credentials.email);
      if (emailErr) {
        setError(emailErr);
        return;
      }

      const instErr = validateInstitution(credentials.institution);
      if (instErr) {
        setError(instErr);
        return;
      }

      const passErr = validatePassword(credentials.password);
      if (passErr) {
        setError(passErr);
        return;
      }

      setIsLoading(true);
      try {
        const response = await registerUser(credentials);
        setUser(response.user);
        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred during registration.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google.";
      setError(message);
      setIsGoogleLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  return {
    user,
    isLoading,
    isGoogleLoading,
    error,
    clearError: () => setError(null),
    login,
    register,
    loginWithGoogle,
    logout,
  };
}
