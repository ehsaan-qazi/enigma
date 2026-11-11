"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSubmissions } from "@/modules/submissions/hooks/useSubmissions";
import { SubmissionCard } from "@/modules/submissions/components/SubmissionCard";
import { UploadForm } from "@/modules/submissions/components/UploadForm";

export default function SubmissionsPage() {
  const { submissions, isLoading, error } = useSubmissions();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <DashboardShell
      title="Academic Submissions"
      subtitle="Manage your uploaded research papers, theses, and dissertations for viva examination."
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8EAF0]">
        <div>
          <h2 className="text-lg font-bold text-[#171923]">
            Uploaded Papers & Theses
          </h2>
          <p className="text-xs text-[#697080]">
            {submissions.length} {submissions.length === 1 ? "document" : "documents"} registered
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Submit Academic Work
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton variant="rectangular" className="h-48" />
          <Skeleton variant="rectangular" className="h-48" />
        </div>
      )}

      {!isLoading && submissions.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-[#E8EAF0] shadow-subtle space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto text-xl font-bold">
            📄
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-semibold text-[#171923]">No Academic Submissions Yet</h3>
            <p className="text-xs text-[#697080] mt-1">
              Upload your dissertation, thesis, or academic paper in PDF format to initiate concept extraction and prepare your viva examination.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
            Upload First Document
          </Button>
        </div>
      )}

      {!isLoading && submissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        size="lg"
      >
        <UploadForm
          onSuccess={() => setIsUploadModalOpen(false)}
          onCancel={() => setIsUploadModalOpen(false)}
        />
      </Modal>
    </DashboardShell>
  );
}
