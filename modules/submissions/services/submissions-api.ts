import {
  Submission,
  UploadUrlRequest,
  UploadUrlResponse,
  CompleteUploadRequest,
} from "../types/submission.types";

export async function getSubmissions(): Promise<Submission[]> {
  const response = await fetch("/api/submissions", { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const json = await response.json();
  const payload = json.data || json;
  return payload.submissions || (Array.isArray(payload) ? payload : []);
}

export async function getSubmission(id: string): Promise<Submission> {
  const response = await fetch(`/api/submissions/${id}`, { cache: "no-store" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Unable to fetch submission: ${id}`);
  }
  const json = await response.json();
  const payload = json.data || json;
  return payload.submission || payload;
}

export async function getUploadUrl(
  payload: UploadUrlRequest
): Promise<UploadUrlResponse> {
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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      resolve("");
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadPdfSubmission(
  file: File,
  title: string,
  onProgress?: (progress: number, stage: string) => void,
  documentContent?: string
): Promise<Submission> {
  onProgress?.(15, "Requesting secure storage URL...");
  const base64Promise = readFileAsBase64(file);

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
  const fileBase64 = await base64Promise;
  const completedSubmission = await completeUpload({
    submissionId: uploadInfo.submissionId,
    fileBase64: fileBase64 || undefined,
    documentContent: documentContent && documentContent.trim() ? documentContent.trim() : undefined,
  });

  onProgress?.(100, "Document analyzed and ready for viva examination!");
  return completedSubmission;
}
