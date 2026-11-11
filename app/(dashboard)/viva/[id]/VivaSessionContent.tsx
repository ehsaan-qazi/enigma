"use client";

import React, { use } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useVivaSession } from "@/modules/viva/hooks/useVivaSession";
import { QuestionCard } from "@/modules/viva/components/QuestionCard";
import { VoiceRecorder } from "@/modules/viva/components/VoiceRecorder";
import { VivaProgressBar } from "@/modules/viva/components/VivaProgressBar";

export function VivaSessionContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    session,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isLoading,
    error,
    clearError,
    isRecording,
    recordingSeconds,
    audioUrl,
    transcription,
    isTranscribing,
    evaluationStage,
    startRecording,
    stopRecording,
    resetRecording,
    submitAnswer,
  } = useVivaSession(id);

  if (isLoading || !session || !currentQuestion) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-16" />
        <Skeleton variant="rectangular" className="h-44" />
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/viva"
          className="inline-flex items-center gap-1.5 text-xs text-[#697080] hover:text-[#171923] font-medium transition-colors"
        >
          ← Leave Examination Room
        </Link>
        <span className="text-xs text-[#697080]">
          Session ID: <code className="font-mono text-[#171923]">{session.id}</code>
        </span>
      </div>

      {/* Progress tracker */}
      <VivaProgressBar
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
      />

      {/* Current Question */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex}
        totalQuestions={totalQuestions}
      />

      {/* Voice Recorder */}
      <VoiceRecorder
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        audioUrl={audioUrl}
        transcription={transcription}
        isTranscribing={isTranscribing}
        evaluationStage={evaluationStage}
        error={error}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onResetRecording={resetRecording}
        onSubmitAnswer={submitAnswer}
        onClearError={clearError}
      />
    </div>
  );
}
