export type MasteryTier = "High Distinction" | "Distinction" | "Merit" | "Pass" | "Developing";

export type SeverityLevel = "critical" | "moderate" | "minor";

export interface ConceptMastery {
  name: string;
  score: number; // 0 - 100
  evidence: string;
}

export interface Misconception {
  id: string;
  concept: string;
  severity: SeverityLevel;
  student_claim: string;
  expected_reasoning: string;
  remediation_advice: string;
}

export interface QuestionResponseItem {
  question_id: string;
  concept: string;
  question_text: string;
  transcription: string;
  sequence_number?: number;
  correctness?: number;
  completeness?: number;
  reasoning_quality?: number;
  feedback?: string;
  duration_seconds?: number;
}

export interface AssessmentReport {
  id: string;
  submission_id: string;
  submission_title: string;
  viva_session_id: string;
  student_name: string;
  overall_score: number;
  mastery_tier: MasteryTier;
  summary_narrative: string;
  demonstrated_concepts: ConceptMastery[];
  misconceptions: Misconception[];
  recommended_actions: string[];
  questions_and_transcriptions?: QuestionResponseItem[];
  created_at: string;
}
