"use client";

import { useState, useEffect, useCallback } from "react";
import { Submission } from "../types/submission.types";
import {
  getSubmissions,
  getSubmission,
  uploadPdfSubmission,
} from "../services/submissions-api";
import { validateTitle, validatePdfFile } from "../schemas/submission.schema";

export function useSubmissions(submissionId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<string>("");

  const refreshSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load academic submissions.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCurrentSubmission = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSubmission(id);
      setCurrentSubmission(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load submission details.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        if (submissionId) {
          const data = await getSubmission(submissionId);
          if (!ignore) setCurrentSubmission(data);
        } else {
          const data = await getSubmissions();
          if (!ignore) setSubmissions(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Failed to load submission.";
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
  }, [submissionId]);

  const upload = async (
    file: File | null,
    title: string,
    documentContent?: string
  ): Promise<Submission | null> => {
    setError(null);

    const titleErr = validateTitle(title);
    if (titleErr) {
      setError(titleErr);
      return null;
    }

    const fileErr = validatePdfFile(file);
    if (fileErr || !file) {
      setError(fileErr || "Please select a valid PDF file.");
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage("Starting upload...");

    try {
      const result = await uploadPdfSubmission(
        file,
        title,
        (progress, stage) => {
          setUploadProgress(progress);
          setUploadStage(stage);
        },
        documentContent
      );
      await refreshSubmissions();
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submissions,
    currentSubmission,
    isLoading,
    error,
    clearError: () => setError(null),
    refreshSubmissions,
    refreshCurrentSubmission,
    upload,
    isUploading,
    uploadProgress,
    uploadStage,
  };
}
