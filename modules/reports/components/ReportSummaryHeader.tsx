"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AssessmentReport } from "../types/report.types";

export interface ReportSummaryHeaderProps {
  report: AssessmentReport;
}

export function ReportSummaryHeader({ report }: ReportSummaryHeaderProps) {
  const tierVariants = {
    "High Distinction": "success" as const,
    Distinction: "primary" as const,
    Merit: "primary" as const,
    Pass: "warning" as const,
    Developing: "danger" as const,
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8EAF0] p-6 shadow-card space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8EAF0]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              Official Assessment
            </Badge>
            <span className="text-xs text-[#697080]">
              Completed on {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#171923] tracking-tight">
            Oral Viva Evaluation Report
          </h2>
          <p className="text-xs text-[#697080]">
            Candidate: <span className="font-semibold text-[#171923]">{report.student_name}</span> · Paper: <span className="font-medium text-[#171923]">{report.submission_title}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            }
          >
            Export / Print PDF
          </Button>
        </div>
      </div>

      {/* Score Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#697080]">
              Overall Viva Score
            </span>
            <div className="text-3xl font-extrabold text-[#4F46E5] mt-0.5">
              {report.overall_score}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-bold text-sm flex items-center justify-center">
            ★
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#697080]">
              Mastery Classification
            </span>
            <div className="mt-1.5">
              <Badge variant={tierVariants[report.mastery_tier] || "primary"} size="md">
                {report.mastery_tier}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#697080]">
              Identified Gaps
            </span>
            <div className="text-3xl font-extrabold text-[#171923] mt-0.5">
              {report.misconceptions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Evaluator Narrative */}
      <div className="pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#171923] mb-2">
          Synthesis & Examination Summary
        </h4>
        <p className="text-xs sm:text-sm text-[#171923] leading-relaxed bg-[#F7F8FA] p-4 rounded-xl border border-[#E8EAF0]">
          {report.summary_narrative}
        </p>
      </div>
    </div>
  );
}
