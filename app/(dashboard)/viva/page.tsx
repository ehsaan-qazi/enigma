"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface VivaHubItem {
  id: string;
  submissionId: string;
  submissionTitle: string;
  totalQuestions: number;
  answeredQuestions: number;
  status: string;
}

export default function VivaHubPage() {
  const [sessions, setSessions] = useState<VivaHubItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/viva", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data?.sessions || json?.sessions;
        if (Array.isArray(list)) {
          setSessions(list);
        }
      })
      .catch(() => {
        setSessions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <DashboardShell
      title="Oral Viva Examination Hub"
      subtitle="Engage in structured oral defense sessions powered by the AI pipeline."
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
              Each session contains dynamic questions evaluating your theoretical understanding, implementation claims, and edge-case handling. Responses are recorded via microphone and analyzed in real-time.
            </p>
          </div>

          <Link href="/submissions">
            <Button variant="secondary" size="md">
              Browse Submissions
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton variant="rectangular" className="h-44" />
            <Skeleton variant="rectangular" className="h-44" />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-[#E8EAF0] shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto text-xl font-bold">
              🎙️
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-semibold text-[#171923]">
                No Viva Sessions Started Yet
              </h3>
              <p className="text-xs text-[#697080] mt-1">
                Upload an academic PDF in the Submissions tab to automatically generate viva questions and begin your oral defense.
              </p>
            </div>
            <Link href="/submissions">
              <Button variant="primary">Upload Academic Paper</Button>
            </Link>
          </div>
        )}

        {!isLoading && sessions.length > 0 && (
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
        )}
      </div>
    </DashboardShell>
  );
}
