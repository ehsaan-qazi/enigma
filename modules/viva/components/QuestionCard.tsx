import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { VivaQuestion } from "../types/viva.types";

export interface QuestionCardProps {
  question: VivaQuestion;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const difficultyVariants = {
    introductory: "primary" as const,
    intermediate: "warning" as const,
    advanced: "danger" as const,
  };

  return (
    <Card className="shadow-card border-[#E8EAF0] overflow-hidden">
      <div className="h-1.5 bg-[#4F46E5] w-full" />
      <CardHeader className="pb-3 flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
            Question {questionNumber} of {totalQuestions}
          </span>
          <Badge
            variant={difficultyVariants[question.difficulty]}
            size="sm"
            className="capitalize"
          >
            {question.difficulty}
          </Badge>
          {question.is_follow_up && (
            <Badge variant="primary" size="sm">
              Adaptive Follow-Up
            </Badge>
          )}
        </div>

        <div className="text-xs text-[#697080]">
          Concept: <span className="font-semibold text-[#171923]">{question.concept_tested}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <h3 className="text-lg sm:text-xl font-semibold text-[#171923] leading-relaxed">
          {question.question_text}
        </h3>

        {question.is_follow_up && question.follow_up_reason && (
          <div className="mt-4 p-3 rounded-lg bg-[#F7F8FA] border border-[#E8EAF0] text-xs text-[#697080]">
            <span className="font-semibold text-[#171923]">Context: </span>
            {question.follow_up_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
