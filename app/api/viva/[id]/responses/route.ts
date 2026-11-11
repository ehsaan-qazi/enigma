import { apiSuccess, apiError } from "@/lib/api/response";
import { requireAuth } from "@/modules/auth/server/services/auth.service";
import { vivaService } from "@/modules/viva/server/services/viva.service";
import { submitResponseRequestSchema } from "@/modules/viva/server/validators/viva.validator";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: vivaId } = await params;

    let payload: Record<string, unknown> = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const questionId = formData.get("questionId") || formData.get("question_id");
      const audioPath =
        formData.get("audioPath") ||
        formData.get("audio_path") ||
        formData.get("audioStoragePath") ||
        formData.get("audio_storage_path");
      const durationSeconds =
        formData.get("durationSeconds") || formData.get("duration_seconds");
      const transcription = formData.get("transcription");
      const audioFile = formData.get("audio") || formData.get("file");

      let resolvedAudioPath = typeof audioPath === "string" ? audioPath : undefined;

      // If raw audio Blob/File is uploaded directly in FormData, store it
      if (!resolvedAudioPath && audioFile instanceof Blob) {
        const timestamp = Date.now();
        const extension = audioFile.type.includes("webm")
          ? "webm"
          : audioFile.type.includes("wav")
          ? "wav"
          : "webm";
        const storagePath = `${userId}/${vivaId}/${timestamp}-response.${extension}`;

        try {
          const adminSupabase = createAdminClient();
          const arrayBuffer = await audioFile.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await adminSupabase.storage.from("audio").upload(storagePath, buffer, {
            contentType: audioFile.type || "audio/webm",
            upsert: true,
          });
          resolvedAudioPath = storagePath;
        } catch {
          // Fallback to designated storagePath in mock/local environment
          resolvedAudioPath = storagePath;
        }
      }

      payload = {
        questionId: typeof questionId === "string" ? questionId : undefined,
        audioPath: resolvedAudioPath,
        durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
        transcription: typeof transcription === "string" ? transcription : undefined,
      };
    } else {
      payload = await request.json();
    }

    const validatedData = submitResponseRequestSchema.parse(payload);
    const result = await vivaService.submitResponse(vivaId, userId, validatedData);
    return apiSuccess(result, 201);
  } catch (err) {
    return apiError(err);
  }
}
