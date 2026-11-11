import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { localStore, SubmissionRow } from "@/lib/supabase/local-store";

export type Submission = SubmissionRow;

export class SubmissionRepository {
  async findByIdAndUserId(id: string, userId: string): Promise<Submission | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        const local = localStore.findSubmissionById(id);
        return {
          ...data,
          concepts_count: local?.concepts_count,
          extracted_topics: local?.extracted_topics,
          extracted_concepts: local?.extracted_concepts,
          summary: local?.summary,
          viva_session_id: local?.viva_session_id,
        };
      }
    } catch {
      // Fallback to local store
    }
    return localStore.findSubmissionById(id);
  }

  async listByUserId(userId: string): Promise<Submission[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((row) => {
          const local = localStore.findSubmissionById(row.id);
          return {
            ...row,
            concepts_count: local?.concepts_count,
            extracted_topics: local?.extracted_topics,
            extracted_concepts: local?.extracted_concepts,
            summary: local?.summary,
            viva_session_id: local?.viva_session_id,
          };
        });
      }
    } catch {
      // Fallback to local store
    }
    return localStore.listSubmissions(userId);
  }

  async create(submission: TablesInsert<"submissions">): Promise<Submission> {
    const localRecord = localStore.createSubmission({
      id: submission.id,
      user_id: submission.user_id,
      title: submission.title,
      original_filename: submission.original_filename,
      storage_path: submission.storage_path,
      mime_type: submission.mime_type || "application/pdf",
      file_size: submission.file_size,
      status: submission.status || "uploaded",
    });

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("submissions")
        .insert({ ...submission, id: localRecord.id })
        .select()
        .single();

      if (!error && data) {
        return { ...localRecord, ...data };
      }
    } catch {
      // Use localRecord
    }
    return localRecord;
  }

  async updateStatus(
    id: string,
    status: Tables<"submissions">["status"],
    useAdmin = false,
    extra?: Partial<SubmissionRow>
  ): Promise<Submission> {
    const updatedLocal = localStore.updateSubmission(id, { status, ...extra });

    try {
      const client = useAdmin ? createAdminClient() : await createClient();
      const { data, error } = await client
        .from("submissions")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        return { ...updatedLocal, ...data };
      }
    } catch {
      // Use updatedLocal
    }

    if (!updatedLocal) {
      throw new Error(`Submission ${id} not found`);
    }
    return updatedLocal;
  }

  async update(
    id: string,
    updates: TablesUpdate<"submissions"> & Partial<SubmissionRow>,
    useAdmin = false
  ): Promise<Submission> {
    const updatedLocal = localStore.updateSubmission(id, updates);

    try {
      const client = useAdmin ? createAdminClient() : await createClient();
      const { data, error } = await client
        .from("submissions")
        .update({
          status: updates.status,
          title: updates.title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        return { ...updatedLocal, ...data };
      }
    } catch {
      // Use updatedLocal
    }

    if (!updatedLocal) {
      throw new Error(`Submission ${id} not found`);
    }
    return updatedLocal;
  }
}

export const submissionRepository = new SubmissionRepository();
