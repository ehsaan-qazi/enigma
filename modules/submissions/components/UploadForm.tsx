"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { UploadProgress } from "./UploadProgress";
import { useSubmissions } from "../hooks/useSubmissions";
import { Submission } from "../types/submission.types";

export interface UploadFormProps {
  onSuccess?: (submission: Submission) => void;
  onCancel?: () => void;
}

export function UploadForm({ onSuccess, onCancel }: UploadFormProps) {
  const { upload, isUploading, uploadProgress, uploadStage, error, clearError } = useSubmissions();
  const [title, setTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        // Auto-populate title cleanly from filename
        const cleanName = file.name
          .replace(/\.pdf$/i, "")
          .replace(/[-_]/g, " ")
          .trim();
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name
          .replace(/\.pdf$/i, "")
          .replace(/[-_]/g, " ")
          .trim();
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await upload(selectedFile, title, customContent);
    if (result) {
      setTitle("");
      setCustomContent("");
      setSelectedFile(null);
      onSuccess?.(result);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Card className="w-full max-w-2xl shadow-card">
      <CardHeader>
        <CardTitle>Submit Academic Work for Viva Examination</CardTitle>
        <CardDescription>
          Upload your dissertation, thesis, or research paper in PDF format. The document will be analyzed by the AI pipeline to extract core concepts, methodologies, and candidate viva questions.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="error" onDismiss={clearError}>
              {error}
            </Alert>
          )}

          <Input
            label="Document Title"
            placeholder="e.g. Distributed Byzantine Consensus in High-Latency Networks"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            required
          />

          {/* Drag & Drop Area */}
          <div>
            <label className="block text-xs font-semibold text-[#171923] mb-1.5 uppercase tracking-wider">
              Academic PDF Document (Max 25MB)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center ${
                isDragOver
                  ? "border-[#4F46E5] bg-[#EEF2FF]/40"
                  : selectedFile
                  ? "border-[#BBF7D0] bg-[#F0FDF4]/30"
                  : "border-[#E8EAF0] hover:border-[#4F46E5]/50 bg-white"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-xl font-bold">
                    PDF
                  </div>
                  <span className="font-semibold text-sm text-[#171923] max-w-md truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-[#697080]">
                    {formatFileSize(selectedFile.size)} · Click or drop to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-[#F7F8FA] text-[#697080] flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#4F46E5] hover:underline">
                      Click to upload
                    </span>{" "}
                    <span className="text-sm text-[#697080]">or drag and drop</span>
                  </div>
                  <p className="text-xs text-[#697080]">
                    PDF files only, up to 25MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Optional Direct Assignment Tasks / Questions & Solutions Text Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#171923] uppercase tracking-wider">
                Assignment Questions & Code / Solutions <span className="font-normal text-[#697080]">(Optional)</span>
              </label>
              <span className="text-[11px] text-[#4F46E5] font-medium">Recommended for scanned or CamScanner pages</span>
            </div>
            <textarea
              rows={4}
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              disabled={isUploading}
              placeholder="Paste your specific assignment questions, code snippets, or solutions here so the viva examiner questions you directly on your exact work (e.g. Question 1: Assembly loop using SI/DI, Question 2: MVC controller routing...)"
              className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3.5 py-2.5 text-xs text-[#171923] placeholder:text-[#697080]/70 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 disabled:opacity-60"
            />
            <p className="text-[11px] text-[#697080] mt-1">
              If your PDF is an image scan from your phone (e.g. CamScanner), pasting your questions or code ensures the AI asks you directly about your actual problems instead of generic topics.
            </p>
          </div>

          {isUploading && (
            <UploadProgress progress={uploadProgress} stage={uploadStage} />
          )}
        </CardContent>

        <CardFooter className="justify-between">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
          ) : <div />}

          <Button
            type="submit"
            variant="primary"
            isLoading={isUploading}
            disabled={!selectedFile || !title.trim()}
          >
            Submit for Concept Analysis
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
