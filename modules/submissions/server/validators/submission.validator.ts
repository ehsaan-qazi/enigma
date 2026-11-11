import { z } from "zod";

export const uploadUrlRequestSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255),
    filename: z.string().optional(),
    fileName: z.string().optional(),
    file_name: z.string().optional(),
    mimeType: z.string().optional(),
    mime_type: z.string().optional(),
    fileSize: z.number().optional(),
    file_size: z.number().optional(),
  })
  .transform((data) => ({
    title: data.title,
    filename: data.filename || data.fileName || data.file_name || "document.pdf",
    mimeType: (data.mimeType || data.mime_type || "application/pdf").toLowerCase(),
    fileSize: data.fileSize || data.file_size || 1024,
  }))
  .refine((data) => data.mimeType === "application/pdf", {
    message: "Only PDF documents are supported currently",
  })
  .refine((data) => data.fileSize > 0 && data.fileSize <= 50 * 1024 * 1024, {
    message: "File size must be positive and under 50MB",
  });

export const completeUploadRequestSchema = z
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

export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type CompleteUploadRequest = z.infer<typeof completeUploadRequestSchema>;
