import React from "react";
import { Progress } from "@/components/ui/Progress";

export interface UploadProgressProps {
  progress: number;
  stage: string;
}

export function UploadProgress({ progress, stage }: UploadProgressProps) {
  const isComplete = progress >= 100;

  return (
    <div className="w-full p-4 rounded-xl border border-[#E8EAF0] bg-white shadow-subtle space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="w-5 h-5 rounded-full bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold text-xs">
              ✓
            </span>
          ) : (
            <svg
              className="animate-spin w-4 h-4 text-[#4F46E5]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          <span className="font-medium text-[#171923]">{stage}</span>
        </div>
        <span className="font-semibold text-[#4F46E5]">{progress}%</span>
      </div>

      <Progress
        value={progress}
        color={isComplete ? "success" : "primary"}
        size="md"
      />
    </div>
  );
}
