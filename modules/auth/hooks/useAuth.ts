"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoginCredentials, RegisterCredentials, UserProfile } from "../types/auth.types";
import { loginUser, registerUser } from "../services/auth-api";
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred during login.";
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    user,
    isLoading,
    error,
    clearError: () => setError(null),
    login,
    register,
  };
}
