import { z } from "zod";

export const initiateVivaRequestSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID format"),
});

export const submitResponseRequestSchema = z.object({
  questionId: z.string().uuid("Invalid question ID format"),
  audioStoragePath: z.string().optional(),
  transcription: z.string().optional(),
});

export type InitiateVivaRequest = z.infer<typeof initiateVivaRequestSchema>;
export type SubmitResponseRequest = z.infer<typeof submitResponseRequestSchema>;
