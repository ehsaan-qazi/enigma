"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSubmissions } from "@/modules/submissions/hooks/useSubmissions";
import { useReport } from "@/modules/reports/hooks/useReport";

export default function DashboardPage() {
  const { submissions, isLoading: isSubmissionsLoading } = useSubmissions();
  const { reports } = useReport();

  const pendingOrReadySubmissions = submissions.filter(
    (s) => s.status !== "completed" && s.status !== "submitted"
  );
  const completedSubmissions = submissions.filter(
    (s) => s.status === "completed" || s.status === "submitted"
  );
  const featuredSubmission = pendingOrReadySubmissions[0] || completedSubmissions[0] || submissions[0];
  const isFeaturedCompleted =
    featuredSubmission?.status === "completed" || featuredSubmission?.status === "submitted";
  const latestReport = reports[0];

  const stats = [
    {
      label: "Academic Submissions",
      value: String(submissions.length),
      change: `${pendingOrReadySubmissions.length} ready for defense`,
      icon: "📄",
    },
    {
      label: "Viva Examinations",
      value: String(reports.length),
      change: reports.length > 0 ? "Completed sessions" : "No sessions yet",
      icon: "🎙️",
    },
    {
      label: "Mastery Rating",
      value: latestReport ? `${latestReport.overall_score}%` : "—",
      change: latestReport ? `${latestReport.mastery_tier} grade` : "Pending first viva",
      icon: "★",
    },
    {
      label: "Remediation Gaps",
      value: latestReport ? String(latestReport.misconceptions?.length ?? 0) : "0",
      change: latestReport ? "Diagnostic report ready" : "No gaps recorded",
      icon: "🎯",
    },
  ];

  return (
    <DashboardShell
      title="Student Overview Dashboard"
      subtitle="Welcome to your academic oral viva defense portal."
    >
      <div className="space-y-6">
        {/* Top Callout */}
        {featuredSubmission ? (
          <div className="p-6 bg-white rounded-xl border border-[#E8EAF0] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Badge variant={isFeaturedCompleted ? "success" : "primary"} size="sm">
                {isFeaturedCompleted ? "Completed" : "Ready for Viva"}
              </Badge>
              <h2 className="text-xl font-bold text-[#171923]">
                {featuredSubmission.title}
              </h2>
              <p className="text-xs text-[#697080] max-w-2xl leading-relaxed">
                {isFeaturedCompleted
                  ? "Your oral viva defense has been successfully completed. You can view the comprehensive evaluation report."
                  : featuredSubmission.concepts_count
                  ? `Your paper has been parsed by the AI pipeline across ${featuredSubmission.concepts_count} extracted concepts and is ready for oral defense.`
                  : "Your uploaded paper is ready for oral viva examination."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isFeaturedCompleted ? (
                <Link
                  href={`/reports/${featuredSubmission.viva_session_id || featuredSubmission.id}`}
                >
                  <Button variant="outline" size="md" className="border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4]">
                    View Evaluation Report →
                  </Button>
                </Link>
              ) : (
                <Link
                  href={`/viva/${featuredSubmission.viva_session_id || featuredSubmission.id}`}
                >
                  <Button variant="primary" size="md">
                    Launch Oral Viva →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          !isSubmissionsLoading && (
            <div className="p-6 bg-white rounded-xl border border-[#E8EAF0] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <Badge variant="primary" size="sm">
                  Get Started
                </Badge>
                <h2 className="text-xl font-bold text-[#171923]">
                  Upload Your First Academic Paper
                </h2>
                <p className="text-xs text-[#697080] max-w-2xl leading-relaxed">
                  Upload a PDF dissertation, research paper, or technical report to extract core concepts and start an AI-powered oral viva examination.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link href="/submissions">
                  <Button variant="primary" size="md">
                    Upload PDF Submission →
                  </Button>
                </Link>
              </div>
            </div>
          )
        )}

        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="shadow-subtle">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#697080]">
                    {stat.label}
                  </span>
                  <div className="text-2xl font-bold text-[#171923] mt-1">
                    {stat.value}
                  </div>
                  <span className="text-[11px] text-[#4F46E5] font-medium mt-0.5 block">
                    {stat.change}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] text-lg flex items-center justify-center">
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Hub & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 shadow-card flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>Academic Actions</CardTitle>
                <CardDescription>
                  Workflow shortcuts for student oral examination.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/submissions" className="block">
                  <div className="p-3.5 rounded-lg border border-[#E8EAF0] hover:border-[#4F46E5]/40 hover:bg-[#EEF2FF]/30 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#171923]">
                        Upload Academic Work
                      </div>
                      <div className="text-[11px] text-[#697080]">
                        Submit dissertation or research PDF
                      </div>
                    </div>
                    <span className="text-sm text-[#4F46E5]">→</span>
                  </div>
                </Link>

                <Link href="/viva" className="block">
                  <div className="p-3.5 rounded-lg border border-[#E8EAF0] hover:border-[#4F46E5]/40 hover:bg-[#EEF2FF]/30 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#171923]">
                        Oral Examination Room
                      </div>
                      <div className="text-[11px] text-[#697080]">
                        Browser audio voice recorder
                      </div>
                    </div>
                    <span className="text-sm text-[#4F46E5]">→</span>
                  </div>
                </Link>

                <Link href="/reports" className="block">
                  <div className="p-3.5 rounded-lg border border-[#E8EAF0] hover:border-[#4F46E5]/40 hover:bg-[#EEF2FF]/30 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#171923]">
                        Diagnostic Reports
                      </div>
                      <div className="text-[11px] text-[#697080]">
                        Concept mastery & misconception logs
                      </div>
                    </div>
                    <span className="text-sm text-[#4F46E5]">→</span>
                  </div>
                </Link>
              </CardContent>
            </div>

            <CardFooter>
              <span className="text-[11px] text-[#697080]">
                All sessions recorded under academic honor code.
              </span>
            </CardFooter>
          </Card>

          {/* Recent Evaluations Preview */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Viva Evaluation</CardTitle>
                <CardDescription>
                  Verified assessment report generated by the evaluation engine.
                </CardDescription>
              </div>
              {latestReport && (
                <Link href={`/reports/${latestReport.id}`}>
                  <Button variant="outline" size="sm">
                    View Full Report
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {latestReport ? (
                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {latestReport.mastery_tier}
                      </Badge>
                      <span className="text-xs text-[#697080]">
                        Score: <strong className="text-[#171923]">{latestReport.overall_score}%</strong>
                      </span>
                    </div>
                    <span className="text-xs text-[#697080]">
                      {new Date(latestReport.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#171923] leading-relaxed line-clamp-3">
                    &ldquo;{latestReport.summary_narrative}&rdquo;
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#697080]">
                    {(latestReport.demonstrated_concepts || []).slice(0, 3).map((c, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-white border border-[#E8EAF0] text-[11px]"
                      >
                        {c.name}: {c.score}%
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] text-center space-y-2">
                  <p className="text-xs font-medium text-[#171923]">
                    No Completed Viva Evaluations Yet
                  </p>
                  <p className="text-xs text-[#697080]">
                    Upload an academic PDF and complete your first oral defense to generate a diagnostic mastery report.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
