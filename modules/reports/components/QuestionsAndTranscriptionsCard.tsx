"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuestionResponseItem } from "../types/report.types";

export interface QuestionsAndTranscriptionsCardProps {
  questions?: QuestionResponseItem[];
}

export function QuestionsAndTranscriptionsCard({
  questions = [],
}: QuestionsAndTranscriptionsCardProps) {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card border-[#E8EAF0]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base">🎙️</span>
              <CardTitle>Oral Viva Questions & Spoken Defense Log</CardTitle>
            </div>
            <CardDescription>
              Complete verbatim speech transcriptions and conceptual evaluations recorded during this oral defense examination.
            </CardDescription>
          </div>
          <Badge variant="primary" size="sm">
            {questions.length} Questions Defended
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {questions.map((item, idx) => (
          <div
            key={item.question_id || idx}
            className="rounded-xl border border-[#E8EAF0] bg-white p-5 space-y-4 hover:border-[#CBD5E1] transition-all"
          >
            {/* Question Header & Concept */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold flex items-center justify-center">
                  {item.sequence_number || idx + 1}
                </span>
                <span className="text-xs font-semibold text-[#171923]">
                  Question {item.sequence_number || idx + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm" className="bg-[#F8FAFC]">
                  Concept: {item.concept}
                </Badge>
                {item.duration_seconds ? (
                  <span className="text-[11px] text-[#697080]">
                    Duration: {item.duration_seconds}s
                  </span>
                ) : null}
              </div>
            </div>

            {/* Examiner Inquired */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Oral Examination Question
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#1E293B] leading-relaxed">
                {item.question_text}
              </p>
            </div>

            {/* Student's Spoken Transcription */}
            <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16A34A] uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                  Student&apos;s Spoken Transcription
                </div>
                <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] font-medium px-2 py-0.5 rounded-full">
                  Speech-to-Text Captured
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#0F172A] italic leading-relaxed bg-white/70 p-3 rounded-md border border-[#BBF7D0]/60">
                &ldquo;{item.transcription}&rdquo;
              </p>
            </div>

            {/* Optional AI Feedback & Scores */}
            {(item.correctness !== undefined || item.feedback) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-[#697080]">
                {item.feedback ? (
                  <p className="text-[11px] text-[#475569] leading-normal flex-1">
                    <strong className="text-[#171923]">Examiner Assessment:</strong> {item.feedback}
                  </p>
                ) : null}
                {item.correctness !== undefined ? (
                  <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold">
                    <span className="text-[#16A34A]">Correctness: {item.correctness}%</span>
                    {item.completeness !== undefined ? (
                      <span className="text-[#4F46E5]">Completeness: {item.completeness}%</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
