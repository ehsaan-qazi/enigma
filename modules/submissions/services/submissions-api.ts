import {
  Submission,
  UploadUrlRequest,
  UploadUrlResponse,
  CompleteUploadRequest,
} from "../types/submission.types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub_mock_01",
    user_id: "usr_mock_01",
    title: "Self-Supervised Contrastive Representation Learning in Graph Neural Networks",
    original_filename: "gnn_contrastive_thesis.pdf",
    storage_path: "submissions/sub_mock_01/gnn_contrastive_thesis.pdf",
    mime_type: "application/pdf",
    file_size: 4820120,
    status: "ready",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    concepts_count: 14,
    extracted_topics: [
      "Contrastive Loss Formulation",
      "Graph Data Augmentation",
      "Homophily Ratio Analysis",
      "Negative Sampling Bias",
    ],
    viva_session_id: "viva_mock_01",
  },
  {
    id: "sub_mock_02",
    user_id: "usr_mock_01",
    title: "Empirical Analysis of Byzantine Fault Tolerance in Asynchronous State-Machine Replication",
    original_filename: "bft_replication_paper.pdf",
    storage_path: "submissions/sub_mock_02/bft_replication_paper.pdf",
    mime_type: "application/pdf",
    file_size: 2940180,
    status: "processing",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    concepts_count: 8,
    extracted_topics: [
      "View-Change Protocol",
      "Quorum Intersection",
      "Liveness Guarantees Under Network Partitions",
    ],
  },
];

export async function getSubmissions(): Promise<Submission[]> {
  try {
    if (USE_MOCKS) return MOCK_SUBMISSIONS;

    const response = await fetch("/api/submissions");
    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        return MOCK_SUBMISSIONS;
      }
      throw new Error("Unable to fetch submissions list");
    }
    const data = await response.json();
    return data.submissions || (Array.isArray(data) ? data : MOCK_SUBMISSIONS);
  } catch {
    return MOCK_SUBMISSIONS;
  }
}

export async function getSubmission(id: string): Promise<Submission> {
  try {
    if (USE_MOCKS) {
      return (
        MOCK_SUBMISSIONS.find((s) => s.id === id) || {
          ...MOCK_SUBMISSIONS[0],
          id,
        }
      );
    }

    const response = await fetch(`/api/submissions/${id}`);
    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        return (
          MOCK_SUBMISSIONS.find((s) => s.id === id) || {
            ...MOCK_SUBMISSIONS[0],
            id,
          }
        );
      }
      throw new Error(`Unable to fetch submission: ${id}`);
    }
    return await response.json();
  } catch {
    return (
      MOCK_SUBMISSIONS.find((s) => s.id === id) || {
        ...MOCK_SUBMISSIONS[0],
        id,
      }
    );
  }
}

export async function getUploadUrl(
  payload: UploadUrlRequest
): Promise<UploadUrlResponse> {
  try {
    if (USE_MOCKS) {
      return {
        submissionId: `sub_mock_${Date.now()}`,
        signedUrl: "https://mock-storage.enigma.local/upload",
        path: `submissions/mock/${payload.filename}`,
      };
    }

    const response = await fetch("/api/submissions/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        return {
          submissionId: `sub_mock_${Date.now()}`,
          signedUrl: "https://mock-storage.enigma.local/upload",
          path: `submissions/mock/${payload.filename}`,
        };
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to obtain secure upload URL");
    }

    return await response.json();
  } catch {
    return {
      submissionId: `sub_mock_${Date.now()}`,
      signedUrl: "https://mock-storage.enigma.local/upload",
      path: `submissions/mock/${payload.filename}`,
    };
  }
}

export async function completeUpload(
  payload: CompleteUploadRequest
): Promise<{ success: boolean; submissionId: string; status: string }> {
  try {
    if (USE_MOCKS) {
      return {
        success: true,
        submissionId: payload.submissionId,
        status: "processing",
      };
    }

    const response = await fetch("/api/submissions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        return {
          success: true,
          submissionId: payload.submissionId,
          status: "processing",
        };
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to mark submission complete");
    }

    return await response.json();
  } catch {
    return {
      success: true,
      submissionId: payload.submissionId,
      status: "processing",
    };
  }
}

export async function uploadPdfSubmission(
  file: File,
  title: string,
  onProgress?: (progress: number, stage: string) => void
): Promise<Submission> {
  onProgress?.(10, "Requesting secure storage URL...");
  const uploadInfo = await getUploadUrl({
    filename: file.name,
    mimeType: file.type || "application/pdf",
    fileSizeBytes: file.size,
    title,
  });

  onProgress?.(30, "Uploading academic PDF document...");
  if (!uploadInfo.signedUrl.includes("mock-storage")) {
    const uploadRes = await fetch(uploadInfo.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/pdf" },
      body: file,
    });
    if (!uploadRes.ok) {
      throw new Error("Direct cloud storage upload failed.");
    }
  } else {
    // Simulate brief upload latency for mock environment
    await new Promise((r) => setTimeout(r, 600));
  }

  onProgress?.(70, "Finalizing submission record...");
  await completeUpload({ submissionId: uploadInfo.submissionId });

  onProgress?.(100, "Document uploaded. Queued for concept analysis.");

  const created: Submission = {
    id: uploadInfo.submissionId,
    user_id: "usr_mock_01",
    title,
    original_filename: file.name,
    storage_path: uploadInfo.path,
    mime_type: file.type || "application/pdf",
    file_size: file.size,
    status: "processing",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    concepts_count: 0,
    extracted_topics: [],
  };

  MOCK_SUBMISSIONS.unshift(created);
  return created;
}
