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
  const [isLoading, setIsLoading] = useState(false);
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
    } catch (err: any) {
      setError(err.message || "Failed to load academic submissions.");
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
    } catch (err: any) {
      setError(err.message || "Failed to load submission details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (submissionId) {
      refreshCurrentSubmission(submissionId);
    } else {
      refreshSubmissions();
    }
  }, [submissionId, refreshSubmissions, refreshCurrentSubmission]);

  const upload = async (file: File | null, title: string): Promise<Submission | null> => {
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
      const result = await uploadPdfSubmission(file, title, (progress, stage) => {
        setUploadProgress(progress);
        setUploadStage(stage);
      });
      await refreshSubmissions();
      return result;
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
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
