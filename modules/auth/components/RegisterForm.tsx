"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../hooks/useAuth";

export function RegisterForm() {
  const router = useRouter();
  const { register, loginWithGoogle, isLoading, isGoogleLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");
  const [urlError, setUrlError] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      return err ? decodeURIComponent(err) : null;
    }
    return null;
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({
      fullName,
      email,
      institution,
      password,
      role: "student",
    });
  };

  const displayError = error || urlError;

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-xl">Create Academic Account</CardTitle>
        <CardDescription>
          Join your university&apos;s oral viva examination portal with Google or your institutional email.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayError && (
          <Alert variant="error" onDismiss={() => { clearError(); setUrlError(null); }}>
            {displayError}
          </Alert>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2.5 py-2.5 border-[#E8EAF0] hover:bg-[#F7F8FA] text-[#171923] font-medium"
          onClick={loginWithGoogle}
          isLoading={isGoogleLoading}
          disabled={isLoading || isGoogleLoading}
          leftIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
          }
        >
          Continue with Google
        </Button>

        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-[#E8EAF0]" />
          <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-[#697080] font-medium">
            Or register with email
          </span>
          <div className="grow border-t border-[#E8EAF0]" />
        </div>

        <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Institutional Email"
            type="email"
            placeholder="j.doe@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="University / Institution"
            type="text"
            placeholder="University Name"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <Button
          type="submit"
          form="register-form"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading || isGoogleLoading}
          variant="primary"
        >
          Create Account
        </Button>

        <p className="text-xs text-[#697080] text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
