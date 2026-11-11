import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { Tables } from "@/lib/database.types";

export type ProfileRow = Tables<"profiles">;
export type SubmissionRow = Tables<"submissions"> & {
  concepts_count?: number;
  extracted_topics?: string[];
  extracted_concepts?: string[];
  summary?: string;
  viva_session_id?: string;
};
export type VivaRow = Tables<"vivas">;
export type QuestionRow = Tables<"questions"> & {
  follow_up_reason?: string;
};
export type ResponseRow = Tables<"responses">;
export type EvaluationRow = Tables<"evaluations">;
export type KnowledgeGapRow = Tables<"knowledge_gaps">;

interface UploadedFileRecord {
  path: string;
  base64: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

interface LocalDatabaseState {
  profiles: ProfileRow[];
  submissions: SubmissionRow[];
  vivas: VivaRow[];
  questions: QuestionRow[];
  responses: ResponseRow[];
  evaluations: EvaluationRow[];
  knowledge_gaps: KnowledgeGapRow[];
  uploaded_files: Record<string, UploadedFileRecord>;
}

const DB_FILE_PATH = path.join(os.tmpdir(), "enigma-runtime-store.json");
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

function createInitialState(): LocalDatabaseState {
  return {
    profiles: [],
    submissions: [],
    vivas: [],
    questions: [],
    responses: [],
    evaluations: [],
    knowledge_gaps: [],
    uploaded_files: {},
  };
}

class LocalStore {
  private inMemoryCache: LocalDatabaseState | null = null;

