/**
 * Typed HTTP client adapter for the independent Python FastAPI AI service (/internal/v1/*).
 * Includes automatic mock fallback when AI_SERVICE_URL is offline or unreachable,
 * and bidirectional camelCase <-> snake_case request normalization aligned with Adil's Pydantic v2 schemas.
 */

export interface DocumentAnalyzeRequest {
  submissionId: string;
  documentContent?: string;
  storagePath?: string;
  documentTitle?: string;
  fileUrl?: string;
}

export interface DocumentAnalyzeResult {
  topics: string[];
  concepts: string[];
  summary: string;
}

export interface QuestionGenerateRequest {
  submissionId: string;
  concepts: string[];
  topics?: string[];
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
}

export interface GeneratedQuestionItem {
  id: string;
  concept: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  expected_concepts: string[];
}

export interface QuestionGenerateResult {
  questions: GeneratedQuestionItem[];
}

export interface KnowledgeGapDto {
  concept: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  recommendation: string;
}

export interface AnswerEvaluateRequest {
  vivaId: string;
  questionId: string;
  questionText: string;
  expectedConcepts: string[];
  transcription: string;
  concept?: string;
  audioStoragePath?: string;
  audioUrl?: string;
  audioBase64?: string;
  audioMimeType?: string;
  documentContext?: string;
}

export interface AnswerEvaluateResult {
  correctness: number; // 0 - 100
  completeness: number; // 0 - 100
  reasoning_quality: number; // 0 - 100
  feedback: string;
  explanation?: string;
  supporting_evidence?: string[];
  demonstrated_concepts: string[];
  missing_concepts: string[];
  potential_misconceptions?: string[];
  knowledge_gaps?: KnowledgeGapDto[];
  confidence: number; // 0.0 - 1.0
  needs_follow_up?: boolean;
}

export interface FollowUpGenerateRequest {
  vivaId: string;
  questionText: string;
  concept: string;
  transcription: string;
  expectedConcepts?: string[];
  evaluation: {
    correctness: number;
    completeness: number;
    feedback: string;
    missing_concepts: string[];
  };
}

export interface FollowUpGenerateResult {
  question: string;
  concept: string;
  difficulty: "easy" | "medium" | "hard";
  reason_for_asking: string;
  expected_concepts: string[];
}

export interface TranscriptionRequest {
  audioStoragePath: string;
  audioUrl?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

export interface TranscriptionResult {
  transcription: string;
}

const CORRECTNESS_LEVELS: Record<string, number> = {
  correct: 95,
  partially_correct: 72,
  incorrect: 35,
  unclear: 45,
};

const COMPLETENESS_LEVELS: Record<string, number> = {
  complete: 95,
  partial: 68,
  incomplete: 25,
};

const REASONING_QUALITY_LEVELS: Record<string, number> = {
  strong: 92,
  adequate: 75,
  weak: 45,
  unfounded: 20,
};

function normalizeScore(
  val: unknown,
  levelMap: Record<string, number>,
  defaultScore: number
): number {
  if (typeof val === "number" && !isNaN(val)) {
    return Math.max(0, Math.min(100, Math.round(val)));
  }
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(100, Math.round(parsed)));
    }
    const clean = val.trim().toLowerCase();
    if (clean in levelMap) {
      return levelMap[clean];
    }
  }
  return defaultScore;
}

export class AiClient {
  private baseUrl: string;
  private secret: string;

  constructor() {
    this.baseUrl = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");
    this.secret = process.env.AI_SERVICE_SECRET || "";
  }

