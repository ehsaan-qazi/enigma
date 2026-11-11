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
    concepts_count: 6,
    extracted_topics: [
      "Contrastive Loss Formulation",
      "Graph Data Augmentation",
      "Homophily Ratio Analysis",
      "Negative Sampling Bias",
    ],
    viva_session_id: "viva_mock_01",
  },
];

export async function getSubmissions(): Promise<Submission[]> {
  try {
    if (USE_MOCKS) return MOCK_SUBMISSIONS;

    const response = await fetch("/api/submissions", { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        return MOCK_SUBMISSIONS;
      }
      throw new Error("Unable to fetch submissions list");
    }
    const json = await response.json();
    const payload = json.data || json;
    return payload.submissions || (Array.isArray(payload) ? payload : MOCK_SUBMISSIONS);
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

    const response = await fetch(`/api/submissions/${id}`, { cache: "no-store" });
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
    const json = await response.json();
    const payload = json.data || json;
    return payload.submission || payload;
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
        signedUrl: `/api/storage/mock-upload?path=${encodeURIComponent(payload.filename)}`,
        path: `submissions/mock/${payload.filename}`,
      };
    }

    const response = await fetch("/api/submissions/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        fileSize: payload.fileSizeBytes,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || "Failed to obtain secure upload URL");
    }

    const json = await response.json();
    return json.data || json;
  } catch (err) {
    if (err instanceof Error && !err.message.includes("fetch")) {
      throw err;
    }
    return {
      submissionId: `sub_mock_${Date.now()}`,
      signedUrl: `/api/storage/mock-upload?path=${encodeURIComponent(payload.filename)}`,
      path: `submissions/mock/${payload.filename}`,
    };
  }
}

export async function completeUpload(
  payload: CompleteUploadRequest
): Promise<Submission> {
  const response = await fetch("/api/submissions/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.message || "Failed to complete document analysis");
  }

  const json = await response.json();
  return json.data || json;
}

export async function uploadPdfSubmission(
  file: File,
  title: string,
  onProgress?: (progress: number, stage: string) => void
): Promise<Submission> {
  onProgress?.(15, "Requesting secure storage URL...");
  const uploadInfo = await getUploadUrl({
    filename: file.name,
    mimeType: file.type || "application/pdf",
    fileSizeBytes: file.size,
    title,
  });

  onProgress?.(40, "Uploading academic PDF document...");
  const uploadRes = await fetch(uploadInfo.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error("Document upload failed.");
  }

  onProgress?.(70, "AI pipeline extracting concepts & generating viva questions...");
  const completedSubmission = await completeUpload({
    submissionId: uploadInfo.submissionId,
  });

  onProgress?.(100, "Document analyzed and ready for viva examination!");
  return completedSubmission;
}
