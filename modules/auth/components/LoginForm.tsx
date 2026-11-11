"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { useAuth } from "../hooks/useAuth";

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-xl">Sign in to Enigma</CardTitle>
        <CardDescription>
          Enter your institutional credentials to access your academic vivas and assessment reports.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="error" onDismiss={clearError}>
              {error}
            </Alert>
          )}

          <Input
            label="Academic Email"
            type="email"
            placeholder="student@university.ac.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            variant="primary"
          >
            Sign In
          </Button>

          <p className="text-xs text-[#697080] text-center">
            New to Enigma?{" "}
            <Link
              href="/register"
              className="text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors"
            >
              Create an academic account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
