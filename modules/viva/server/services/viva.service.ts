import { createAdminClient } from "@/lib/supabase/admin";
import { vivaRepository, Viva, Question, Response } from "../repositories/viva.repository";
import { evaluationRepository, Evaluation } from "@/modules/evaluations/server/repositories/evaluation.repository";
import { submissionRepository } from "@/modules/submissions/server/repositories/submission.repository";
import { SubmitResponseRequest, VivaAudioUploadUrlRequest } from "../validators/viva.validator";
import { NotFoundError } from "@/lib/api/errors";
import { aiClient, extractTextFromPdfBase64 } from "@/lib/api/ai-client";
import { localStore } from "@/lib/supabase/local-store";
import { VivaSession, VivaQuestion, VivaResponse, VivaDifficulty, VivaSessionStatus } from "@/modules/viva/types/viva.types";

function mapDifficulty(diff: string): VivaDifficulty {
  if (diff === "easy" || diff === "introductory") return "introductory";
  if (diff === "hard" || diff === "advanced") return "advanced";
  return "intermediate";
}

export class VivaService {
  /**
   * Formats internal DB records into the Frontend's VivaSession shape.
   */
  public formatSessionForFrontend(
    viva: Viva,
    questions: Question[],
    responses: Response[]
  ): VivaSession {
    const answeredIds = new Set(responses.map((r) => r.question_id));
    let currentQuestionIndex = questions.findIndex((q) => !answeredIds.has(q.id));
    if (currentQuestionIndex === -1) {
      currentQuestionIndex = Math.max(0, questions.length - 1);
    }

    const mappedQuestions: VivaQuestion[] = questions.map((q, idx) => ({
      id: q.id,
      session_id: viva.id,
      order_index: q.sequence_number || idx + 1,
      question_text: q.question_text,
      concept_tested: q.concept,
      difficulty: mapDifficulty(q.difficulty),
      is_follow_up: q.question_type === "follow_up",
      follow_up_reason: q.follow_up_reason,
    }));

    const mappedResponses: Record<string, VivaResponse> = {};
    for (const r of responses) {
      mappedResponses[r.question_id] = {
        id: r.id,
        question_id: r.question_id,
        duration_seconds: r.duration_seconds || 0,
        status: (r.status === "completed" ? "completed" : "evaluating") as VivaResponse["status"],
        transcript: r.transcription || undefined,
      };
    }

    const mappedStatus: VivaSessionStatus =
      viva.status === "created" ? "in_progress" : (viva.status as VivaSessionStatus);

    return {
      id: viva.id,
      submission_id: viva.submission_id,
      status: mappedStatus,
      current_question_index: currentQuestionIndex,
      total_questions: mappedQuestions.length,
      created_at: viva.created_at,
      completed_at: viva.completed_at || undefined,
      questions: mappedQuestions,
      responses: mappedResponses,
      report_id: viva.status === "completed" ? viva.id : undefined,
    };
  }

  /**
   * Initiates a viva assessment session for an authenticated student's submission.
   * Verifies submission status is 'ready' and pre-populates primary viva questions.
   */
  async initiateViva(
    submissionId: string,
    userId: string
  ): Promise<{ viva: Viva; questions: Question[]; session: VivaSession }> {
    const submission = await submissionRepository.findByIdAndUserId(submissionId, userId);
    if (!submission) {
      throw new NotFoundError("Submission not found or access denied");
    }

    const existingViva = await vivaRepository.findBySubmissionIdAndUserId(submissionId, userId);
    if (existingViva && (existingViva.status === "created" || existingViva.status === "in_progress" || existingViva.status === "completed")) {
      const questions = await vivaRepository.listQuestionsByVivaId(existingViva.id);
      const responses = await vivaRepository.listResponsesByVivaId(existingViva.id);
      if (questions.length > 0) {
        return {
          viva: existingViva,
          questions,
          session: this.formatSessionForFrontend(existingViva, questions, responses),
        };
      }
    }

    // Retrieve structured Document JSON or extracted text to ground questions directly in student's assignment
    const docJson = localStore.getDocumentJson(submissionId);
    let resolvedContent =
      docJson?.extracted_text ||
      submission.extracted_text ||
      localStore.findSubmissionById(submissionId)?.extracted_text;

    if (!resolvedContent && submission.storage_path) {
      const fileRecord = localStore.getUploadedFile(submission.storage_path);
      if (fileRecord?.base64) {
        resolvedContent = extractTextFromPdfBase64(fileRecord.base64);
      }
    }

    const concepts =
      (docJson?.concepts && docJson.concepts.length > 0)
        ? docJson.concepts
        : (submission.extracted_concepts && submission.extracted_concepts.length > 0)
        ? submission.extracted_concepts
        : (submission.extracted_topics && submission.extracted_topics.length > 0)
        ? submission.extracted_topics
        : submission.title
        ? [submission.title]
        : ["Assignment Tasks & Solutions"];

    const viva = await vivaRepository.create({
      user_id: userId,
      submission_id: submissionId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    });

    const aiQuestions = await aiClient.generateQuestions({
      submissionId,
      concepts,
      topics: submission.extracted_topics || docJson?.topics,
      documentTitle: submission.title,
      documentContent: resolvedContent,
      summary: submission.summary || docJson?.summary,
      assignmentTasks: docJson?.assignment_tasks,
      count: 4,
    });

    const questionInserts = aiQuestions.questions.map((q, idx) => ({
      viva_id: viva.id,
      concept: q.concept,
      question_text: q.question,
      question_type: "primary" as const,
      difficulty: q.difficulty,
      expected_concepts: q.expected_concepts,
      sequence_number: idx + 1,
    }));

    const questions = await vivaRepository.createQuestions(questionInserts);
    const inProgressViva = await vivaRepository.updateStatus(viva.id, "in_progress");

    return {
      viva: inProgressViva,
      questions,
      session: this.formatSessionForFrontend(inProgressViva, questions, []),
    };
  }

