"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useReport } from "@/modules/reports/hooks/useReport";

export default function ReportsListPage() {
  const { reports, isLoading } = useReport();

  return (
    <DashboardShell
      title="Assessment Reports"
      subtitle="Review comprehensive diagnostic evaluations and mastery records from your viva defenses."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8EAF0]">
          <div>
            <h2 className="text-lg font-bold text-[#171923]">
              Completed Viva Records
            </h2>
            <p className="text-xs text-[#697080]">
              {reports.length} {reports.length === 1 ? "official assessment" : "official assessments"} on file
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <Card key={report.id} hoverable>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {report.mastery_tier}
                    </Badge>
                    <span className="text-[11px] text-[#697080]">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-2 mt-1">
                    {report.submission_title}
                  </CardTitle>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-[#4F46E5]">
                    {report.overall_score}%
                  </span>
                  <div className="text-[10px] text-[#697080]">Score</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-[#697080] line-clamp-2">
                  {report.summary_narrative}
                </p>

                <div className="flex items-center gap-4 text-xs text-[#697080] pt-1 border-t border-[#E8EAF0]/60">
                  <span>Concepts Tested: <strong className="text-[#171923]">{report.demonstrated_concepts.length}</strong></span>
                  <span>·</span>
                  <span>Gaps Identified: <strong className="text-[#171923]">{report.misconceptions.length}</strong></span>
                </div>
              </CardContent>

              <CardFooter className="justify-end">
                <Link href={`/reports/${report.id}`}>
                  <Button variant="primary" size="sm">
                    View Complete Report →
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
