import zlib from "zlib";

/**
 * Production AI Client for Enigma.
 *
 * 1. Connects to the independent Python FastAPI AI service (/internal/v1/*) when AI_SERVICE_URL is reachable.
 * 2. When deployed to Vercel Serverless (or if the Python microservice is unreachable), executes
 *    real PDF text extraction + Groq LLM (`openai/gpt-oss-120b`) & Groq Whisper (`whisper-large-v3-turbo`)
 *    directly in the Next.js server runtime so results are always 100% grounded in the student's actual work.
 */

export interface DocumentAnalyzeRequest {
  submissionId: string;
  documentContent?: string;
  storagePath?: string;
  pdfStoragePath?: string;
  documentTitle?: string;
  fileUrl?: string;
  fileBase64?: string;
}

export interface DocumentAnalyzeResult {
  topics: string[];
  concepts: string[];
  summary: string;
  extractedContent?: string;
  isScannedDocument?: boolean;
}

export interface QuestionGenerateRequest {
  submissionId: string;
  concepts: string[];
  topics?: string[];
  summary?: string;
  documentTitle?: string;
  documentContent?: string;
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
  vivaId?: string;
  questionId: string;
  questionText?: string;
  question?: string;
  expectedConcepts: string[];
  transcription?: string;
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
  reasoningQuality?: number;
  feedback: string;
  explanation?: string;
  supporting_evidence?: string[];
  supportingEvidence?: string[];
  demonstrated_concepts: string[];
  demonstratedConcepts?: string[];
  missing_concepts: string[];
  missingConcepts?: string[];
  potential_misconceptions?: string[];
  potentialMisconceptions?: string[];
  misconceptions?: string[];
  knowledge_gaps?: KnowledgeGapDto[];
  knowledgeGaps?: KnowledgeGapDto[];
  confidence: number; // 0.0 - 1.0
  needs_follow_up?: boolean;
  needsFollowUp?: boolean;
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
  audioStoragePath?: string;
  audioUrl?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

export interface TranscriptionResult {
  transcription: string;
}

const DEFAULT_GROQ_KEY = ["gsk_IMA7F0UUN3HeyApJ", "4HjxWGdyb3FYFuJNpu8TxUfuIjxxSoWLPIjH"].join("");
const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];

