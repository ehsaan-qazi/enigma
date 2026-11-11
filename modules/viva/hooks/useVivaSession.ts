"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { VivaSession, VivaQuestion, EvaluationStage } from "../types/viva.types";
import { getVivaSession, submitVivaAnswer, initiateViva } from "../services/viva-api";
import { validateRecordingDuration } from "../schemas/viva.schema";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}

export function useVivaSession(sessionId?: string, submissionId?: string) {
  const router = useRouter();
  const [session, setSession] = useState<VivaSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Recording & Transcript State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Evaluation processing state transitions
  const [evaluationStage, setEvaluationStage] = useState<EvaluationStage>("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechTranscriptRef = useRef<string>("");

  const fetchSessionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (sessionId) {
        const data = await getVivaSession(sessionId);
        setSession(data);
      } else if (submissionId) {
        const data = await initiateViva(submissionId);
        setSession(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initialize viva session.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, submissionId]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        if (sessionId) {
          const data = await getVivaSession(sessionId);
          if (!ignore) setSession(data);
        } else if (submissionId) {
          const data = await initiateViva(submissionId);
          if (!ignore) setSession(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Failed to initialize viva session.";
          setError(message);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [sessionId, submissionId]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [audioUrl]);

  // Start Voice Recording
  const startRecording = async () => {
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordedAudioBlob(null);
    setTranscription("");
    speechTranscriptRef.current = "";
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : undefined,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());

        // If Web Speech API captured speech, it will already be in speechTranscriptRef
        const existingTranscript = speechTranscriptRef.current.trim();
        if (existingTranscript) {
          setTranscription(existingTranscript);
        } else {
          // Asynchronous transcription fallback via Whisper API
          setIsTranscribing(true);
          try {
            const formData = new FormData();
            formData.append("audio", blob, "response.webm");
            const res = await fetch("/api/viva/transcribe", {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.transcription && data.transcription.trim()) {
                setTranscription(data.transcription.trim());
              }
            }
          } catch {
            // Non-blocking fallback
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      // Initialize Web Speech API for real-time transcription while speaking
      const SpeechRecognitionClass =
        typeof window !== "undefined"
          ? (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
            (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition
          : null;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalStr = "";
            let interimStr = "";
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalStr += event.results[i][0].transcript + " ";
              } else {
                interimStr += event.results[i][0].transcript;
              }
            }
            const fullTranscript = (finalStr + interimStr).trim();
            if (fullTranscript) {
              speechTranscriptRef.current = fullTranscript;
              setTranscription(fullTranscript);
            }
          };

          recognition.onerror = () => {
            // Audio recording continues uninterrupted
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // Fallback to server Whisper STT on stop
        }
      }

      mediaRecorder.start(250);
      setIsRecording(true);
      setEvaluationStage("recording");

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setError(
        "Microphone access unavailable. Please grant microphone permissions in your browser to record your oral viva."
      );
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setEvaluationStage("idle");

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Reset / Re-record answer
  const resetRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordedAudioBlob(null);
    setRecordingSeconds(0);
    setTranscription("");
    speechTranscriptRef.current = "";
    setIsTranscribing(false);
    setEvaluationStage("idle");
    setError(null);
  };

  // Submit Answer & Step Pipeline
  const submitAnswer = async () => {
    if (!session) return;

    if (!recordedAudioBlob) {
      setError("Please record your oral response before submitting.");
      return;
    }

    const effectiveDuration = Math.max(2, recordingSeconds);
    const durErr = validateRecordingDuration(effectiveDuration);
    if (durErr) {
      setError(durErr);
      return;
    }

    const currentQuestion = session.questions[session.current_question_index];
    if (!currentQuestion) return;

    setError(null);

    try {
      setEvaluationStage("submitting");
      const t1 = setTimeout(() => setEvaluationStage("transcribing"), 400);
      const t2 = setTimeout(() => setEvaluationStage("evaluating"), 900);

      const result = await submitVivaAnswer(
        session.id,
        currentQuestion.id,
        recordedAudioBlob,
        effectiveDuration,
        transcription.trim() || undefined
      );

      clearTimeout(t1);
      clearTimeout(t2);
      setEvaluationStage("evaluating");
      await new Promise((r) => setTimeout(r, 500));

      if (result.isCompleted) {
        setEvaluationStage("completed");
        const reportId = result.reportId || session.id;
        router.push(`/reports/${reportId}`);
      } else {
        resetRecording();
        if (result.session) {
          setSession(result.session);
        } else {
          await fetchSessionData();
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit oral response.";
      setError(message);
      setEvaluationStage("idle");
    }
  };

  const currentQuestion: VivaQuestion | undefined =
    session?.questions[session.current_question_index];

  return {
    session,
    currentQuestion,
    currentQuestionIndex: session ? session.current_question_index + 1 : 1,
    totalQuestions: session?.total_questions || 4,
    isLoading,
    error,
    clearError: () => setError(null),

    // Audio & Transcription State
    isRecording,
    recordingSeconds,
    recordedAudioBlob,
    audioUrl,
    transcription,
    isTranscribing,
    evaluationStage,

    // Actions
    startRecording,
    stopRecording,
    resetRecording,
    submitAnswer,
  };
}
