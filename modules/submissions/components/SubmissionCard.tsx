"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Submission } from "../types/submission.types";

export interface SubmissionCardProps {
  submission: Submission;
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const statusConfig: Record<string, { variant: "success" | "primary" | "warning" | "danger"; label: string; description: string }> = {
    completed: {
      variant: "success",
      label: "Completed",
      description: "Viva defense completed. Evaluation report ready.",
    },
    submitted: {
      variant: "success",
      label: "Completed",
      description: "Viva defense completed. Evaluation report ready.",
    },
    ready: {
      variant: "primary",
      label: "Ready for Viva",
      description: "Concept analysis complete. Ready for defense.",
    },
    processing: {
      variant: "primary",
      label: "Ready for Viva",
      description: "Document stored. Ready for viva examination.",
    },
    uploaded: {
      variant: "primary",
      label: "Ready for Viva",
      description: "Document stored. Ready for viva examination.",
    },
    failed: {
      variant: "warning",
      label: "Ready for Viva",
      description: "Ready for viva examination.",
    },
  };

  const status = statusConfig[submission.status] || statusConfig.ready;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card hoverable className="flex flex-col justify-between">
      <div>
        <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={status.variant} size="sm">
                {status.label}
              </Badge>
              <span className="text-[11px] text-[#697080]">
                Submitted {formatDate(submission.created_at)}
              </span>
            </div>
            <CardTitle className="text-base line-clamp-2 mt-1">
              {submission.title}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center gap-2 text-xs text-[#697080]">
            <svg className="w-4 h-4 text-[#697080]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="truncate max-w-[200px]">{submission.original_filename}</span>
            <span>·</span>
            <span>{formatFileSize(submission.file_size)}</span>
          </div>

          {submission.extracted_topics && submission.extracted_topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {submission.extracted_topics.slice(0, 3).map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E8EAF0] text-[11px] text-[#171923]"
                >
                  {topic}
                </span>
              ))}
              {submission.extracted_topics.length > 3 && (
                <span className="text-[11px] text-[#697080] self-center">
                  +{submission.extracted_topics.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-3">
        <Link href={`/submissions/${submission.id}`} className="text-xs text-[#4F46E5] hover:underline font-medium">
          View Details
        </Link>

        {submission.status === "completed" || submission.status === "submitted" ? (
          <Link href={`/reports/${submission.viva_session_id || submission.id}`}>
            <Button size="sm" variant="outline" className="border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4]">
              View Evaluation Report →
            </Button>
          </Link>
        ) : (
          <Link href={`/viva/${submission.viva_session_id || submission.id}`}>
            <Button size="sm" variant="primary">
              Start Oral Viva →
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
