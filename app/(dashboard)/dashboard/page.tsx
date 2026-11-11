"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const stats = [
    {
      label: "Academic Submissions",
      value: "2",
      change: "1 ready for defense",
      icon: "📄",
    },
    {
      label: "Viva Examinations",
      value: "1",
      change: "1 in progress",
      icon: "🎙️",
    },
    {
      label: "Mastery Rating",
      value: "87%",
      change: "Distinction grade",
      icon: "★",
    },
    {
      label: "Remediation Gaps",
      value: "1",
      change: "Action plan available",
      icon: "🎯",
    },
  ];

  return (
    <DashboardShell
      title="Student Overview Dashboard"
      subtitle="Welcome to your academic oral viva defense portal."
    >
      <div className="space-y-6">
        {/* Welcome Callout */}
        <div className="p-6 bg-white rounded-xl border border-[#E8EAF0] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="primary" size="sm">
              Oral Defense Ready
            </Badge>
            <h2 className="text-xl font-bold text-[#171923]">
              Self-Supervised Contrastive Representation Learning in Graph Neural Networks
            </h2>
            <p className="text-xs text-[#697080] max-w-2xl leading-relaxed">
              Your paper has been fully parsed by the AI pipeline. 4 oral viva questions across 14 extracted concepts are ready for oral response.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/viva/viva_mock_01">
              <Button variant="primary" size="md">
                Launch Oral Viva →
              </Button>
            </Link>
          </div>
        </div>

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
              <Link href="/reports/rep_viva_mock_01">
                <Button variant="outline" size="sm">
                  View Full Report
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      Distinction
                    </Badge>
                    <span className="text-xs text-[#697080]">
                      Score: <strong className="text-[#171923]">87%</strong>
                    </span>
                  </div>
                  <span className="text-xs text-[#697080]">
                    Evaluated today
                  </span>
                </div>

                <p className="text-xs text-[#171923] leading-relaxed line-clamp-3">
                  "The candidate demonstrated comprehensive theoretical and empirical command over self-supervised contrastive learning in graph representations. Spoken answers clearly articulated the mathematical derivations of InfoNCE and community clustering preservation."
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#697080]">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E8EAF0] text-[11px]">
                    InfoNCE Derivation: 94%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E8EAF0] text-[11px]">
                    Graph Augmentation: 88%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E8EAF0] text-[11px]">
                    Neighbor Aggregation: 82%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
