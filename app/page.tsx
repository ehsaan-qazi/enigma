import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { HeroActionButtons } from "@/components/home/HeroActionButtons";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="h-16 border-b border-[#E8EAF0] bg-white/90 backdrop-blur-xs px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] text-white font-bold flex items-center justify-center text-sm shadow-subtle">
            E
          </div>
          <span className="font-semibold text-base text-[#171923] tracking-tight">
            ENIGMA
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Register
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        <Badge variant="primary" size="md" className="mb-6">
          Evidence-Based Oral Assessment Engine
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#171923] tracking-tight max-w-3xl leading-[1.15]">
          Verifiable Academic Understanding Through Intelligent Voice Viva
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#697080] max-w-2xl leading-relaxed">
          Enigma replaces static multiple-choice tests with structured oral examinations.
          Upload your thesis or research, engage in an adaptive audio viva, and receive deep conceptual evaluation.
        </p>

        <HeroActionButtons />

        {/* 3-Step Process Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <Card hoverable className="border-[#E8EAF0]">
            <CardHeader>
              <div className="w-8 h-8 rounded-md bg-[#EEF2FF] text-[#4F46E5] font-semibold text-xs flex items-center justify-center mb-2">
                01
              </div>
              <CardTitle>Concept Extraction</CardTitle>
              <CardDescription>
                Automated document parsing extracts key claims, methodologies, and technical terminology from uploaded PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-[#697080]">
                Strict provenance verification ensures viva questions directly address student work.
              </span>
            </CardContent>
          </Card>

          <Card hoverable className="border-[#E8EAF0]">
            <CardHeader>
              <div className="w-8 h-8 rounded-md bg-[#EEF2FF] text-[#4F46E5] font-semibold text-xs flex items-center justify-center mb-2">
                02
              </div>
              <CardTitle>Interactive Voice Viva</CardTitle>
              <CardDescription>
                Dynamic oral examination with live browser speech capture, difficulty scaling, and probing follow-up questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-[#697080]">
                Tests genuine synthesis and prevents surface-level memorization through targeted counter-inquiries.
              </span>
            </CardContent>
          </Card>

          <Card hoverable className="border-[#E8EAF0]">
            <CardHeader>
              <div className="w-8 h-8 rounded-md bg-[#EEF2FF] text-[#4F46E5] font-semibold text-xs flex items-center justify-center mb-2">
                03
              </div>
              <CardTitle>Diagnostic Reports</CardTitle>
              <CardDescription>
                Comprehensive analysis detailing demonstrated mastery, identified misconceptions, and targeted remediation steps.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-[#697080]">
                Actionable feedback supported by excerpted evidence from both the document and spoken answers.
              </span>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8EAF0] bg-white py-6 px-6 lg:px-12 text-center text-xs text-[#697080]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#171923]">ENIGMA</span>
            <span>·</span>
            <span>Modular Monolith & Independent AI Architecture</span>
          </div>
          <div>
            Built with Next.js, Supabase & FastAPI
          </div>
        </div>
      </footer>
    </div>
  );
}
