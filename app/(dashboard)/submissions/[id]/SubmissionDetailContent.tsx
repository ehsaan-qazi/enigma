"use client";

import React, { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSubmissions } from "@/modules/submissions/hooks/useSubmissions";

export function SubmissionDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentSubmission, isLoading } = useSubmissions(id);

  if (isLoading || !currentSubmission) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-48" />
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  const isReady = currentSubmission.status === "ready";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/submissions"
          className="inline-flex items-center gap-1.5 text-xs text-[#697080] hover:text-[#171923] font-medium transition-colors"
        >
          ← Back to Submissions
        </Link>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant={isReady ? "success" : "warning"}
                size="sm"
              >
                {isReady ? "Ready for Viva" : "Analysis In Progress"}
              </Badge>
              <span className="text-xs text-[#697080]">
                Uploaded {new Date(currentSubmission.created_at).toLocaleDateString()}
              </span>
            </div>
            <CardTitle className="text-xl">
              {currentSubmission.title}
            </CardTitle>
            <CardDescription className="mt-1">
              File: {currentSubmission.original_filename} ({(currentSubmission.file_size / (1024 * 1024)).toFixed(2)} MB)
            </CardDescription>
          </div>

          {isReady && (
            <Link href={`/viva/${currentSubmission.viva_session_id || currentSubmission.id}`}>
              <Button variant="primary" size="lg">
                Launch Interactive Viva
              </Button>
            </Link>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h4 className="text-xs font-semibold text-[#171923] uppercase tracking-wider mb-2">
              Concept & Claim Extraction Status
            </h4>
            <p className="text-xs text-[#697080] leading-relaxed">
              The Python AI pipeline analyzes the methodology, theoretical grounding, empirical results, and cited authorities to generate high-fidelity viva prompts with adaptive follow-up branches.
            </p>
          </div>

          {currentSubmission.extracted_topics && currentSubmission.extracted_topics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#171923] uppercase tracking-wider mb-3">
                Identified Assessment Domains ({currentSubmission.extracted_topics.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentSubmission.extracted_topics.map((topic, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] flex items-center gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-[#171923]">
                      {topic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
