import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { VivaSessionContent } from "./VivaSessionContent";

export default function VivaSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardShell
      title="Oral Viva Examination"
      subtitle="Verbal knowledge verification and synthesis assessment."
    >
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton variant="rectangular" className="h-16" />
            <Skeleton variant="rectangular" className="h-44" />
            <Skeleton variant="rectangular" className="h-64" />
          </div>
        }
      >
        <VivaSessionContent params={params} />
      </Suspense>
    </DashboardShell>
  );
}
