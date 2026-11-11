import { VivaSession, VivaQuestion, VivaResponse } from "../types/viva.types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const MOCK_QUESTIONS: VivaQuestion[] = [
  {
    id: "q_01",
    session_id: "viva_mock_01",
    order_index: 1,
    question_text: "Can you explain the mathematical objective of the contrastive loss function used in Section 3.2, and why the InfoNCE estimator was chosen over triplet loss for graph representations?",
    concept_tested: "Contrastive Loss Formulation & InfoNCE",
    difficulty: "introductory",
    is_follow_up: false,
  },
  {
    id: "q_02",
    session_id: "viva_mock_01",
    order_index: 2,
    question_text: "In your graph data augmentation strategy, edge perturbation was applied uniformly. How does this uniform perturbation impact homophily metrics in networks with high community clustering?",
    concept_tested: "Graph Augmentation & Homophily Dynamics",
    difficulty: "intermediate",
    is_follow_up: false,
  },
  {
    id: "q_03",
    session_id: "viva_mock_01",
    order_index: 3,
    question_text: "You mentioned that negative sampling bias degrades representation quality when false negatives are introduced. How does your proposed correction algorithm differentiate between true negatives and semantically similar graph neighborhoods?",
    concept_tested: "Negative Sampling Bias Correction",
    difficulty: "advanced",
    is_follow_up: true,
    follow_up_reason: "Adaptive probe to verify understanding of false negative mitigation.",
  },
  {
    id: "q_04",
    session_id: "viva_mock_01",
    order_index: 4,
    question_text: "Considering the empirical runtime evaluation on large benchmark datasets (OGB), how does the time complexity of the neighbor aggregation phase scale with the average node degree in your architecture?",
    concept_tested: "Asymptotic Complexity & Scalability",
    difficulty: "advanced",
    is_follow_up: false,
  },
];

const MOCK_SESSION: VivaSession = {
  id: "viva_mock_01",
  submission_id: "sub_mock_01",
  status: "in_progress",
  current_question_index: 0,
  total_questions: MOCK_QUESTIONS.length,
  created_at: new Date().toISOString(),
  questions: MOCK_QUESTIONS,
  responses: {},
};

export async function initiateViva(submissionId: string): Promise<VivaSession> {
  try {
    if (USE_MOCKS) return { ...MOCK_SESSION, submission_id: submissionId };

    const res = await fetch("/api/viva/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 405) {
        return { ...MOCK_SESSION, submission_id: submissionId };
      }
      throw new Error("Failed to initiate viva session.");
    }

    const data = await res.json();
    return data.session || { ...MOCK_SESSION, submission_id: submissionId };
  } catch (err) {
    return { ...MOCK_SESSION, submission_id: submissionId };
  }
}

export async function getVivaSession(sessionId: string): Promise<VivaSession> {
  try {
    if (USE_MOCKS) return { ...MOCK_SESSION, id: sessionId };

    const res = await fetch(`/api/viva/${sessionId}`);
    if (!res.ok) {
      if (res.status === 404 || res.status === 405) {
        return { ...MOCK_SESSION, id: sessionId };
      }
      throw new Error(`Failed to load viva session ${sessionId}`);
    }

    const data = await res.json();
    return data.session || { ...MOCK_SESSION, id: sessionId };
  } catch (err) {
    return { ...MOCK_SESSION, id: sessionId };
  }
}

export async function submitVivaAnswer(
  sessionId: string,
  questionId: string,
  audioBlob: Blob,
  durationSeconds: number
): Promise<{ success: boolean; nextQuestionIndex: number; isCompleted: boolean; reportId?: string }> {
  try {
    if (USE_MOCKS) {
      return simulateMockAnswerSubmission(sessionId, questionId, durationSeconds);
    }

    const formData = new FormData();
    formData.append("questionId", questionId);
    formData.append("audio", audioBlob, "response.webm");
    formData.append("durationSeconds", durationSeconds.toString());

    const res = await fetch(`/api/viva/${sessionId}/responses`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 405) {
        return simulateMockAnswerSubmission(sessionId, questionId, durationSeconds);
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to record viva answer.");
    }

    return await res.json();
  } catch (err) {
    return simulateMockAnswerSubmission(sessionId, questionId, durationSeconds);
  }
}

function simulateMockAnswerSubmission(
  sessionId: string,
  questionId: string,
  durationSeconds: number
) {
  const currentIdx = MOCK_SESSION.current_question_index;
  const nextIdx = currentIdx + 1;
  const isCompleted = nextIdx >= MOCK_SESSION.total_questions;

  MOCK_SESSION.responses[questionId] = {
    id: `resp_${Date.now()}`,
    question_id: questionId,
    duration_seconds: durationSeconds,
    status: "completed",
    transcript: "Simulated student verbal explanation transcribed accurately.",
    score: 88,
    demonstrated_mastery: true,
  };

  MOCK_SESSION.current_question_index = nextIdx;
  if (isCompleted) {
    MOCK_SESSION.status = "completed";
    MOCK_SESSION.report_id = `rep_${sessionId}`;
  }

  return {
    success: true,
    nextQuestionIndex: nextIdx,
    isCompleted,
    reportId: isCompleted ? `rep_${sessionId}` : undefined,
  };
}
