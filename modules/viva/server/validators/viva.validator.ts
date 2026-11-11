import { z } from "zod";

export const initiateVivaRequestSchema = z
  .object({
    submissionId: z.string().uuid().optional(),
    submission_id: z.string().uuid().optional(),
  })
  .transform((data) => ({
    submissionId: (data.submissionId || data.submission_id)!,
  }))
  .refine((data) => Boolean(data.submissionId), {
    message: "submissionId is required and must be a valid UUID",
  });

export const submitResponseRequestSchema = z
  .object({
    questionId: z.string().uuid().optional(),
    question_id: z.string().uuid().optional(),
    audioStoragePath: z.string().optional(),
    audio_storage_path: z.string().optional(),
    transcription: z.string().optional(),
  })
  .transform((data) => ({
    questionId: (data.questionId || data.question_id)!,
    audioStoragePath: data.audioStoragePath || data.audio_storage_path,
    transcription: data.transcription,
  }))
  .refine((data) => Boolean(data.questionId), {
    message: "questionId is required and must be a valid UUID",
  });

export const vivaAudioUploadUrlSchema = z
  .object({
    vivaId: z.string().uuid().optional(),
    viva_id: z.string().uuid().optional(),
    filename: z.string().optional(),
    fileName: z.string().optional(),
    file_name: z.string().optional(),
    mimeType: z.string().optional(),
    mime_type: z.string().optional(),
  })
  .transform((data) => ({
    vivaId: (data.vivaId || data.viva_id)!,
    filename: data.filename || data.fileName || data.file_name || "audio-response.webm",
    mimeType: data.mimeType || data.mime_type || "audio/webm",
  }))
  .refine((data) => Boolean(data.vivaId), {
    message: "vivaId is required and must be a valid UUID",
  });

export type InitiateVivaRequest = z.infer<typeof initiateVivaRequestSchema>;
export type SubmitResponseRequest = z.infer<typeof submitResponseRequestSchema>;
export type VivaAudioUploadUrlRequest = z.infer<typeof vivaAudioUploadUrlSchema>;
