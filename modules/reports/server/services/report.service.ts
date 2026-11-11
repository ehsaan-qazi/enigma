import { vivaRepository, Viva, Question, Response } from "@/modules/viva/server/repositories/viva.repository";
import { evaluationRepository, Evaluation, KnowledgeGap } from "@/modules/evaluations/server/repositories/evaluation.repository";
import { submissionRepository, Submission } from "@/modules/submissions/server/repositories/submission.repository";
import { NotFoundError } from "@/lib/api/errors";

export interface ReportData {
  viva: Viva;
  submission: Submission;
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    averageCorrectness: number;
    averageCompleteness: number;
    averageReasoningQuality: number;
    overallUnderstandingLevel: "High" | "Moderate" | "Needs Improvement";
  };
  demonstratedConcepts: string[];
  missingConcepts: string[];
  knowledgeGaps: KnowledgeGap[];
  evaluations: Array<{
    question: Question;
    response: Response;
    evaluation: Evaluation | null;
  }>;
}

export class ReportService {
  async generateReport(vivaId: string, userId: string): Promise<ReportData> {
    const viva = await vivaRepository.findByIdAndUserId(vivaId, userId);
    if (!viva) {
      throw new NotFoundError("Viva assessment not found or access denied");
    }

    const submission = await submissionRepository.findByIdAndUserId(viva.submission_id, userId);
    if (!submission) {
      throw new NotFoundError("Associated submission not found or access denied");
    }

    const questions = await vivaRepository.listQuestionsByVivaId(vivaId);
    const responses = await vivaRepository.listResponsesByVivaId(vivaId);
    const knowledgeGaps = await evaluationRepository.listKnowledgeGapsByVivaId(vivaId, userId);

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const detailedEvaluations: ReportData["evaluations"] = [];

    const demonstratedSet = new Set<string>();
    const missingSet = new Set<string>();

    let totalCorrectness = 0;
    let totalCompleteness = 0;
    let totalReasoning = 0;
    let evalCount = 0;

    for (const resp of responses) {
      const question = questionMap.get(resp.question_id);
      if (!question) continue;

      const evaluation = await evaluationRepository.findByResponseId(resp.id);
      if (evaluation) {
        evalCount++;
        totalCorrectness += Number(evaluation.correctness);
        totalCompleteness += Number(evaluation.completeness);
        totalReasoning += Number(evaluation.reasoning_quality);

        if (Array.isArray(evaluation.demonstrated_concepts)) {
          (evaluation.demonstrated_concepts as string[]).forEach((c) => demonstratedSet.add(c));
        }
        if (Array.isArray(evaluation.missing_concepts)) {
          (evaluation.missing_concepts as string[]).forEach((c) => missingSet.add(c));
        }
      }

      detailedEvaluations.push({
        question,
        response: resp,
        evaluation,
      });
    }

    const avgCorrectness = evalCount ? Math.round(totalCorrectness / evalCount) : 0;
    const avgCompleteness = evalCount ? Math.round(totalCompleteness / evalCount) : 0;
    const avgReasoning = evalCount ? Math.round(totalReasoning / evalCount) : 0;

    let overallUnderstandingLevel: ReportData["summary"]["overallUnderstandingLevel"] = "Needs Improvement";
    if (avgCorrectness >= 80 && avgCompleteness >= 75) {
      overallUnderstandingLevel = "High";
    } else if (avgCorrectness >= 65) {
      overallUnderstandingLevel = "Moderate";
    }

    return {
      viva,
      submission,
      summary: {
        totalQuestions: questions.length,
        answeredQuestions: responses.length,
        averageCorrectness: avgCorrectness,
        averageCompleteness: avgCompleteness,
        averageReasoningQuality: avgReasoning,
        overallUnderstandingLevel,
      },
      demonstratedConcepts: Array.from(demonstratedSet),
      missingConcepts: Array.from(missingSet),
      knowledgeGaps,
      evaluations: detailedEvaluations,
    };
  }
}

export const reportService = new ReportService();
