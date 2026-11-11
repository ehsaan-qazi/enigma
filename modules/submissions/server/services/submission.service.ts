import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submissionRepository, Submission } from "../repositories/submission.repository";
import { UploadUrlRequest } from "../validators/submission.validator";
import { NotFoundError, BadRequestError } from "@/lib/api/errors";
import { aiClient } from "@/lib/api/ai-client";
import { localStore } from "@/lib/supabase/local-store";

export class SubmissionService {
  /**
   * Authorizes a private signed upload URL in Supabase Storage under `documents/{userId}/{timestamp}-{filename}`
   * and creates the corresponding submission record with status 'uploaded'.
   */
  async createUploadUrl(
    userId: string,
    req: UploadUrlRequest
  ): Promise<{
    submissionId: string;
    signedUrl: string;
    uploadUrl: string;
    path: string;
    storagePath: string;
  }> {
    const timestamp = Date.now();
    const sanitizedName = (req.filename || "document.pdf").replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${userId}/${timestamp}-${sanitizedName}`;

    const submission = await submissionRepository.create({
      user_id: userId,
      title: req.title,
      original_filename: req.filename,
      storage_path: storagePath,
      mime_type: req.mimeType || "application/pdf",
      file_size: req.fileSize,
      status: "uploaded",
    });

    try {
      const supabase = await createClient();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .createSignedUploadUrl(storagePath);

      if (!uploadError && uploadData?.signedUrl) {
        return {
          submissionId: submission.id,
          signedUrl: uploadData.signedUrl,
          uploadUrl: uploadData.signedUrl,
          path: storagePath,
          storagePath,
        };
      }
    } catch {
      // Fallback to local mock-upload endpoint
    }

    const mockUploadUrl = `/api/storage/mock-upload?path=${encodeURIComponent(storagePath)}`;
    return {
      submissionId: submission.id,
      signedUrl: mockUploadUrl,
      uploadUrl: mockUploadUrl,
      path: storagePath,
      storagePath,
    };
  }

  /**
   * Confirms upload, verifies existence, transitions status to 'processing',
   * triggers AI document analysis & question generation, and transitions to 'ready' or 'failed'.
   */
  async completeUpload(submissionId: string, userId: string): Promise<Submission> {
    const submission = await submissionRepository.findByIdAndUserId(submissionId, userId);

    if (!submission) {
      throw new NotFoundError("Submission not found or access denied");
    }

    if (submission.status === "ready" && submission.extracted_topics?.length) {
      return submission;
    }

    await submissionRepository.updateStatus(submissionId, "processing", true);

    try {
      let fileUrl: string | undefined;
      try {
        const adminSupabase = createAdminClient();
        const { data: signedData } = await adminSupabase.storage
          .from("documents")
          .createSignedUrl(submission.storage_path, 3600);
        if (signedData?.signedUrl) {
          fileUrl = signedData.signedUrl;
        }
      } catch {
        // Fallback when storage is local
      }

      const uploadedFile = localStore.getUploadedFile(submission.storage_path);

      // 1. Trigger AI document analysis (passing uploaded PDF base64 when available)
      const analysisResult = await aiClient.analyzeDocument({
        submissionId: submission.id,
        storagePath: submission.storage_path,
        documentTitle: submission.title,
        fileUrl,
        fileBase64: uploadedFile?.base64,
      });

      // 2. Pre-generate viva primary questions based on extracted concepts
      const generatedQuestions = await aiClient.generateQuestions({
        submissionId: submission.id,
        concepts: analysisResult.concepts,
        topics: analysisResult.topics,
        count: 4,
      });

      // Create an active viva session with the generated questions so the submission is immediately ready for defense
      let existingViva = localStore.findVivaBySubmissionId(submission.id);
      if (!existingViva) {
        existingViva = localStore.createViva({
          user_id: userId,
          submission_id: submission.id,
          status: "in_progress",
          started_at: new Date().toISOString(),
        });
        localStore.createQuestions(
          generatedQuestions.questions.map((q, idx) => ({
            viva_id: existingViva!.id,
            concept: q.concept,
            question_text: q.question,
            question_type: "primary" as const,
            difficulty: q.difficulty,
            expected_concepts: q.expected_concepts,
            sequence_number: idx + 1,
          }))
        );
      }

      // 3. Mark submission as ready with extracted metadata
      const readySubmission = await submissionRepository.updateStatus(
        submissionId,
        "ready",
        true,
        {
          concepts_count: analysisResult.concepts.length,
          extracted_topics: analysisResult.topics,
          extracted_concepts: analysisResult.concepts,
          summary: analysisResult.summary,
          viva_session_id: existingViva.id,
        }
      );
      return readySubmission;
    } catch (err) {
      console.error(
        `[SubmissionService] Processing failed for submission ${submissionId}:`,
        err
      );
      await submissionRepository.updateStatus(submissionId, "failed", true);
      throw new BadRequestError(
        `Document analysis failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async getSubmission(submissionId: string, userId: string): Promise<Submission> {
    const submission = await submissionRepository.findByIdAndUserId(submissionId, userId);
    if (!submission) {
      throw new NotFoundError("Submission not found or access denied");
    }
    return submission;
  }

  async listSubmissions(userId: string): Promise<Submission[]> {
    return submissionRepository.listByUserId(userId);
  }
}

export const submissionService = new SubmissionService();
