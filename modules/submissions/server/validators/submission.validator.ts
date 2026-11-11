import { z } from "zod";

export const uploadUrlRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  filename: z.string().min(1, "Filename is required"),
  mimeType: z
    .string()
    .refine((val) => val === "application/pdf", {
      message: "Only PDF documents are supported currently",
    })
    .default("application/pdf"),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(50 * 1024 * 1024, "Maximum file size is 50MB"),
});

export const completeUploadRequestSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID format"),
});

export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type CompleteUploadRequest = z.infer<typeof completeUploadRequestSchema>;
