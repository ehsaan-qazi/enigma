import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

export type Viva = Tables<"vivas">;
export type Question = Tables<"questions">;
export type Response = Tables<"responses">;

export class VivaRepository {
  async findByIdAndUserId(id: string, userId: string): Promise<Viva | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vivas")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }
    return data;
  }

  async listByUserId(userId: string): Promise<Viva[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vivas")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list vivas: ${error.message}`);
    }
    return data || [];
  }

  async findBySubmissionIdAndUserId(
    submissionId: string,
    userId: string
  ): Promise<Viva | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vivas")
      .select("*")
      .eq("submission_id", submissionId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data;
  }

  async create(viva: TablesInsert<"vivas">): Promise<Viva> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vivas")
      .insert(viva)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create viva session: ${error.message}`);
    }
    return data;
  }

  async updateStatus(
    id: string,
    status: Viva["status"],
    extra?: Partial<TablesUpdate<"vivas">>,
    useAdmin = false
  ): Promise<Viva> {
    const client = useAdmin ? createAdminClient() : await createClient();
    const { data, error } = await client
      .from("vivas")
      .update({
        status,
        ...extra,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update viva status: ${error.message}`);
    }
    return data;
  }

  // --- Questions ---
  async createQuestions(questions: TablesInsert<"questions">[]): Promise<Question[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("questions")
      .insert(questions)
      .select();

    if (error) {
      throw new Error(`Failed to insert questions: ${error.message}`);
    }
    return data || [];
  }

  async listQuestionsByVivaId(vivaId: string): Promise<Question[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("viva_id", vivaId)
      .order("sequence_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to list questions: ${error.message}`);
    }
    return data || [];
  }

  async findQuestionById(questionId: string, vivaId: string): Promise<Question | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .eq("viva_id", vivaId)
      .single();

    if (error || !data) {
      return null;
    }
    return data;
  }

  // --- Responses ---
  async createResponse(response: TablesInsert<"responses">): Promise<Response> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("responses")
      .insert(response)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create response: ${error.message}`);
    }
    return data;
  }

  async updateResponseStatus(
    responseId: string,
    status: Response["status"],
    extra?: Partial<TablesUpdate<"responses">>
  ): Promise<Response> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("responses")
      .update({
        status,
        ...extra,
      })
      .eq("id", responseId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update response: ${error.message}`);
    }
    return data;
  }

  async listResponsesByVivaId(vivaId: string): Promise<Response[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("responses")
      .select("*")
      .eq("viva_id", vivaId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list responses: ${error.message}`);
    }
    return data || [];
  }
}

export const vivaRepository = new VivaRepository();
