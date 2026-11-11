import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { vivaService } from "@/modules/viva/server/services/viva.service";
import { submitResponseRequestSchema } from "@/modules/viva/server/validators/viva.validator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const contentType = request.headers.get("content-type") || "";
    let questionId = "";
    let durationSeconds: number | undefined;
    let transcription: string | undefined;
    let audioStoragePath: string | undefined;
    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      questionId = String(formData.get("questionId") || formData.get("question_id") || "");
      const durRaw = formData.get("durationSeconds") || formData.get("duration_seconds");
      if (durRaw !== null && durRaw !== undefined) {
        durationSeconds = Number(durRaw);
      }
      const transRaw = formData.get("transcription") || formData.get("transcript");
      if (typeof transRaw === "string" && transRaw.trim()) {
        transcription = transRaw.trim();
      }
      const audioEntry = formData.get("audio");
      if (audioEntry && typeof audioEntry === "object" && "arrayBuffer" in audioEntry) {
        const arrayBuf = await (audioEntry as Blob).arrayBuffer();
        if (arrayBuf.byteLength > 0) {
          audioBase64 = Buffer.from(arrayBuf).toString("base64");
          audioMimeType = (audioEntry as Blob).type || "audio/webm";
        }
      }
    } else {
      const body = await request.json();
      const validated = submitResponseRequestSchema.parse(body);
      questionId = validated.questionId;
      durationSeconds = validated.durationSeconds;
      transcription = validated.transcription;
      audioStoragePath = validated.audioStoragePath;
      if (typeof body.audioBase64 === "string") {
        audioBase64 = body.audioBase64;
      }
    }

    const result = await vivaService.submitResponse(id, userId, {
      questionId,
      durationSeconds,
      transcription,
      audioStoragePath,
      audioBase64,
      audioMimeType,
    });

    return apiSuccess(result, 201);
  } catch (err) {
    return apiError(err);
  }
}
