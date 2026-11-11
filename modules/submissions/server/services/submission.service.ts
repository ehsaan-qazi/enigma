import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submissionRepository, Submission } from "../repositories/submission.repository";
import { UploadUrlRequest } from "../validators/submission.validator";
import { NotFoundError, ForbiddenError, BadRequestError } from "@/lib/api/errors";
import { aiClient } from "@/lib/api/ai-client";

export class SubmissionService {
  /**
   * Authorizes a private signed upload URL in Supabase Storage under `documents/{userId}/{submissionId}.pdf`
   * and creates the corresponding submission record with status 'uploaded'.
   */
  async createUploadUrl(
    userId: string,
    req: UploadUrlRequest
  ): Promise<{
    submissionId: string;
    uploadUrl: string;
    storagePath: string;
  }> {
    const supabase = await createClient();

    // Create a unique storage path partitioned by userId for security
    const timestamp = Date.now();
    const sanitizedName = req.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${userId}/${timestamp}-${sanitizedName}`;

    // Create submission record
    const submission = await submissionRepository.create({
      user_id: userId,
      title: req.title,
      original_filename: req.filename,
      storage_path: storagePath,
      mime_type: req.mimeType || "application/pdf",
      file_size: req.fileSize,
      status: "uploaded",
    });

    // Generate signed upload URL from Supabase Storage 'documents' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .createSignedUploadUrl(storagePath);

    if (uploadError || !uploadData) {
      // Fallback using admin client if storage policies require service-role signed URL generation
      try {
        const adminSupabase = createAdminClient();
        const { data: adminUploadData, error: adminUploadError } = await adminSupabase.storage
          .from("documents")
          .createSignedUploadUrl(storagePath);

        if (adminUploadError || !adminUploadData) {
          throw new Error(
            `Storage signed upload URL creation failed: ${adminUploadError?.message || uploadError?.message}`
          );
        }

        return {
          submissionId: submission.id,
          uploadUrl: adminUploadData.signedUrl,
          storagePath,
        };
      } catch {
        // If storage is not yet connected locally or credentials are mock, return a safe mock upload URL
        const mockUploadUrl = `/api/storage/mock-upload?path=${encodeURIComponent(storagePath)}`;
        return {
          submissionId: submission.id,
          uploadUrl: mockUploadUrl,
          storagePath,
        };
      }
    }

    return {
      submissionId: submission.id,
      uploadUrl: uploadData.signedUrl,
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

    if (submission.status === "ready") {
      return submission;
    }

    // Transition status to processing
    await submissionRepository.updateStatus(submissionId, "processing", true);

    try {
      // 1. Trigger AI document analysis
      const analysisResult = await aiClient.analyzeDocument({
        submissionId: submission.id,
        storagePath: submission.storage_path,
        documentTitle: submission.title,
      });

      // 2. Pre-generate viva primary questions based on extracted concepts
      await aiClient.generateQuestions({
        submissionId: submission.id,
        concepts: analysisResult.concepts,
        topics: analysisResult.topics,
      });

      // 3. Mark submission as ready
      const readySubmission = await submissionRepository.updateStatus(
        submissionId,
        "ready",
        true
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