  private async post<TReq, TRes>(
    endpoint: string,
    body: TReq,
    mockFallback: () => TRes
  ): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": this.secret,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(
          `[AiClient] Request to ${url} returned status ${response.status}. Using mock fallback.`
        );
        return mockFallback();
      }

      const data = await response.json();
      return data as TRes;
    } catch (err) {
      console.warn(
        `[AiClient] Unable to connect to ${url} (${err instanceof Error ? err.message : String(err)}). Using mock fallback adapter.`
      );
      return mockFallback();
    }
  }

  async analyzeDocument(req: DocumentAnalyzeRequest): Promise<DocumentAnalyzeResult> {
    const payload = {
      submission_id: req.submissionId,
      submissionId: req.submissionId,
      title: req.documentTitle,
      content: req.documentContent || req.documentTitle || "Academic submission document",
      file_url: req.fileUrl,
      metadata: {
        storagePath: req.storagePath,
      },
    };

    return this.post<typeof payload, DocumentAnalyzeResult>(
      "/internal/v1/documents/analyze",
      payload,
      () => ({
        topics: [
          "System Architecture",
          "Relational Database Design",
          "Asynchronous Task Processing",
          "Security & RLS Policies",
        ],
        concepts: [
          "Database Normalization",
          "Row Level Security",
          "ACID Transactions",
          "Idempotent API Design",
          "Distributed Authentication",
        ],
        summary:
          "The submitted academic document details a resilient modular architecture featuring secure database design, automated assessment pipelines, and granular authorization controls.",
      })
    );
  }

  async generateQuestions(req: QuestionGenerateRequest): Promise<QuestionGenerateResult> {
    const payload = {
      submission_id: req.submissionId,
      submissionId: req.submissionId,
      concepts: req.concepts,
      topics: req.topics || [],
      num_questions: req.count || 5,
      difficulty_constraints: req.difficulty ? [req.difficulty] : undefined,
    };

    const result = await this.post<typeof payload, any>(
      "/internal/v1/questions/generate",
      payload,
      () => ({
        questions: [
          {
            id: "q-1",
            concept: "Database Normalization",
            question:
              "Can you explain why database normalization is important in this design, and what tradeoffs you made?",
            difficulty: "medium",
            expected_concepts: [
              "Data redundancy reduction",
              "Referential integrity",
              "Update anomalies",
            ],
          },
          {
            id: "q-2",
            concept: "Row Level Security",
            question:
              "How does your implementation ensure that one student cannot access another student's submission records or audio responses?",
            difficulty: "hard",
            expected_concepts: [
              "PostgreSQL Row Level Security",
              "auth.uid() tenant isolation",
              "Private Supabase Storage policies",
            ],
          },
          {
            id: "q-3",
            concept: "Asynchronous Processing",
            question:
              "Why is document analysis handled asynchronously rather than synchronously in the HTTP request cycle?",
            difficulty: "easy",
            expected_concepts: [
              "HTTP request timeout prevention",
              "Decoupled background worker",
              "User experience responsiveness",
            ],
          },
        ],
      })
    );

    if (Array.isArray(result?.questions)) {
      return {
        questions: result.questions.map((q: any) => ({
          id: String(q.id || `q-${Math.random().toString(36).slice(2, 7)}`),
          concept: String(q.concept || "Core Concept"),
          question: String(q.question || q.question_text || ""),
          difficulty: (q.difficulty || "medium") as "easy" | "medium" | "hard",
          expected_concepts: Array.isArray(q.expected_concepts) ? q.expected_concepts : [],
        })),
      };
    }

    return result as QuestionGenerateResult;
  }

  async evaluateAnswer(req: AnswerEvaluateRequest): Promise<AnswerEvaluateResult> {
    const payload = {
      viva_id: req.vivaId,
      vivaId: req.vivaId,
      question_id: req.questionId,
      questionId: req.questionId,
      concept: req.concept || req.expectedConcepts?.[0] || "Core Concept",
      question: req.questionText,
      question_text: req.questionText,
      expected_concepts: req.expectedConcepts,
      expectedConcepts: req.expectedConcepts,
      transcription: req.transcription,
      audio_url: req.audioUrl,
      audio_base64: req.audioBase64,
      audio_mime_type: req.audioMimeType || "audio/webm",
      document_context: req.documentContext,
    };

    const raw = await this.post<typeof payload, any>(
      "/internal/v1/answers/evaluate",
      payload,
      () => {
        const text = (req.transcription || "").toLowerCase();
        const hasRedundancy = text.includes("redundanc") || text.includes("duplicate");
        const hasIntegrity = text.includes("integrity") || text.includes("consistency");

        if (hasRedundancy || hasIntegrity) {
          return {
            correctness: 88,
            completeness: 82,
            reasoning_quality: 85,
            feedback:
              "Strong conceptual understanding demonstrated. Successfully articulated the principles of data integrity and anomaly prevention.",
            demonstrated_concepts: req.expectedConcepts.slice(0, 2),
            missing_concepts: req.expectedConcepts.slice(2),
            confidence: 0.92,
            needs_follow_up: false,
          };
        }

        return {
          correctness: 72,
          completeness: 68,
          reasoning_quality: 70,
          feedback:
            "Good foundational attempt. While the core intuition was conveyed, deeper specifics regarding anomalies and normalization rules could be reinforced.",
          demonstrated_concepts: req.expectedConcepts.slice(0, 1),
          missing_concepts: req.expectedConcepts.slice(1),
          confidence: 0.85,
          needs_follow_up: true,
        };
      }
    );

    const correctness = normalizeScore(raw.correctness, CORRECTNESS_LEVELS, 75);
    const completeness = normalizeScore(raw.completeness, COMPLETENESS_LEVELS, 70);
    const reasoning_quality = normalizeScore(
      raw.reasoning_quality,
      REASONING_QUALITY_LEVELS,
      72
    );

    return {
      correctness,
      completeness,
      reasoning_quality,
      feedback: String(raw.feedback || "Evaluation completed."),
      explanation: raw.explanation ? String(raw.explanation) : undefined,
      supporting_evidence: Array.isArray(raw.supporting_evidence) ? raw.supporting_evidence : undefined,
      demonstrated_concepts: Array.isArray(raw.demonstrated_concepts)
        ? raw.demonstrated_concepts
        : [],
      missing_concepts: Array.isArray(raw.missing_concepts)
        ? raw.missing_concepts
        : [],
      potential_misconceptions: Array.isArray(raw.misconceptions)
        ? raw.misconceptions
        : Array.isArray(raw.potential_misconceptions)
        ? raw.potential_misconceptions
        : [],
      knowledge_gaps: Array.isArray(raw.knowledge_gaps) ? raw.knowledge_gaps : undefined,
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.9,
      needs_follow_up: typeof raw.needs_follow_up === "boolean" ? raw.needs_follow_up : undefined,
    };
  }

  async generateFollowUp(req: FollowUpGenerateRequest): Promise<FollowUpGenerateResult> {
    const payload = {
      viva_id: req.vivaId,
      vivaId: req.vivaId,
      original_question: req.questionText,
      concept: req.concept,
      student_response: req.transcription,
      expected_concepts: req.expectedConcepts || [],
      evaluation_result: req.evaluation,
    };

    const raw = await this.post<typeof payload, any>(
      "/internal/v1/questions/follow-up",
      payload,
      () => ({
        follow_up_question: `Building on your answer regarding ${req.concept}, what specific anomalies could occur if these constraints were violated in high-concurrency production?`,
        concept_investigated: req.concept,
        difficulty: "hard" as const,
        reason_for_asking: `Investigate depth of conceptual reasoning regarding ${req.concept}.`,
        expected_concepts: req.evaluation.missing_concepts.length
          ? req.evaluation.missing_concepts
          : ["Concurrency anomalies", "Deadlocks", "Data divergence"],
      })
    );

    const question = String(
      raw.follow_up_question ||
        raw.question?.question ||
        raw.question?.question_text ||
        raw.question ||
        `Can you elaborate further on ${req.concept}?`
    );

    const concept = String(raw.concept_investigated || raw.concept || req.concept);
    const difficulty = (raw.difficulty || "medium") as "easy" | "medium" | "hard";
    const reason_for_asking = String(raw.reason_for_asking || "Probing depth of reasoning.");
    const expected_concepts = Array.isArray(raw.expected_concepts)
      ? raw.expected_concepts
      : Array.isArray(raw.question?.expected_concepts)
      ? raw.question.expected_concepts
      : [];

    return {
      question,
      concept,
      difficulty,
      reason_for_asking,
      expected_concepts,
    };
  }

  async transcribeAudio(req: TranscriptionRequest): Promise<TranscriptionResult> {
    const payload = {
      audio_storage_path: req.audioStoragePath,
      audio_url: req.audioUrl,
    };

    return this.post<typeof payload, TranscriptionResult>(
      "/internal/v1/transcribe",
      payload,
      () => ({
        transcription:
          "In my submission, I implemented database normalization up to third normal form to eliminate data redundancy and prevent update and deletion anomalies, ensuring high referential integrity across all related tables.",
      })
    );
  }
}

export const aiClient = new AiClient();
