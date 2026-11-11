import { AssessmentReport } from "../types/report.types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const MOCK_REPORTS: AssessmentReport[] = [
  {
    id: "rep_viva_mock_01",
    submission_id: "sub_mock_01",
    submission_title: "Self-Supervised Contrastive Representation Learning in Graph Neural Networks",
    viva_session_id: "viva_mock_01",
    student_name: "Ahmed Al-Mansoor",
    overall_score: 87,
    mastery_tier: "Distinction",
    summary_narrative:
      "The candidate demonstrated comprehensive theoretical and empirical command over self-supervised contrastive learning in graph representations. Spoken answers clearly articulated the mathematical derivations of InfoNCE and community clustering preservation. A minor misconception was observed regarding negative sampling distribution across asymmetric topologies, which can be resolved via hard-negative reweighting.",
    demonstrated_concepts: [
      {
        name: "InfoNCE Loss Formulation & Jensen-Shannon Bound",
        score: 94,
        evidence: "Accurately derived mutual information maximization lower bound and defended temperature parameter selection.",
      },
      {
        name: "Graph Augmentation & Edge Perturbation",
        score: 88,
        evidence: "Spoke clearly about edge drop probability constraints to prevent semantic drift in homophilic communities.",
      },
      {
        name: "Neighbor Aggregation Time Complexity",
        score: 82,
        evidence: "Correctly identified sparse matrix multiplication bottlenecks under power-law degree distributions.",
      },
    ],
    misconceptions: [
      {
        id: "misc_01",
        concept: "Negative Sampling in Asymmetric Graph Topologies",
        severity: "moderate",
        student_claim: "Candidate claimed uniform random sampling of non-adjacent node pairs is asymptotically unbiased for disassortative graphs.",
        expected_reasoning: "Disassortative graphs link structurally dissimilar nodes, causing uniform negative sampling to frequently treat valid functional counterparts as false negatives.",
        remediation_advice: "Review Khosla et al. and implement degree-stratified negative sampling to preserve topological semantics.",
      },
    ],
    recommended_actions: [
      "Incorporate adaptive edge perturbation probabilities proportional to node centralities.",
      "Evaluate hard negative mining strategies on dense social network graphs.",
      "Formally prove the invariance of the representation space under bounded subgraph perturbations.",
    ],
    created_at: new Date().toISOString(),
  },
];

export async function getReport(id: string): Promise<AssessmentReport> {
  try {
    if (USE_MOCKS) {
      return (
        MOCK_REPORTS.find((r) => r.id === id || r.viva_session_id === id) || {
          ...MOCK_REPORTS[0],
          id,
        }
      );
    }

    const res = await fetch(`/api/reports/${id}`, { cache: "no-store" });
    if (!res.ok) {
      return (
        MOCK_REPORTS.find((r) => r.id === id || r.viva_session_id === id) || {
          ...MOCK_REPORTS[0],
          id,
        }
      );
    }

    const json = await res.json();
    const payload = json.data || json;
    return payload.report || payload;
  } catch {
    return (
      MOCK_REPORTS.find((r) => r.id === id || r.viva_session_id === id) || {
        ...MOCK_REPORTS[0],
        id,
      }
    );
  }
}

export async function getReports(): Promise<AssessmentReport[]> {
  try {
    if (USE_MOCKS) return MOCK_REPORTS;

    const res = await fetch("/api/reports", { cache: "no-store" });
    if (!res.ok) {
      return MOCK_REPORTS;
    }
    const json = await res.json();
    const payload = json.data || json;
    return payload.reports || (Array.isArray(payload) ? payload : MOCK_REPORTS);
  } catch {
    return MOCK_REPORTS;
  }
}
