"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EvaluationStage } from "../types/viva.types";

export interface VoiceRecorderProps {
  isRecording: boolean;
  recordingSeconds: number;
  audioUrl: string | null;
  evaluationStage: EvaluationStage;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onResetRecording: () => void;
  onSubmitAnswer: () => void;
  onClearError?: () => void;
}

export function VoiceRecorder({
  isRecording,
  recordingSeconds,
  audioUrl,
  evaluationStage,
  error,
  onStartRecording,
  onStopRecording,
  onResetRecording,
  onSubmitAnswer,
  onClearError,
}: VoiceRecorderProps) {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isProcessing =
    evaluationStage === "submitting" ||
    evaluationStage === "transcribing" ||
    evaluationStage === "evaluating";

  const stageDescriptions = {
    submitting: "Uploading encrypted audio response to secure pipeline...",
    transcribing: "AI transcribing spoken answer (Whisper / Speech-to-Text)...",
    evaluating: "Comparing response against extracted paper claims and evaluating conceptual mastery...",
    completed: "Answer evaluated! Transitioning...",
    idle: "",
    recording: "Oral capture active. Speak clearly into your microphone.",
  };

  return (
    <div className="w-full bg-white rounded-xl border border-[#E8EAF0] p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-[#E8EAF0] pb-4">
        <div>
          <h4 className="text-sm font-semibold text-[#171923]">
            Oral Response Recorder
          </h4>
          <p className="text-xs text-[#697080]">
            Speak naturally and substantiate your answer with evidence from your submitted work.
          </p>
        </div>

        {/* Live Timer or Status */}
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
              Recording {formatTimer(recordingSeconds)}
            </span>
          )}
          {!isRecording && audioUrl && (
            <span className="px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-medium">
              Audio Captured ({formatTimer(recordingSeconds)})
            </span>
          )}
          {!isRecording && !audioUrl && (
            <span className="text-xs text-[#697080]">Max 3:00 min</span>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="error" onDismiss={onClearError}>
          {error}
        </Alert>
      )}

      {/* Recording Visual / Waveform Area */}
      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-[#F7F8FA] border border-[#E8EAF0] text-center min-h-[160px]">
        {isRecording ? (
          <div className="space-y-4">
            {/* Animated Audio Waveform Mock */}
            <div className="flex items-center justify-center gap-1.5 h-12">
              {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 65].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#4F46E5] rounded-full animate-pulse transition-all duration-150"
                  style={{
                    height: `${Math.max(20, (height * (recordingSeconds % 3 + 1)) / 3)}%`,
                    animationDelay: `${i * 75}ms`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-[#171923]">
              Microphone is listening... {formatTimer(recordingSeconds)}
            </p>
          </div>
        ) : audioUrl ? (
          <div className="w-full max-w-md space-y-3">
            <p className="text-xs font-medium text-[#171923]">
              Listen to your recorded oral response:
            </p>
            <audio src={audioUrl} controls className="w-full h-10 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E8EAF0] text-[#4F46E5] flex items-center justify-center mx-auto shadow-subtle">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <p className="text-xs text-[#697080]">
              Press <span className="font-semibold text-[#171923]">Record Answer</span> when you are ready to speak.
            </p>
          </div>
        )}
      </div>

      {/* Pipeline Processing State Indicator */}
      {isProcessing && (
        <div className="p-4 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center gap-3">
          <svg
            className="animate-spin w-5 h-5 text-[#4F46E5] shrink-0"
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
          <div className="text-xs">
            <span className="font-semibold text-[#4F46E5] capitalize">
              {evaluationStage}:{" "}
            </span>
            <span className="text-[#171923]">
              {stageDescriptions[evaluationStage]}
            </span>
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          {audioUrl && !isProcessing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetRecording}
            >
              Re-record Answer
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isRecording ? (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={onStopRecording}
              leftIcon={<span className="w-2.5 h-2.5 rounded-sm bg-white" />}
            >
              Stop Recording
            </Button>
          ) : !audioUrl ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onStartRecording}
              disabled={isProcessing}
              leftIcon={<span className="w-2.5 h-2.5 rounded-full bg-white" />}
            >
              Record Answer
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onSubmitAnswer}
              isLoading={isProcessing}
              disabled={isProcessing}
            >
              Submit Response
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