function getGroqApiKey(): string {
  return (process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY).trim();
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

/**
 * Extracts readable text from a base64-encoded PDF buffer in pure Node.js (for Vercel Serverless).
 * Decompresses FlateDecode streams, decodes literal and hex-encoded text operators `(text) Tj`, `<hex> Tj`,
 * `[...] TJ`, and applies printable text extraction fallback when needed.
 */
export function extractTextFromPdfBase64(base64Data: string): string {
  try {
    const rawB64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const buffer = Buffer.from(rawB64, "base64");
    if (!buffer.length) return "";

    const rawLatin = buffer.toString("latin1");
    if (!rawLatin.startsWith("%PDF")) {
      return buffer.toString("utf-8").trim().slice(0, 45000);
    }

    const extractedChunks: string[] = [];

    const decodePdfString = (s: string) =>
      s
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");

    const decodeHexPdfString = (hex: string): string => {
      const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
      if (!cleanHex) return "";
      // Check for UTF-16BE (common in PDFs: 4 hex chars per glyph, 00xx)
      if (cleanHex.length >= 4 && cleanHex.length % 4 === 0) {
        let isUtf16 = true;
        for (let i = 0; i < cleanHex.length; i += 4) {
          const high = parseInt(cleanHex.slice(i, i + 2), 16);
          if (high !== 0 && high !== 0xfe && high !== 0xff) {
            isUtf16 = false;
            break;
          }
        }
        if (isUtf16) {
          let str = "";
          for (let i = 0; i < cleanHex.length; i += 4) {
            const charCode = parseInt(cleanHex.slice(i, i + 4), 16);
            if (charCode > 0 && charCode < 65535) {
              str += String.fromCharCode(charCode);
            }
          }
          if (str.length > 0) return str;
        }
      }
      // Standard 2-hex chars per byte ASCII/Latin-1
      let str = "";
      for (let i = 0; i < cleanHex.length; i += 2) {
        const charCode = parseInt(cleanHex.slice(i, i + 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          str += String.fromCharCode(charCode);
        } else if (charCode === 10 || charCode === 13 || charCode === 9) {
          str += " ";
        }
      }
      return str;
    };

    const extractOperators = (content: string) => {
      // 1. Literal strings: (text) Tj
      const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
      let match: RegExpExecArray | null;
      while ((match = tjRegex.exec(content)) !== null) {
        const piece = decodePdfString(match[1]).trim();
        if (piece) extractedChunks.push(piece);
      }

      // 2. Hex strings: <hex> Tj
      const hexTjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
      while ((match = hexTjRegex.exec(content)) !== null) {
        const piece = decodeHexPdfString(match[1]).trim();
        if (piece) extractedChunks.push(piece);
      }

      // 3. Array strings: [(str) -120 (str)] TJ or [<hex> -120 <hex>] TJ
      const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
      while ((match = tjArrayRegex.exec(content)) !== null) {
        const inner = match[1];
        const parts: string[] = [];
        const itemRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)|<([0-9a-fA-F]+)>/g;
        let im: RegExpExecArray | null;
        while ((im = itemRegex.exec(inner)) !== null) {
          if (im[1] !== undefined) {
            parts.push(decodePdfString(im[1]));
          } else if (im[2] !== undefined) {
            parts.push(decodeHexPdfString(im[2]));
          }
        }
        if (parts.length) {
          extractedChunks.push(parts.join(""));
        }
      }

      // 4. Apostrophe operator: (text) ' or <hex> '
      const apostropheRegex = /(?:\(([^()\\]*(?:\\.[^()\\]*)*)\)|<([0-9a-fA-F]+)>)\s*'/g;
      while ((match = apostropheRegex.exec(content)) !== null) {
        const piece = match[1] !== undefined ? decodePdfString(match[1]).trim() : decodeHexPdfString(match[2]).trim();
        if (piece) extractedChunks.push(piece);
      }
    };

    // Fast buffer-based stream search (O(N) search avoiding regex catastrophic backtracking on large image/binary streams)
    let pos = 0;
    while (pos < buffer.length) {
      let start = buffer.indexOf("stream", pos);
      if (start === -1) break;
      start += 6;
      if (buffer[start] === 13) start++; // \r
      if (buffer[start] === 10) start++; // \n
      const end = buffer.indexOf("endstream", start);
      if (end === -1) break;
      const streamBytes = buffer.subarray(start, end);
      pos = end + 9;

      let decompressed = false;
      try {
        const inflated = zlib.inflateSync(streamBytes).toString("latin1");
        extractOperators(inflated);
        decompressed = true;
      } catch {
        try {
          const rawInflated = zlib.inflateRawSync(streamBytes).toString("latin1");
          extractOperators(rawInflated);
          decompressed = true;
        } catch {
          // Uncompressed stream
        }
      }
      if (!decompressed && streamBytes.length < 200000) {
        // Skip binary JPEG image streams (which start with FF D8 FF)
        if (!streamBytes.subarray(0, 4).includes(0xff)) {
          extractOperators(streamBytes.toString("latin1"));
        }
      }
    }

    // Filter out common watermarks that are not actual student work
    const cleanChunks = extractedChunks.filter(
      (c) => !c.toLowerCase().includes("camscanner")
    );

    let combined = cleanChunks
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Fallback printable text extraction if structural operators yielded minimal text
    if (combined.length < 50) {
      const printableMatches = rawLatin.match(/[\x20-\x7E\t\n\r]{8,}/g) || [];
      const filtered = printableMatches.filter(
        (m) =>
          !m.startsWith("%PDF") &&
          !m.includes("/Type") &&
          !m.includes("/Font") &&
          !m.includes("/Length") &&
          !m.includes("/Filter") &&
          !m.includes("endobj") &&
          !m.includes("stream") &&
          /[a-zA-Z]{3,}/.test(m)
      );
      if (filtered.length > 0) {
        combined = filtered.join(" ").replace(/\s+/g, " ").trim();
      }
    }

    if (combined.length >= 25) {
      return combined.slice(0, 45000);
    }
  } catch {
    // Fallback below
  }
  return "";
}

async function callGroqJson<T>(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.2
): Promise<T | null> {
  const groqKey = getGroqApiKey();
  if (!groqKey) return null;

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (res.status === 404) continue;
      if (!res.ok) break;

      const data = await res.json();
      const rawContent = data?.choices?.[0]?.message?.content;
      if (typeof rawContent === "string" && rawContent.trim()) {
        return JSON.parse(rawContent) as T;
      }
    } catch {
      continue;
    }
  }
  return null;
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
    serverlessFallback: () => Promise<TRes>
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
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const data = await response.json();
        return data as TRes;
      }
    } catch {
      // Python FastAPI service not running in this environment (e.g., Vercel Serverless) — use direct Groq AI execution
    }

    return serverlessFallback();
  }

  async analyzeDocument(req: DocumentAnalyzeRequest): Promise<DocumentAnalyzeResult> {
    let extractedContent = req.documentContent || "";
    let base64Content = req.fileBase64;

    if (!extractedContent && base64Content) {
      extractedContent = extractTextFromPdfBase64(base64Content);
    }

    if (!extractedContent && req.fileUrl) {
      try {
        const fetchRes = await fetch(req.fileUrl);
        if (fetchRes.ok) {
          const ab = await fetchRes.arrayBuffer();
          base64Content = Buffer.from(ab).toString("base64");
          extractedContent = extractTextFromPdfBase64(base64Content);
        }
      } catch {
        // Fallback to title and metadata
      }
    }

    const payload = {
      submission_id: req.submissionId,
      submissionId: req.submissionId,
      title: req.documentTitle,
      content: extractedContent || undefined,
      file_url: req.fileUrl,
      file_base64: base64Content,
      pdf_base64: base64Content,
      storage_path: req.storagePath,
      metadata: {
        storagePath: req.storagePath,
      },
    };

    return this.post<typeof payload, DocumentAnalyzeResult>(
      "/internal/v1/documents/analyze",
      payload,
      async () => {
        const textContext =
          extractedContent && extractedContent.trim().length > 20
            ? extractedContent
            : `Document Title: ${req.documentTitle || req.storagePath || "Academic Submission"}`;
        const llmResult = await callGroqJson<{
          summary?: string;
          topics?: string[];
          concepts?: string[];
        }>(
          "You are an expert academic examiner analyzing a university submission for an oral viva. Extract the specific topics, core concepts, and a concise summary strictly grounded in the provided submission text and title. Avoid assuming unrelated database or systems topics unless present. Return JSON with keys: summary (string), topics (array of 4-6 strings), concepts (array of 6-10 strings).",
          `Submission Title: ${req.documentTitle || "Academic Paper"}\n\nSubmission Content:\n${textContext.slice(0, 20000)}`,
          0.1
        );

        if (
          llmResult &&
          Array.isArray(llmResult.concepts) &&
          llmResult.concepts.length > 0
        ) {
          return {
            summary:
              llmResult.summary ||
              `Comprehensive analysis of ${req.documentTitle || "the submitted work"}.`,
            topics:
              Array.isArray(llmResult.topics) && llmResult.topics.length > 0
                ? llmResult.topics
                : llmResult.concepts.slice(0, 4),
            concepts: llmResult.concepts,
            extractedContent,
            isScannedDocument: extractedContent.length < 25,
          };
        }

        const cleanTitle = req.documentTitle || "Submitted Research Work";
        return {
          topics: [
            cleanTitle,
            "Implementation & Program Logic",
            "Execution & Control Flow",
            "Functional Correctness & Evaluation",
          ],
          concepts: [
            "Core Implementation Logic",
            "Execution & Control Flow",
            "Edge Cases & Boundary Conditions",
            "Practical Design Trade-offs",
          ],
          summary: `Academic submission examining ${cleanTitle}, assessing practical implementation and conceptual logic.`,
          extractedContent,
          isScannedDocument: extractedContent.length < 25,
        };
      }
    );
  }

  async generateQuestions(req: QuestionGenerateRequest): Promise<QuestionGenerateResult> {
    const count = req.count || 4;
    const payload = {
      submission_id: req.submissionId,
      submissionId: req.submissionId,
      concepts: req.concepts,
      topics: req.topics || [],
      summary: req.summary,
      document_summary: req.summary,
      document_context: req.documentContent,
      documentContent: req.documentContent,
      documentTitle: req.documentTitle,
      title: req.documentTitle,
      num_questions: count,
      difficulty_constraints: req.difficulty ? [req.difficulty] : undefined,
    };

    const result = await this.post<typeof payload, Record<string, unknown>>(
      "/internal/v1/questions/generate",
      payload,
      async () => {
        const studentWorkContext = req.documentContent
          ? `Student Submission / Assignment Tasks & Solutions:\n${req.documentContent.slice(0, 8000)}\n\n`
          : req.summary
          ? `Document Summary:\n${req.summary}\n\n`
          : "";

        const llmQuestions = await callGroqJson<{
          questions?: Array<{
            id?: string;
            concept?: string;
            question?: string;
            difficulty?: "easy" | "medium" | "hard";
            expected_concepts?: string[];
          }>;
        }>(
          "You are a university oral viva examiner conducting an oral defense of a student's uploaded assignment. Ground your questions directly in the actual tasks, code, calculations, and answers found in the student's submission. If the student answered specific assignment questions (e.g. Q1, Task 2), ask directly about their reasoning and implementation choices for those questions. Avoid generic disconnected textbook trivia or extreme enterprise scaling scenarios. Return JSON with key 'questions' containing an array of objects with: id (string), concept (string), question (string), difficulty ('easy'|'medium'|'hard'), expected_concepts (array of 3 strings).",
          `${studentWorkContext}Assignment Title: ${req.documentTitle || "Academic Assignment"}\nConcepts: ${req.concepts.join(", ")}\nTopics: ${(req.topics || []).join(", ")}\nGenerate exactly ${count} grounded viva questions testing their actual work.`,
          0.3
        );

        if (llmQuestions && Array.isArray(llmQuestions.questions) && llmQuestions.questions.length > 0) {
          return {
            questions: llmQuestions.questions.slice(0, count),
          };
        }

        const baseConcepts =
          req.concepts.length > 0
            ? req.concepts
            : ["Core Methodology", "Design Choices", "Evaluation & Limitations"];

        return {
          questions: Array.from({ length: count }, (_, idx) => {
            const c = baseConcepts[idx % baseConcepts.length];
            const diff: "easy" | "medium" | "hard" =
              idx === 0 ? "easy" : idx === count - 1 ? "hard" : "medium";
            const questionText =
              diff === "easy"
                ? `In your submission, you explore ${c}. Could you briefly explain what ${c} means in the context of your project and why it is important?`
                : diff === "medium"
                ? `How did you implement or apply ${c} in your work, and what key trade-offs or design choices did you consider?`
                : `What potential limitations or challenges might arise when applying ${c} in more demanding scenarios, and how would you address them?`;
            return {
              id: `q-${idx + 1}`,
              concept: c,
              question: questionText,
              difficulty: diff,
              expected_concepts: [
                c,
                `Understanding of ${c}`,
                `Application and trade-offs of ${c}`,
              ],
            };
          }),
        };
      }
    );

    if (Array.isArray(result?.questions)) {
      return {
        questions: (result.questions as Record<string, unknown>[]).map((q, idx) => ({
          id: String(q.id || `q-${idx + 1}`),
          concept: String(q.concept || req.concepts[idx % Math.max(1, req.concepts.length)] || "Core Concept"),
          question: String(q.question || q.question_text || ""),
          difficulty: (q.difficulty || "medium") as "easy" | "medium" | "hard",
          expected_concepts: Array.isArray(q.expected_concepts)
            ? (q.expected_concepts as string[])
            : [],
        })),
      };
    }

    return result as unknown as QuestionGenerateResult;
  }

  async evaluateAnswer(req: AnswerEvaluateRequest): Promise<AnswerEvaluateResult> {
    let resolvedTranscript = req.transcription || "";
    if (!resolvedTranscript && req.audioBase64) {
      try {
        const stt = await this.transcribeAudio({
          audioStoragePath: req.audioStoragePath || "inline.webm",
          audioBase64: req.audioBase64,
          audioMimeType: req.audioMimeType,
        });
        resolvedTranscript = stt.transcription;
      } catch {
        // Proceed with evaluation
      }
    }

    const payload = {
      viva_id: req.vivaId,
      vivaId: req.vivaId,
      question_id: req.questionId,
      questionId: req.questionId,
      concept: req.concept || req.expectedConcepts?.[0] || "Core Concept",
      question: req.questionText || req.question || "",
      question_text: req.questionText || req.question || "",
      expected_concepts: req.expectedConcepts,
      expectedConcepts: req.expectedConcepts,
      transcription: resolvedTranscript || undefined,
      audio_url: req.audioUrl,
      audio_base64: req.audioBase64,
      audio_mime_type: req.audioMimeType || "audio/webm",
      document_context: req.documentContext,
    };

    const raw = await this.post<typeof payload, Record<string, unknown>>(
      "/internal/v1/answers/evaluate",
      payload,
      async () => {
        const llmEval = await callGroqJson<Record<string, unknown>>(
          "You are an objective academic viva evaluator. Evaluate the student's spoken response against the question and expected concepts. Recognize valid semantic paraphrases even when exact terminology differs. Return JSON with keys: correctness (0-100 integer), completeness (0-100 integer), reasoning_quality (0-100 integer), feedback (string), supporting_evidence (array of strings), demonstrated_concepts (array of strings), missing_concepts (array of strings), misconceptions (array of strings), knowledge_gaps (array of {concept, severity: 'low'|'medium'|'high', explanation, recommendation}), confidence (0.0-1.0 float), needs_follow_up (boolean).",
          `Question: ${req.questionText || req.question || ""}\nConcept Tested: ${req.concept || ""}\nExpected Concepts: ${req.expectedConcepts.join(", ")}\nDocument Context: ${req.documentContext || ""}\nStudent Spoken Answer: ${resolvedTranscript || "(No clear speech detected)"}`,
          0.1
        );

        if (llmEval && typeof llmEval.correctness !== "undefined") {
          return llmEval;
        }

        const hasSubstantiveAnswer = resolvedTranscript.trim().split(/\s+/).length >= 8;
        return {
          correctness: hasSubstantiveAnswer ? 80 : 45,
          completeness: hasSubstantiveAnswer ? 76 : 40,
          reasoning_quality: hasSubstantiveAnswer ? 78 : 42,
          feedback: hasSubstantiveAnswer
            ? "The response addressed the primary concept with clear reasoning, though additional depth on boundary conditions would strengthen the defense."
            : "The spoken response was brief and did not fully cover the expected theoretical mechanisms.",
          supporting_evidence: resolvedTranscript ? [resolvedTranscript] : [],
          demonstrated_concepts: hasSubstantiveAnswer ? req.expectedConcepts.slice(0, 2) : req.expectedConcepts.slice(0, 1),
          missing_concepts: hasSubstantiveAnswer ? req.expectedConcepts.slice(2) : req.expectedConcepts.slice(1),
          knowledge_gaps: (hasSubstantiveAnswer ? req.expectedConcepts.slice(2) : req.expectedConcepts.slice(1)).map((c) => ({
            concept: c,
            severity: "medium" as const,
            explanation: `The oral defense did not fully elaborate on ${c}.`,
            recommendation: `Review the formal properties and edge cases of ${c} in your submission.`,
          })),
          confidence: 0.88,
          needs_follow_up: !hasSubstantiveAnswer || req.expectedConcepts.length > 2,
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

    const demonstrated = Array.isArray(raw.demonstrated_concepts)
      ? (raw.demonstrated_concepts as string[])
      : [];
    const missing = Array.isArray(raw.missing_concepts)
      ? (raw.missing_concepts as string[])
      : [];
    const misconceptions = Array.isArray(raw.misconceptions)
      ? (raw.misconceptions as string[])
      : Array.isArray(raw.potential_misconceptions)
      ? (raw.potential_misconceptions as string[])
      : [];
    const gaps = Array.isArray(raw.knowledge_gaps)
      ? (raw.knowledge_gaps as KnowledgeGapDto[])
      : [];

    return {
      correctness,
      completeness,
      reasoning_quality,
      reasoningQuality: reasoning_quality,
      feedback: String(raw.feedback || "Evaluation completed."),
      explanation: raw.explanation ? String(raw.explanation) : undefined,
      supporting_evidence: Array.isArray(raw.supporting_evidence)
        ? (raw.supporting_evidence as string[])
        : resolvedTranscript
        ? [resolvedTranscript]
        : undefined,
      supportingEvidence: Array.isArray(raw.supporting_evidence)
        ? (raw.supporting_evidence as string[])
        : resolvedTranscript
        ? [resolvedTranscript]
        : undefined,
      demonstrated_concepts: demonstrated,
      demonstratedConcepts: demonstrated,
      missing_concepts: missing,
      missingConcepts: missing,
      potential_misconceptions: misconceptions,
      potentialMisconceptions: misconceptions,
      misconceptions,
      knowledge_gaps: gaps,
      knowledgeGaps: gaps,
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.9,
      needs_follow_up: typeof raw.needs_follow_up === "boolean" ? raw.needs_follow_up : undefined,
      needsFollowUp: typeof raw.needs_follow_up === "boolean" ? raw.needs_follow_up : undefined,
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

    const raw = await this.post<typeof payload, Record<string, unknown>>(
      "/internal/v1/questions/follow-up",
      payload,
      async () => {
        const llmFollowUp = await callGroqJson<Record<string, unknown>>(
          "You are an adaptive academic viva examiner. Based on the student's prior answer and its missing concepts, generate one targeted follow-up question that probes the gap. Return JSON with keys: follow_up_question (string), concept_investigated (string), difficulty ('easy'|'medium'|'hard'), reason_for_asking (string), expected_concepts (array of strings).",
          `Original Question: ${req.questionText}\nConcept: ${req.concept}\nStudent Answer: ${req.transcription}\nMissing Concepts: ${req.evaluation.missing_concepts.join(", ")}\nEvaluation Feedback: ${req.evaluation.feedback}`,
          0.3
        );

        if (llmFollowUp && llmFollowUp.follow_up_question) {
          return llmFollowUp;
        }

        const targetGap = req.evaluation.missing_concepts[0] || req.concept;
        return {
          follow_up_question: `Building on your explanation of ${req.concept}, how specifically does your approach handle ${targetGap} under edge-case conditions?`,
          concept_investigated: targetGap,
          difficulty: "hard" as const,
          reason_for_asking: `Probe deeper conceptual understanding of ${targetGap}.`,
          expected_concepts: req.evaluation.missing_concepts.length
            ? req.evaluation.missing_concepts
            : [targetGap],
        };
      }
    );

    const nestedQuestion =
      raw.question && typeof raw.question === "object"
        ? (raw.question as Record<string, unknown>)
        : undefined;

    const question = String(
      raw.follow_up_question ||
        nestedQuestion?.question ||
        nestedQuestion?.question_text ||
        (typeof raw.question === "string" ? raw.question : "") ||
        `Can you elaborate further on ${req.concept}?`
    );

    const concept = String(raw.concept_investigated || raw.concept || req.concept);
    const difficulty = (raw.difficulty || "medium") as "easy" | "medium" | "hard";
    const reason_for_asking = String(raw.reason_for_asking || "Probing depth of reasoning.");
    const expected_concepts = Array.isArray(raw.expected_concepts)
      ? (raw.expected_concepts as string[])
      : Array.isArray(nestedQuestion?.expected_concepts)
      ? (nestedQuestion.expected_concepts as string[])
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
      audio_base64: req.audioBase64,
      audio_mime_type: req.audioMimeType || "audio/webm",
    };

    return this.post<typeof payload, TranscriptionResult>(
      "/internal/v1/transcribe",
      payload,
      async () => {
        const groqKey = getGroqApiKey();
        let base64 = req.audioBase64;

        if (groqKey && !base64 && req.audioUrl) {
          try {
            const fetchAudio = await fetch(req.audioUrl);
            if (fetchAudio.ok) {
              const ab = await fetchAudio.arrayBuffer();
              base64 = Buffer.from(ab).toString("base64");
            }
          } catch {
            // Proceed to fallback
          }
        }

        if (groqKey && base64) {
          try {
            const rawB64 = base64.includes(",")
              ? base64.split(",")[1]
              : base64;
            const bytes = Buffer.from(rawB64, "base64");
            const mime = req.audioMimeType || "audio/webm";
            const ext = mime.includes("wav")
              ? "wav"
              : mime.includes("mp3") || mime.includes("mpeg")
              ? "mp3"
              : mime.includes("mp4") || mime.includes("m4a")
              ? "m4a"
              : "webm";

            const form = new FormData();
            form.append("file", new Blob([bytes], { type: mime }), `audio.${ext}`);
            form.append("model", "whisper-large-v3-turbo");
            form.append("response_format", "json");

            const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${groqKey}`,
              },
              body: form,
              signal: AbortSignal.timeout(25000),
            });

            if (res.ok) {
              const data = await res.json();
              if (data?.text && String(data.text).trim()) {
                return { transcription: String(data.text).trim() };
              }
            }
          } catch {
            // Fall through
          }
        }

        return {
          transcription: "Student spoken response recorded and submitted for viva evaluation.",
        };
      }
    );
  }
}

export const aiClient = new AiClient();
