import { vivaRepository, Viva, Question, Response } from "../repositories/viva.repository";
import { evaluationRepository, Evaluation, KnowledgeGap } from "@/modules/evaluations/server/repositories/evaluation.repository";
import { submissionRepository } from "@/modules/submissions/server/repositories/submission.repository";
import { SubmitResponseRequest } from "../validators/viva.validator";
import { NotFoundError, BadRequestError } from "@/lib/api/errors";
import { aiClient } from "@/lib/api/ai-client";

export class VivaService {
  /**
   * Initiates a viva assessment session for an authenticated student's submission.
   * Verifies submission status is 'ready' and pre-populates primary viva questions.
   */
  async initiateViva(submissionId: string, userId: string): Promise<{ viva: Viva; questions: Question[] }> {
    const submission = await submissionRepository.findByIdAndUserId(submissionId, userId);
    if (!submission) {
      throw new NotFoundError("Submission not found or access denied");
    }

    if (submission.status !== "ready") {
      throw new BadRequestError(
        `Submission is not ready for viva assessment (current status: ${submission.status}). Please complete processing first.`
      );
    }

    // Check if an active viva already exists
    const existingViva = await vivaRepository.findBySubmissionIdAndUserId(submissionId, userId);
    if (existingViva && (existingViva.status === "created" || existingViva.status === "in_progress")) {
      const questions = await vivaRepository.listQuestionsByVivaId(existingViva.id);
      return { viva: existingViva, questions };
    }

    // Create new viva session
    const viva = await vivaRepository.create({
      user_id: userId,
      submission_id: submissionId,
      status: "created",
      started_at: new Date().toISOString(),
    });

    // Request primary questions from AI service
    const aiQuestions = await aiClient.generateQuestions({
      submissionId,
      concepts: ["Database Normalization", "Row Level Security", "Asynchronous Processing"],
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

    // Update viva status to in_progress
    const inProgressViva = await vivaRepository.updateStatus(viva.id, "in_progress");

    return { viva: inProgressViva, questions };
  }

  async getVivaState(vivaId: string, userId: string): Promise<{
    viva: Viva;
    questions: Question[];
    responses: Response[];
  }> {
    const viva = await vivaRepository.findByIdAndUserId(vivaId, userId);
    if (!viva) {
      throw new NotFoundError("Viva session not found or access denied");
    }

    const questions = await vivaRepository.listQuestionsByVivaId(vivaId);
    const responses = await vivaRepository.listResponsesByVivaId(vivaId);

    return { viva, questions, responses };
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
        vivaId,
        "completed",
        { completed_at: new Date().toISOString() },
        true
      );
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
    vivaId: string,
    userId: string,
    req: SubmitResponseRequest
  ): Promise<{
    response: Response;
    evaluation: Evaluation;
    followUpQuestion?: Question;
  }> {
    const viva = await vivaRepository.findByIdAndUserId(vivaId, userId);
    if (!viva) {
      throw new NotFoundError("Viva session not found or access denied");
    }

    const question = await vivaRepository.findQuestionById(req.questionId, vivaId);
    if (!question) {
      throw new NotFoundError("Question not found in this viva session");
    }

    // 1. Create initial response record with status 'uploaded'
    let response = await vivaRepository.createResponse({
      viva_id: vivaId,
      question_id: req.questionId,
      audio_storage_path: req.audioStoragePath || null,
      status: "uploaded",
    });

    // 2. Perform speech-to-text transcription if not directly supplied
    let transcription = req.transcription || "";
    if (!transcription && req.audioStoragePath) {
      await vivaRepository.updateResponseStatus(response.id, "transcribing");
      const sttResult = await aiClient.transcribeAudio({
        audioStoragePath: req.audioStoragePath,
      });
      transcription = sttResult.transcription;
    }

    // 3. Transition to 'evaluating'
    await vivaRepository.updateResponseStatus(response.id, "evaluating", {
      transcription,
    });

    // 4. Run AI Answer Evaluation
    const expectedConcepts = Array.isArray(question.expected_concepts)
      ? (question.expected_concepts as string[])
      : [];

    const evalResult = await aiClient.evaluateAnswer({
      vivaId,
      questionId: question.id,
      questionText: question.question_text,
      expectedConcepts,
      transcription,
      audioStoragePath: req.audioStoragePath,
    });

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
    if (evalResult.missing_concepts.length > 0 || evalResult.correctness < 75) {
      const gaps = evalResult.missing_concepts.map((concept) => ({
        user_id: userId,
        viva_id: vivaId,
        concept,
        severity: (evalResult.correctness < 60 ? "high" : "medium") as "low" | "medium" | "high",
        explanation: `Student answer lacked complete coverage of ${concept} during question '${question.question_text}'.`,
        recommendation: `Review reference material on ${concept} and its application in relational architecture.`,
      }));
      await evaluationRepository.createKnowledgeGaps(gaps);
    }

    // 7. Check if an adaptive follow-up question should be created
    let followUpQuestion: Question | undefined;
    if (question.question_type === "primary" && evalResult.missing_concepts.length > 0) {
      const followUp = await aiClient.generateFollowUp({
        vivaId,
        questionText: question.question_text,
        concept: question.concept,
        transcription,
        evaluation: {
          correctness: evalResult.correctness,
          completeness: evalResult.completeness,
          feedback: evalResult.feedback,
          missing_concepts: evalResult.missing_concepts,
        },
      });

      const existingQuestions = await vivaRepository.listQuestionsByVivaId(vivaId);
      const insertedFollowUps = await vivaRepository.createQuestions([
        {
          viva_id: vivaId,
          concept: followUp.concept,
          question_text: followUp.question,
          question_type: "follow_up",
          difficulty: followUp.difficulty,
          expected_concepts: followUp.expected_concepts,
          sequence_number: existingQuestions.length + 1,
        },
      ]);
      followUpQuestion = insertedFollowUps[0];
    }

    // 8. Mark response as 'completed'
    response = await vivaRepository.updateResponseStatus(response.id, "completed");

    return {
      response,
      evaluation,
      followUpQuestion,
    };
  }
}

export const vivaService = new VivaService();
