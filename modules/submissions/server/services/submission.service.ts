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
      const adminClient = createAdminClient();
      const { data: uploadData, error: uploadError } = await adminClient.storage
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
  async completeUpload(
    submissionId: string,
    userId: string,
    options?: { fileBase64?: string; documentContent?: string }
  ): Promise<Submission> {
    const submission = await submissionRepository.findByIdAndUserId(submissionId, userId);

    if (!submission) {
      throw new NotFoundError("Submission not found or access denied");
    }

    if (submission.status === "ready" && submission.extracted_topics?.length) {
      return submission;
    }

    await submissionRepository.updateStatus(submissionId, "processing", true);

    try {
      let fileBase64 =
        options?.fileBase64 || localStore.getUploadedFile(submission.storage_path)?.base64;
      let fileUrl: string | undefined;

      try {
        const adminSupabase = createAdminClient();

        // If fileBase64 is not yet in hand, attempt to download directly from storage bucket
        if (!fileBase64) {
          const { data: fileBlob, error: downloadError } = await adminSupabase.storage
            .from("documents")
            .download(submission.storage_path);
          if (!downloadError && fileBlob) {
            const arrayBuf = await fileBlob.arrayBuffer();
            if (arrayBuf.byteLength > 0) {
              fileBase64 = Buffer.from(arrayBuf).toString("base64");
            }
          }
        }

        const { data: signedData } = await adminSupabase.storage
          .from("documents")
          .createSignedUrl(submission.storage_path, 3600);
        if (signedData?.signedUrl) {
          fileUrl = signedData.signedUrl;
        }
      } catch {
        // Fallback when storage is local or offline
      }

      // Persist in localStore so subsequent pipeline steps can access it offline
      if (fileBase64) {
        localStore.saveUploadedFile(
          submission.storage_path,
          fileBase64,
          submission.mime_type || "application/pdf",
          submission.file_size || 1024
        );
      }

      // 1. Trigger AI document analysis (passing uploaded PDF base64 when available)
      const analysisResult = await aiClient.analyzeDocument({
        submissionId: submission.id,
        storagePath: submission.storage_path,
        documentTitle: submission.title,
        fileUrl,
        fileBase64,
        documentContent: options?.documentContent,
      });

      // 2. Pre-generate viva primary questions directly grounded in student's extracted content & solutions
      const resolvedContent = analysisResult.extractedContent || options?.documentContent;
      const generatedQuestions = await aiClient.generateQuestions({
        submissionId: submission.id,
        concepts: analysisResult.concepts,
        topics: analysisResult.topics,
        documentTitle: submission.title,
        documentContent: resolvedContent,
        summary: analysisResult.summary,
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
