import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

export type Submission = Tables<"submissions">;

export class SubmissionRepository {
  async findByIdAndUserId(id: string, userId: string): Promise<Submission | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }
    return data;
  }

  async listByUserId(userId: string): Promise<Submission[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list submissions: ${error.message}`);
    }
    return data || [];
  }

  async create(submission: TablesInsert<"submissions">): Promise<Submission> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("submissions")
      .insert(submission)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create submission: ${error.message}`);
    }
    return data;
  }

  async updateStatus(
    id: string,
    status: Submission["status"],
    useAdmin = false
  ): Promise<Submission> {
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

    if (error) {
      throw new Error(`Failed to update submission status: ${error.message}`);
    }
    return data;
  }

  async update(
    id: string,
    updates: TablesUpdate<"submissions">,
    useAdmin = false
  ): Promise<Submission> {
    const client = useAdmin ? createAdminClient() : await createClient();
    const { data, error } = await client
      .from("submissions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update submission: ${error.message}`);
    }
    return data;
  }
}

export const submissionRepository = new SubmissionRepository();
