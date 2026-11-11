import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReportDetailContent } from "./ReportDetailContent";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardShell
      title="Viva Diagnostic Assessment"
      subtitle="Verifiable evidence, concept mastery scores, and identified misconceptions."
    >
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton variant="rectangular" className="h-44" />
            <Skeleton variant="rectangular" className="h-64" />
          </div>
        }
      >
        <ReportDetailContent params={params} />
      </Suspense>
    </DashboardShell>
  );
}
