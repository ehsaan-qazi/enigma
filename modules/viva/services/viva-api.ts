import { VivaSession } from "../types/viva.types";

export async function initiateViva(submissionId: string): Promise<VivaSession> {
  const res = await fetch("/api/viva/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to initiate viva session.");
  }

  const json = await res.json();
  const payload = json.data || json;
  return payload.session || payload;
}

export async function getVivaSession(sessionId: string): Promise<VivaSession> {
  const res = await fetch(`/api/viva/${sessionId}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to load viva session ${sessionId}`);
  }

  const json = await res.json();
  const payload = json.data || json;
  return payload.session || payload;
}

export async function submitVivaAnswer(
  sessionId: string,
  questionId: string,
  audioBlob: Blob | null,
  durationSeconds: number,
  transcription?: string
): Promise<{
  success: boolean;
  nextQuestionIndex: number;
  isCompleted: boolean;
  reportId?: string;
  session?: VivaSession;
}> {
  const formData = new FormData();
  formData.append("questionId", questionId);
  if (audioBlob) {
    formData.append("audio", audioBlob, "response.webm");
  }
  formData.append("durationSeconds", Math.max(2, durationSeconds).toString());
  if (transcription && transcription.trim()) {
    formData.append("transcription", transcription.trim());
  }

  const res = await fetch(`/api/viva/${sessionId}/responses`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.message || "Failed to record viva answer.");
  }

  const json = await res.json();
  const payload = json.data || json;
  return {
    success: true,
    nextQuestionIndex: payload.nextQuestionIndex ?? 0,
    isCompleted: Boolean(payload.isCompleted),
    reportId: payload.reportId,
    session: payload.session,
  };
}
