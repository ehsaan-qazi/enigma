import React from "react";

export interface VivaProgressBarProps {
  currentQuestionIndex: number; // 1-based
  totalQuestions: number;
}

export function VivaProgressBar({
  currentQuestionIndex,
  totalQuestions,
}: VivaProgressBarProps) {
  const steps = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  return (
    <div className="w-full bg-white rounded-xl border border-[#E8EAF0] p-4 shadow-subtle flex items-center justify-between gap-2 overflow-x-auto">
      {steps.map((step) => {
        const isCompleted = step < currentQuestionIndex;
        const isCurrent = step === currentQuestionIndex;

        return (
          <div key={step} className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                isCompleted
                  ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]"
                  : isCurrent
                  ? "bg-[#4F46E5] text-white shadow-subtle ring-2 ring-[#4F46E5]/20 ring-offset-1"
                  : "bg-[#F7F8FA] text-[#697080] border border-[#E8EAF0]"
              }`}
            >
              {isCompleted ? "✓" : step}
            </div>

            <div className="hidden sm:block flex-1">
              <div className="text-[11px] font-medium leading-none text-[#171923]">
                Part {step}
              </div>
              <div className="text-[10px] text-[#697080] capitalize">
                {isCompleted ? "Completed" : isCurrent ? "Active Probe" : "Pending"}
              </div>
            </div>

            {step < totalQuestions && (
              <div
                className={`hidden md:block h-0.5 w-6 rounded-full ${
                  isCompleted ? "bg-[#16A34A]" : "bg-[#E8EAF0]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
