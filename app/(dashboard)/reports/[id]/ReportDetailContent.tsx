"use client";

import React, { use } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useReport } from "@/modules/reports/hooks/useReport";
import { ReportSummaryHeader } from "@/modules/reports/components/ReportSummaryHeader";
import { ConceptMasteryBar } from "@/modules/reports/components/ConceptMasteryBar";
import { MisconceptionCard } from "@/modules/reports/components/MisconceptionCard";

export function ReportDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { report, isLoading, error } = useReport(id);

  if (isLoading || !report) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-44" />
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-xs text-[#697080] hover:text-[#171923] font-medium transition-colors"
        >
          ← Back to Reports
        </Link>
      </div>

      {/* Main Header & Scores */}
      <ReportSummaryHeader report={report} />

      {/* Concepts Mastery Breakdown */}
      <ConceptMasteryBar concepts={report.demonstrated_concepts} />

      {/* Misconceptions & Gaps */}
      <MisconceptionCard misconceptions={report.misconceptions} />

      {/* Recommended Next Actions */}
      {report.recommended_actions && report.recommended_actions.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Actionable Remediation Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {report.recommended_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-[#171923]">
                  <span className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
