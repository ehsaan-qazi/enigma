export type VivaDifficulty = "introductory" | "intermediate" | "advanced";

export type VivaSessionStatus = "pending" | "in_progress" | "completed" | "failed";

export type EvaluationStage = "idle" | "recording" | "submitting" | "transcribing" | "evaluating" | "completed";

export interface VivaQuestion {
  id: string;
  session_id: string;
  order_index: number;
  question_text: string;
  concept_tested: string;
  difficulty: VivaDifficulty;
  is_follow_up: boolean;
  follow_up_reason?: string;
  parent_question_id?: string;
}

export interface VivaResponse {
  id: string;
  question_id: string;
  audio_url?: string;
  duration_seconds: number;
  transcript?: string;
  status: "uploaded" | "transcribing" | "evaluating" | "completed";
  score?: number; // 0 - 100
  feedback?: string;
  demonstrated_mastery?: boolean;
}

export interface VivaSession {
  id: string;
  submission_id: string;
  status: VivaSessionStatus;
  current_question_index: number;
  total_questions: number;
  created_at: string;
  completed_at?: string;
  report_id?: string;
  questions: VivaQuestion[];
  responses: Record<string, VivaResponse>;
}
