export const submissionSchema = {
  maxFileSizeBytes: 25 * 1024 * 1024, // 25MB
  allowedMimeTypes: ["application/pdf"],
};

export function validateTitle(title: string): string | null {
  if (!title || !title.trim()) {
    return "Document title is required.";
  }
  if (title.trim().length < 3) {
    return "Title must be at least 3 characters long.";
  }
  return null;
}

export function validatePdfFile(file: File | null): string | null {
  if (!file) {
    return "Please select a PDF document to upload.";
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF documents (.pdf) are supported for academic viva examination.";
  }
  if (file.size > submissionSchema.maxFileSizeBytes) {
    return "Document exceeds the maximum file size limit of 25MB.";
  }
  return null;
}
