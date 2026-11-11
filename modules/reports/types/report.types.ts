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
  created_at: string;
}
