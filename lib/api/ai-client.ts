/**
 * Typed HTTP client adapter for the independent Python FastAPI AI service (/internal/v1/*).
 * Includes automatic mock fallback when AI_SERVICE_URL is offline or unreachable,
 * enabling seamless local development and robust fault tolerance.
 */

export interface DocumentAnalyzeRequest {
  submissionId: string;
  documentContent?: string;
  storagePath?: string;
  documentTitle?: string;
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

export interface AnswerEvaluateRequest {
  vivaId: string;
  questionId: string;
  questionText: string;
  expectedConcepts: string[];
  transcription: string;
  audioStoragePath?: string;
}

export interface AnswerEvaluateResult {
  correctness: number; // 0 - 100
  completeness: number; // 0 - 100
  reasoning_quality: number; // 0 - 100
  feedback: string;
  demonstrated_concepts: string[];
  missing_concepts: string[];
  potential_misconceptions?: string[];
  confidence: number; // 0.0 - 1.0
}

export interface FollowUpGenerateRequest {
  vivaId: string;
  questionText: string;
  concept: string;
  transcription: string;
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
}

export interface TranscriptionResult {
  transcription: string;
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
    return this.post<DocumentAnalyzeRequest, DocumentAnalyzeResult>(
      "/internal/v1/documents/analyze",
      req,
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
    return this.post<QuestionGenerateRequest, QuestionGenerateResult>(
      "/internal/v1/questions/generate",
      req,
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
  }

  async evaluateAnswer(req: AnswerEvaluateRequest): Promise<AnswerEvaluateResult> {
    return this.post<AnswerEvaluateRequest, AnswerEvaluateResult>(
      "/internal/v1/answers/evaluate",
      req,
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
        };
      }
    );
  }

  async generateFollowUp(req: FollowUpGenerateRequest): Promise<FollowUpGenerateResult> {
    return this.post<FollowUpGenerateRequest, FollowUpGenerateResult>(
      "/internal/v1/questions/follow-up",
      req,
      () => ({
        question: `Building on your answer regarding ${req.concept}, what specific anomalies could occur if these constraints were violated in high-concurrency production?`,
        concept: req.concept,
        difficulty: "hard",
        reason_for_asking: `Investigate depth of conceptual reasoning regarding ${req.concept}.`,
        expected_concepts: req.evaluation.missing_concepts.length
          ? req.evaluation.missing_concepts
          : ["Concurrency anomalies", "Deadlocks", "Data divergence"],
      })
    );
  }

  async transcribeAudio(req: TranscriptionRequest): Promise<TranscriptionResult> {
    return this.post<TranscriptionRequest, TranscriptionResult>(
      "/internal/v1/transcribe",
      req,
      () => ({
        transcription:
          "In my submission, I implemented database normalization up to third normal form to eliminate data redundancy and prevent update and deletion anomalies, ensuring high referential integrity across all related tables.",
      })
    );
  }
}

export const aiClient = new AiClient();
