"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { useAuth } from "../hooks/useAuth";

export function RegisterForm() {
  const { register, isLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");

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

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-xl">Create Academic Account</CardTitle>
        <CardDescription>
          Join your university's oral viva examination portal with verifiable assessment.
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
            label="Full Name"
            type="text"
            placeholder="Dr. / Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Institutional Email"
            type="email"
            placeholder="j.doe@ox.ac.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="University / Institution"
            type="text"
            placeholder="University of Oxford"
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
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
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
      </form>
    </Card>
  );
}
