import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Misconception } from "../types/report.types";

export interface MisconceptionCardProps {
  misconceptions: Misconception[];
}

export function MisconceptionCard({ misconceptions }: MisconceptionCardProps) {
  const severityBadgeConfig = {
    critical: {
      variant: "danger" as const,
      label: "Critical Concept Gap",
    },
    moderate: {
      variant: "warning" as const,
      label: "Moderate Misconception",
    },
    minor: {
      variant: "default" as const,
      label: "Minor Inprecision",
    },
  };

  if (misconceptions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E8EAF0] p-6 shadow-card text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mx-auto text-lg">
          ✓
        </div>
        <h4 className="text-sm font-semibold text-[#171923]">No Misconceptions Detected</h4>
        <p className="text-xs text-[#697080]">
          The oral examination verified rigorous factual grounding across all tested concepts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8EAF0] p-6 shadow-card space-y-5">
      <div className="border-b border-[#E8EAF0] pb-3">
        <h3 className="text-base font-semibold text-[#171923]">
          Identified Conceptual Gaps & Remediation
        </h3>
        <p className="text-xs text-[#697080] mt-0.5">
          Specific areas where the student's verbal defense deviated from established academic literature.
        </p>
      </div>

      <div className="space-y-4">
        {misconceptions.map((item) => {
          const config = severityBadgeConfig[item.severity] || severityBadgeConfig.moderate;

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-[#E8EAF0] bg-white space-y-3 shadow-subtle"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[#171923]">
                  {item.concept}
                </h4>
                <Badge variant={config.variant} size="sm">
                  {config.label}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#FEF2F2]/50 border border-[#FECACA] space-y-1">
                  <span className="font-semibold text-[#991B1B] uppercase tracking-wider text-[10px]">
                    Candidate Verbal Claim
                  </span>
                  <p className="text-[#171923] italic">"{item.student_claim}"</p>
                </div>

                <div className="p-3 rounded-lg bg-[#F0FDF4]/50 border border-[#BBF7D0] space-y-1">
                  <span className="font-semibold text-[#166534] uppercase tracking-wider text-[10px]">
                    Expected Scientific Grounding
                  </span>
                  <p className="text-[#171923]">{item.expected_reasoning}</p>
                </div>
              </div>

              <div className="pt-2 text-xs flex items-start gap-2 bg-[#F7F8FA] p-3 rounded-lg border border-[#E8EAF0]">
                <span className="font-semibold text-[#4F46E5] shrink-0">Remediation:</span>
                <span className="text-[#171923]">{item.remediation_advice}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
