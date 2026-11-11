import React from "react";
import { Progress } from "@/components/ui/Progress";
import { ConceptMastery } from "../types/report.types";

export interface ConceptMasteryBarProps {
  concepts: ConceptMastery[];
}

export function ConceptMasteryBar({ concepts }: ConceptMasteryBarProps) {
  const getColor = (score: number) => {
    if (score >= 85) return "success" as const;
    if (score >= 70) return "primary" as const;
    if (score >= 55) return "warning" as const;
    return "danger" as const;
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8EAF0] p-6 shadow-card space-y-5">
      <div className="border-b border-[#E8EAF0] pb-3">
        <h3 className="text-base font-semibold text-[#171923]">
          Demonstrated Concept Mastery
        </h3>
        <p className="text-xs text-[#697080] mt-0.5">
          Detailed breakdown of candidate performance across core theoretical pillars extracted from the paper.
        </p>
      </div>

      <div className="space-y-6">
        {concepts.map((concept, idx) => (
          <div key={idx} className="space-y-2 p-3 rounded-lg bg-[#F7F8FA]/60 border border-[#E8EAF0]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-[#171923]">
                {concept.name}
              </span>
              <span className="font-bold text-[#4F46E5]">
                {concept.score}%
              </span>
            </div>

            <Progress
              value={concept.score}
              color={getColor(concept.score)}
              size="sm"
            />

            <div className="pt-1 text-[11px] text-[#697080] flex items-start gap-1.5">
              <span className="font-semibold text-[#171923] shrink-0">Evidence Excerpt:</span>
              <span className="italic">"{concept.evidence}"</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
