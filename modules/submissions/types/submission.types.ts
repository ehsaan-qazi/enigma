export type SubmissionStatus = "uploaded" | "processing" | "ready" | "failed";

export interface Submission {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}
