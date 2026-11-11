import React from "react";
import Link from "next/link";
import { LoginForm } from "@/modules/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-lg bg-[#4F46E5] text-white font-bold flex items-center justify-center text-sm shadow-subtle">
            E
          </div>
          <span className="font-bold text-xl text-[#171923] tracking-tight">
            ENIGMA
          </span>
        </Link>
        <p className="text-xs text-[#697080]">
          Oral Viva Assessment & Concept Verification Platform
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