  private readState(): LocalDatabaseState {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw) as LocalDatabaseState;
        if (parsed && Array.isArray(parsed.submissions)) {
          this.inMemoryCache = parsed;
          return parsed;
        }
      }
    } catch {
      // Re-initialize if unreadable
    }
    const initial = createInitialState();
    this.inMemoryCache = initial;
    this.writeState(initial);
    return initial;
  }

  private writeState(state: LocalDatabaseState): void {
    this.inMemoryCache = state;
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
    } catch {
      // Ignore write errors in read-only filesystems
    }
  }

  public getDefaultUserId(): string {
    return DEFAULT_USER_ID;
  }

  public newId(prefix?: string): string {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}_${uuid.slice(0, 8)}` : uuid;
  }

  // --- Uploaded Files ---
  public saveUploadedFile(filePath: string, base64: string, mimeType: string, size: number): void {
    const state = this.readState();
    state.uploaded_files[filePath] = {
      path: filePath,
      base64,
      mimeType,
      size,
      updatedAt: new Date().toISOString(),
    };
    this.writeState(state);
  }

  public getUploadedFile(filePath: string): UploadedFileRecord | null {
    const state = this.readState();
    return state.uploaded_files[filePath] || null;
  }

  // --- Profiles ---
  public findProfileById(id: string): ProfileRow | null {
    const state = this.readState();
    return state.profiles.find((p) => p.id === id) || state.profiles[0] || null;
  }

  public upsertProfile(profile: Partial<ProfileRow> & { id: string }): ProfileRow {
    const state = this.readState();
    const now = new Date().toISOString();
    const idx = state.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      state.profiles[idx] = {
        ...state.profiles[idx],
        ...profile,
        updated_at: now,
      };
      this.writeState(state);
      return state.profiles[idx];
    }
    const created: ProfileRow = {
      id: profile.id,
      full_name: profile.full_name ?? "Academic Student",
      email: profile.email ?? null,
      institution: profile.institution ?? null,
      role: profile.role ?? "student",
      created_at: profile.created_at ?? now,
      updated_at: now,
    };
    state.profiles.push(created);
    this.writeState(state);
    return created;
  }

  // --- Submissions ---
  public listSubmissions(userId?: string): SubmissionRow[] {
    const state = this.readState();
    const list = state.submissions.filter(
      (s) => !userId || s.user_id === userId || s.user_id === DEFAULT_USER_ID
    );
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public findSubmissionById(id: string): SubmissionRow | null {
    const state = this.readState();
    return state.submissions.find((s) => s.id === id) || null;
  }

  public createSubmission(
    insert: Omit<SubmissionRow, "id" | "created_at" | "updated_at" | "status" | "mime_type"> & {
      id?: string;
      status?: SubmissionRow["status"];
      mime_type?: string;
    }
  ): SubmissionRow {
    const state = this.readState();
    const now = new Date().toISOString();
    const created: SubmissionRow = {
      id: insert.id || crypto.randomUUID(),
      user_id: insert.user_id || DEFAULT_USER_ID,
      title: insert.title,
      original_filename: insert.original_filename,
      storage_path: insert.storage_path,
      mime_type: insert.mime_type || "application/pdf",
      file_size: insert.file_size,
      status: insert.status || "uploaded",
      created_at: now,
      updated_at: now,
      concepts_count: insert.concepts_count || 0,
      extracted_topics: insert.extracted_topics || [],
      extracted_concepts: insert.extracted_concepts || [],
      summary: insert.summary,
    };
    state.submissions.unshift(created);
    this.writeState(state);
    return created;
  }

  public updateSubmission(id: string, updates: Partial<SubmissionRow>): SubmissionRow | null {
    const state = this.readState();
    const idx = state.submissions.findIndex((s) => s.id === id);
    if (idx < 0) return null;
    state.submissions[idx] = {
      ...state.submissions[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.writeState(state);
    return state.submissions[idx];
  }

  // --- Vivas ---
  public findVivaById(id: string): VivaRow | null {
    const state = this.readState();
    return state.vivas.find((v) => v.id === id) || null;
  }

  public findVivaBySubmissionId(submissionId: string): VivaRow | null {
    const state = this.readState();
    const matches = state.vivas
      .filter((v) => v.submission_id === submissionId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return matches[0] || null;
  }

  public listVivas(userId?: string): VivaRow[] {
    const state = this.readState();
    return state.vivas
      .filter((v) => !userId || v.user_id === userId || v.user_id === DEFAULT_USER_ID)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createViva(insert: {
    id?: string;
    user_id: string;
    submission_id: string;
    status?: VivaRow["status"];
    started_at?: string | null;
    completed_at?: string | null;
  }): VivaRow {
    const state = this.readState();
    const now = new Date().toISOString();
    const created: VivaRow = {
      id: insert.id || crypto.randomUUID(),
      user_id: insert.user_id || DEFAULT_USER_ID,
      submission_id: insert.submission_id,
      status: insert.status || "in_progress",
      started_at: insert.started_at ?? now,
      completed_at: insert.completed_at ?? null,
      created_at: now,
    };
    state.vivas.unshift(created);
    const subIdx = state.submissions.findIndex((s) => s.id === insert.submission_id);
    if (subIdx >= 0) {
      state.submissions[subIdx].viva_session_id = created.id;
    }
    this.writeState(state);
    return created;
  }

  public updateViva(id: string, updates: Partial<VivaRow>): VivaRow | null {
    const state = this.readState();
    const idx = state.vivas.findIndex((v) => v.id === id);
    if (idx < 0) return null;
    state.vivas[idx] = {
      ...state.vivas[idx],
      ...updates,
    };
    this.writeState(state);
    return state.vivas[idx];
  }

  // --- Questions ---
  public createQuestions(
    inserts: Array<{
      id?: string;
      viva_id: string;
      concept: string;
      question_text: string;
      question_type?: "primary" | "follow_up";
      difficulty?: "easy" | "medium" | "hard";
      expected_concepts?: QuestionRow["expected_concepts"];
      sequence_number?: number;
      follow_up_reason?: string;
    }>
  ): QuestionRow[] {
    const state = this.readState();
    const now = new Date().toISOString();
    const created: QuestionRow[] = inserts.map((q, idx) => ({
      id: q.id || crypto.randomUUID(),
      viva_id: q.viva_id,
      concept: q.concept,
      question_text: q.question_text,
      question_type: q.question_type || "primary",
      difficulty: q.difficulty || "medium",
      expected_concepts: q.expected_concepts || [],
      sequence_number: q.sequence_number ?? idx + 1,
      follow_up_reason: q.follow_up_reason,
      created_at: now,
    }));
    state.questions.push(...created);
    this.writeState(state);
    return created;
  }

  public listQuestionsByVivaId(vivaId: string): QuestionRow[] {
    const state = this.readState();
    return state.questions
      .filter((q) => q.viva_id === vivaId)
      .sort((a, b) => a.sequence_number - b.sequence_number);
  }

  public findQuestionById(questionId: string, vivaId?: string): QuestionRow | null {
    const state = this.readState();
    return (
      state.questions.find(
        (q) => q.id === questionId && (!vivaId || q.viva_id === vivaId)
      ) || null
    );
  }

  // --- Responses ---
  public createResponse(insert: {
    id?: string;
    viva_id: string;
    question_id: string;
    audio_storage_path?: string | null;
    transcription?: string | null;
    duration_seconds?: number | null;
    status?: ResponseRow["status"];
  }): ResponseRow {
    const state = this.readState();
    const now = new Date().toISOString();
    const created: ResponseRow = {
      id: insert.id || crypto.randomUUID(),
      viva_id: insert.viva_id,
      question_id: insert.question_id,
      audio_storage_path: insert.audio_storage_path ?? null,
      transcription: insert.transcription ?? null,
      duration_seconds: insert.duration_seconds ?? null,
      status: insert.status || "uploaded",
      created_at: now,
    };
    state.responses.push(created);
    this.writeState(state);
    return created;
  }

  public updateResponse(id: string, updates: Partial<ResponseRow>): ResponseRow | null {
    const state = this.readState();
    const idx = state.responses.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    state.responses[idx] = {
      ...state.responses[idx],
      ...updates,
    };
    this.writeState(state);
    return state.responses[idx];
  }

  public listResponsesByVivaId(vivaId: string): ResponseRow[] {
    const state = this.readState();
    return state.responses
      .filter((r) => r.viva_id === vivaId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // --- Evaluations ---
  public createEvaluation(insert: {
    id?: string;
    response_id: string;
    correctness?: number;
    completeness?: number;
    reasoning_quality?: number;
    feedback?: string;
    demonstrated_concepts?: EvaluationRow["demonstrated_concepts"];
    missing_concepts?: EvaluationRow["missing_concepts"];
    confidence?: number;
  }): EvaluationRow {
    const state = this.readState();
    const now = new Date().toISOString();
    const created: EvaluationRow = {
      id: insert.id || crypto.randomUUID(),
      response_id: insert.response_id,
      correctness: insert.correctness ?? 75,
      completeness: insert.completeness ?? 75,
      reasoning_quality: insert.reasoning_quality ?? 75,
      feedback: insert.feedback ?? "Evaluation completed.",
      demonstrated_concepts: insert.demonstrated_concepts ?? [],
      missing_concepts: insert.missing_concepts ?? [],
      confidence: insert.confidence ?? 0.9,
      created_at: now,
    };
    state.evaluations.push(created);
    this.writeState(state);
    return created;
  }

  public findEvaluationByResponseId(responseId: string): EvaluationRow | null {
    const state = this.readState();
    return state.evaluations.find((e) => e.response_id === responseId) || null;
  }

  // --- Knowledge Gaps ---
  public createKnowledgeGaps(
    inserts: Array<{
      id?: string;
      user_id: string;
      viva_id: string;
      concept: string;
      severity?: "low" | "medium" | "high";
      explanation: string;
      recommendation: string;
    }>
  ): KnowledgeGapRow[] {
    if (!inserts.length) return [];
    const state = this.readState();
    const now = new Date().toISOString();
    const created: KnowledgeGapRow[] = inserts.map((g) => ({
      id: g.id || crypto.randomUUID(),
      user_id: g.user_id || DEFAULT_USER_ID,
      viva_id: g.viva_id,
      concept: g.concept,
      severity: g.severity || "medium",
      explanation: g.explanation,
      recommendation: g.recommendation,
      created_at: now,
    }));
    state.knowledge_gaps.push(...created);
    this.writeState(state);
    return created;
  }

  public listKnowledgeGapsByVivaId(vivaId: string): KnowledgeGapRow[] {
    const state = this.readState();
    return state.knowledge_gaps.filter((g) => g.viva_id === vivaId);
  }
}

export const localStore = new LocalStore();
