import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { SubmissionDetailContent } from "./SubmissionDetailContent";

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardShell
      title="Academic Submission Overview"
      subtitle="Detailed concept extraction and examination status."
    >
      <Suspense fallback={<Skeleton variant="rectangular" className="h-64" />}>
        <SubmissionDetailContent params={params} />
      </Suspense>
    </DashboardShell>
  );
}
