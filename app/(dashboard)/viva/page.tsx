"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface VivaHubItem {
  id: string;
  submissionId: string;
  submissionTitle: string;
  totalQuestions: number;
  answeredQuestions: number;
  status: string;
}

export default function VivaHubPage() {
  const [sessions, setSessions] = useState<VivaHubItem[]>([
    {
      id: "viva_mock_01",
      submissionId: "sub_mock_01",
      submissionTitle: "Self-Supervised Contrastive Representation Learning in Graph Neural Networks",
      totalQuestions: 4,
      answeredQuestions: 1,
      status: "in_progress",
    },
  ]);

  useEffect(() => {
    fetch("/api/viva", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data?.sessions || json?.sessions;
        if (Array.isArray(list) && list.length > 0) {
          setSessions(list);
        }
      })
      .catch(() => {
        // Retain default list
      });
  }, []);

  return (
    <DashboardShell
      title="Oral Viva Examination Hub"
      subtitle="Engage in structured oral defense sessions powered by the independent AI pipeline."
    >
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-xl border border-[#E8EAF0] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="primary" size="sm">
              Standard Academic Protocol
            </Badge>
            <h2 className="text-lg font-bold text-[#171923]">
              Active Viva Examinations
            </h2>
            <p className="text-xs text-[#697080] max-w-xl">
              Each session contains 4–6 dynamic questions evaluating your theoretical understanding, implementation claims, and edge-case handling. Responses are recorded via microphone and analyzed in real-time.
            </p>
          </div>

          <Link href="/submissions">
            <Button variant="secondary" size="md">
              Browse Submissions
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => {
            const isCompleted = session.status === "completed";
            return (
              <Card key={session.id} hoverable>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <Badge variant={isCompleted ? "success" : "warning"} size="sm">
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                    <CardTitle className="mt-2 text-base line-clamp-2">
                      {session.submissionTitle}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#697080]">
                    <span>Examination Progress:</span>
                    <span className="font-medium text-[#171923]">
                      {session.answeredQuestions ?? 0} / {session.totalQuestions} Questions
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#697080]">
                    <span>Status:</span>
                    <span
                      className={`font-medium ${
                        isCompleted ? "text-[#16A34A]" : "text-[#D97706]"
                      }`}
                    >
                      {isCompleted ? "Evaluation Report Ready" : "Ready for Oral Defense"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  {isCompleted ? (
                    <Link href={`/reports/${session.id}`}>
                      <Button variant="primary" size="sm">
                        View Evaluation Report →
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/viva/${session.id}`}>
                      <Button variant="primary" size="sm">
                        Enter Examination Room →
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