  /**
   * Generates a signed upload URL for student audio response under `audio/{userId}/{vivaId}/{timestamp}.webm`
   */
  async createAudioUploadUrl(
    userId: string,
    req: VivaAudioUploadUrlRequest
  ): Promise<{
    vivaId: string;
    signedUrl: string;
    uploadUrl: string;
    path: string;
    storagePath: string;
  }> {
    const viva = await vivaRepository.findByIdAndUserId(req.vivaId, userId);
    if (!viva) {
      throw new NotFoundError("Viva session not found or access denied");
    }

    const timestamp = Date.now();
    const sanitizedName = (req.filename || "audio-response.webm").replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${userId}/${req.vivaId}/${timestamp}-${sanitizedName}`;

    try {
      const adminClient = createAdminClient();
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from("audio")
        .createSignedUploadUrl(storagePath);

      if (!uploadError && uploadData?.signedUrl) {
        return {
          vivaId: req.vivaId,
          signedUrl: uploadData.signedUrl,
          uploadUrl: uploadData.signedUrl,
          path: storagePath,
          storagePath,
        };
      }
    } catch {
      // Fallback to mock-upload
    }

    const mockUploadUrl = `/api/storage/mock-upload?path=${encodeURIComponent(storagePath)}`;
    return {
      vivaId: req.vivaId,
      signedUrl: mockUploadUrl,
      uploadUrl: mockUploadUrl,
      path: storagePath,
      storagePath,
    };
  }

  /**
   * Resolves a viva session by either vivaId OR submissionId (since Frontend links `/viva/${submission.id}`).
   */
  async getVivaState(
    idOrSubmissionId: string,
    userId: string
  ): Promise<{
    viva: Viva;
    questions: Question[];
    responses: Response[];
    session: VivaSession;
  }> {
    let viva = await vivaRepository.findByIdAndUserId(idOrSubmissionId, userId);

    if (!viva) {
      // Check if idOrSubmissionId is actually a submissionId
      const submission = await submissionRepository.findByIdAndUserId(idOrSubmissionId, userId);
      if (submission) {
        const initiated = await this.initiateViva(submission.id, userId);
        viva = initiated.viva;
      }
    }

    if (!viva) {
      throw new NotFoundError("Viva session not found or access denied");
    }

    const questions = await vivaRepository.listQuestionsByVivaId(viva.id);
    const responses = await vivaRepository.listResponsesByVivaId(viva.id);

    return {
      viva,
      questions,
      responses,
      session: this.formatSessionForFrontend(viva, questions, responses),
    };
  }

  /**
   * Retrieves the current or next unanswered question in the viva sequence.
   */
  async getNextQuestion(vivaId: string, userId: string): Promise<{
    question: Question | null;
    isCompleted: boolean;
    totalQuestions: number;
    answeredCount: number;
  }> {
    const { viva, questions, responses } = await this.getVivaState(vivaId, userId);

    const answeredQuestionIds = new Set(responses.map((r) => r.question_id));
    const nextQuestion = questions.find((q) => !answeredQuestionIds.has(q.id)) || null;

    const isCompleted = nextQuestion === null && questions.length > 0;

    if (isCompleted && viva.status !== "completed") {
      await vivaRepository.updateStatus(
        viva.id,
        "completed",
        { completed_at: new Date().toISOString() },
        true
      );
      try {
        await submissionRepository.updateStatus(viva.submission_id, "completed", true);
      } catch (err) {
        console.warn("[VivaService] Failed to update submission in Supabase DB:", err);
      }
      localStore.updateSubmission(viva.submission_id, { status: "completed" });
    }

    return {
      question: nextQuestion,
      isCompleted,
      totalQuestions: questions.length,
      answeredCount: answeredQuestionIds.size,
    };
  }

  /**
   * Submits student audio response, transcribes via STT, evaluates conceptual accuracy,
   * generates adaptive follow-up if needed, and records knowledge gaps.
   */
  async submitResponse(
    vivaIdOrSubmissionId: string,
    userId: string,
    req: SubmitResponseRequest & { audioBase64?: string; audioMimeType?: string }
  ): Promise<{
    response: Response;
    evaluation: Evaluation;
    followUpQuestion?: Question;
    nextQuestionIndex: number;
    isCompleted: boolean;
    reportId?: string;
    session: VivaSession;
  }> {
    const state = await this.getVivaState(vivaIdOrSubmissionId, userId);
    const viva = state.viva;
    const vivaId = viva.id;

    let question = await vivaRepository.findQuestionById(req.questionId, vivaId);
    if (!question && state.questions.length > 0) {
      const answeredIds = new Set(state.responses.map((r) => r.question_id));
      question = state.questions.find((q) => !answeredIds.has(q.id)) || state.questions[0];
    }

    if (!question) {
      throw new NotFoundError("Question not found in this viva session");
    }

    const submission = await submissionRepository.findByIdAndUserId(viva.submission_id, userId);

    // 1. Create initial response record with status 'uploaded'
    let response = await vivaRepository.createResponse({
      viva_id: vivaId,
      question_id: question.id,
      audio_storage_path: req.audioStoragePath || `${userId}/${vivaId}/${question.id}.webm`,
      duration_seconds: req.durationSeconds || null,
      status: "uploaded",
    });

    // Generate signed download URL for audio if stored in Supabase
    let audioUrl: string | undefined;
    if (req.audioStoragePath) {
      try {
        const adminSupabase = createAdminClient();
        const { data: signedData } = await adminSupabase.storage
          .from("audio")
          .createSignedUrl(req.audioStoragePath, 3600);
        if (signedData?.signedUrl) {
          audioUrl = signedData.signedUrl;
        }
      } catch {
        // Fallback safely in local mode
      }
    }

    // 2. Perform speech-to-text transcription if not directly supplied
    let transcription = req.transcription || "";
    if (!transcription && (req.audioBase64 || req.audioStoragePath || audioUrl)) {
      await vivaRepository.updateResponseStatus(response.id, "transcribing");
      try {
        const sttResult = await aiClient.transcribeAudio({
          audioStoragePath: req.audioStoragePath || `${userId}/${vivaId}/${question.id}.webm`,
          audioUrl,
          audioBase64: req.audioBase64,
          audioMimeType: req.audioMimeType,
        });
        if (sttResult?.transcription) {
          transcription = sttResult.transcription;
        }
      } catch (sttErr) {
        console.warn("[VivaService] Speech transcription notice:", sttErr);
      }
    }

    // 3. Transition to 'evaluating'
    await vivaRepository.updateResponseStatus(response.id, "evaluating", {
      transcription: transcription || undefined,
    });

    // 4. Run AI Answer Evaluation (supports both transcription and audioBase64 via Python FastAPI)
    const expectedConcepts = Array.isArray(question.expected_concepts)
      ? (question.expected_concepts as string[])
      : [];

    const evalResult = await aiClient.evaluateAnswer({
      vivaId,
      questionId: question.id,
      questionText: question.question_text,
      expectedConcepts,
      transcription: transcription || undefined,
      concept: question.concept,
      audioStoragePath: req.audioStoragePath,
      audioUrl,
      audioBase64: req.audioBase64,
      audioMimeType: req.audioMimeType,
      documentContext: submission?.summary,
    });

    if (!transcription && evalResult.supporting_evidence?.length) {
      transcription = evalResult.supporting_evidence.join(" ");
    }

    // 5. Save Evaluation
    const evaluation = await evaluationRepository.createEvaluation({
      response_id: response.id,
      correctness: evalResult.correctness,
      completeness: evalResult.completeness,
      reasoning_quality: evalResult.reasoning_quality,
      feedback: evalResult.feedback,
      demonstrated_concepts: evalResult.demonstrated_concepts,
      missing_concepts: evalResult.missing_concepts,
      confidence: evalResult.confidence,
    });

    // 6. Record Knowledge Gaps if missing concepts or low score detected
    if (evalResult.knowledge_gaps && evalResult.knowledge_gaps.length > 0) {
      const gaps = evalResult.knowledge_gaps.map((gap) => ({
        user_id: userId,
        viva_id: vivaId,
        concept: gap.concept,
        severity: gap.severity,
        explanation: gap.explanation,
        recommendation: gap.recommendation,
      }));
      await evaluationRepository.createKnowledgeGaps(gaps);
    } else if (evalResult.missing_concepts.length > 0 || evalResult.correctness < 75) {
      const gaps = evalResult.missing_concepts.map((concept) => ({
        user_id: userId,
        viva_id: vivaId,
        concept,
        severity: (evalResult.correctness < 60 ? "high" : "medium") as "low" | "medium" | "high",
        explanation: `Student answer lacked complete coverage of ${concept} during question '${question.question_text}'.`,
        recommendation: `Review reference material on ${concept} and its practical implementation in your work.`,
      }));
      await evaluationRepository.createKnowledgeGaps(gaps);
    }

    // 7. Check if an adaptive follow-up question should be created (max 1 follow-up per viva to keep length 4-5 questions)
    let followUpQuestion: Question | undefined;
    const existingQuestions = await vivaRepository.listQuestionsByVivaId(vivaId);
    const hasFollowUpAlready = existingQuestions.some((q) => q.question_type === "follow_up");
    const shouldFollowUp =
      !hasFollowUpAlready &&
      question.question_type === "primary" &&
      (evalResult.needs_follow_up === true ||
        evalResult.missing_concepts.length > 0 ||
        evalResult.correctness < 75);

    if (shouldFollowUp) {
      const followUp = await aiClient.generateFollowUp({
        vivaId,
        questionText: question.question_text,
        concept: question.concept,
        transcription: transcription || "Student oral response",
        expectedConcepts,
        evaluation: {
          correctness: evalResult.correctness,
          completeness: evalResult.completeness,
          feedback: evalResult.feedback,
          missing_concepts: evalResult.missing_concepts,
        },
      });

      const insertedFollowUps = await vivaRepository.createQuestions([
        {
          viva_id: vivaId,
          concept: followUp.concept,
          question_text: followUp.question,
          question_type: "follow_up",
          difficulty: followUp.difficulty,
          expected_concepts: followUp.expected_concepts,
          sequence_number: existingQuestions.length + 1,
          follow_up_reason: followUp.reason_for_asking,
        },
      ]);
      followUpQuestion = insertedFollowUps[0];
    }

    // 8. Mark response as 'completed'
    response = await vivaRepository.updateResponseStatus(response.id, "completed", {
      transcription: transcription || "Transcribed student oral defense response.",
    });

    // 9. Compute updated Viva session state & completion status
    const updatedQuestions = await vivaRepository.listQuestionsByVivaId(vivaId);
    const updatedResponses = await vivaRepository.listResponsesByVivaId(vivaId);
    const answeredIds = new Set(updatedResponses.map((r) => r.question_id));
    const nextUnansweredIdx = updatedQuestions.findIndex((q) => !answeredIds.has(q.id));
    const isCompleted = nextUnansweredIdx === -1 && updatedQuestions.length > 0;

    let finalViva = viva;
    if (isCompleted && viva.status !== "completed") {
      finalViva = await vivaRepository.updateStatus(
        vivaId,
        "completed",
        { completed_at: new Date().toISOString() },
        true
      );
      try {
        await submissionRepository.updateStatus(viva.submission_id, "completed", true);
      } catch (err) {
        console.warn("[VivaService] Failed to update submission in Supabase DB:", err);
      }
      localStore.updateSubmission(viva.submission_id, { status: "completed" });
    }

    const updatedSession = this.formatSessionForFrontend(
      finalViva,
      updatedQuestions,
      updatedResponses
    );

    return {
      response,
      evaluation,
      followUpQuestion,
      nextQuestionIndex: isCompleted ? updatedQuestions.length : nextUnansweredIdx,
      isCompleted,
      reportId: isCompleted ? vivaId : undefined,
      session: updatedSession,
    };
  }

  async listVivaSessionsWithSubmissions(userId: string) {
    const vivas = await vivaRepository.listByUserId(userId);
    const result = [];
    for (const v of vivas) {
      const sub = await submissionRepository.findByIdAndUserId(v.submission_id, userId);
      const questions = await vivaRepository.listQuestionsByVivaId(v.id);
      const responses = await vivaRepository.listResponsesByVivaId(v.id);
      result.push({
        id: v.id,
        submissionId: v.submission_id,
        submissionTitle: sub?.title || "Academic Submission",
        totalQuestions: questions.length,
        answeredQuestions: responses.length,
        status: v.status,
        createdAt: v.created_at,
        completedAt: v.completed_at,
      });
    }
    return result;
  }
}

export const vivaService = new VivaService();
