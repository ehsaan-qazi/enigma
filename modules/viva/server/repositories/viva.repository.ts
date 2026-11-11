import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { localStore, QuestionRow } from "@/lib/supabase/local-store";

export type Viva = Tables<"vivas">;
export type Question = QuestionRow;
export type Response = Tables<"responses">;

export class VivaRepository {
  async findByIdAndUserId(id: string, userId: string): Promise<Viva | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("vivas")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.findVivaById(id);
  }

  async listByUserId(userId: string): Promise<Viva[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("vivas")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.listVivas(userId);
  }

  async findBySubmissionIdAndUserId(
    submissionId: string,
    userId: string
  ): Promise<Viva | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("vivas")
        .select("*")
        .eq("submission_id", submissionId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.findVivaBySubmissionId(submissionId);
  }

  async create(viva: TablesInsert<"vivas">): Promise<Viva> {
    const localViva = localStore.createViva({
      id: viva.id,
      user_id: viva.user_id,
      submission_id: viva.submission_id,
      status: viva.status || "created",
      started_at: viva.started_at,
      completed_at: viva.completed_at,
    });

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("vivas")
        .insert({ ...viva, id: localViva.id })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // Use localViva
    }
    return localViva;
  }

  async updateStatus(
    id: string,
    status: Viva["status"],
    extra?: Partial<TablesUpdate<"vivas">>,
    useAdmin = false
  ): Promise<Viva> {
    const updatedLocal = localStore.updateViva(id, { status, ...extra });

    try {
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

      if (!error && data) {
        return data;
      }
    } catch {
      // Use updatedLocal
    }

    if (!updatedLocal) {
      throw new Error(`Viva ${id} not found`);
    }
    return updatedLocal;
  }

  // --- Questions ---
  async createQuestions(
    questions: Array<TablesInsert<"questions"> & { follow_up_reason?: string }>
  ): Promise<Question[]> {
    const localQuestions = localStore.createQuestions(questions);

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("questions")
        .insert(
          localQuestions.map((q) => ({
            id: q.id,
            viva_id: q.viva_id,
            concept: q.concept,
            question_text: q.question_text,
            question_type: q.question_type,
            difficulty: q.difficulty,
            expected_concepts: q.expected_concepts,
            sequence_number: q.sequence_number,
          }))
        )
        .select();

      if (!error && data) {
        return data.map((row, idx) => ({
          ...row,
          follow_up_reason: localQuestions[idx]?.follow_up_reason,
        }));
      }
    } catch {
      // Use localQuestions
    }
    return localQuestions;
  }

  async listQuestionsByVivaId(vivaId: string): Promise<Question[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("viva_id", vivaId)
        .order("sequence_number", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.listQuestionsByVivaId(vivaId);
  }

  async findQuestionById(questionId: string, vivaId: string): Promise<Question | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", questionId)
        .eq("viva_id", vivaId)
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.findQuestionById(questionId, vivaId);
  }

  // --- Responses ---
  async createResponse(response: TablesInsert<"responses">): Promise<Response> {
    const localResp = localStore.createResponse(response);

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("responses")
        .insert({ ...response, id: localResp.id })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // Use localResp
    }
    return localResp;
  }

  async updateResponseStatus(
    responseId: string,
    status: Response["status"],
    extra?: Partial<TablesUpdate<"responses">>
  ): Promise<Response> {
    const updatedLocal = localStore.updateResponse(responseId, { status, ...extra });

    try {
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

      if (!error && data) {
        return data;
      }
    } catch {
      // Use updatedLocal
    }

    if (!updatedLocal) {
      throw new Error(`Response ${responseId} not found`);
    }
    return updatedLocal;
  }

  async listResponsesByVivaId(vivaId: string): Promise<Response[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("responses")
        .select("*")
        .eq("viva_id", vivaId)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.listResponsesByVivaId(vivaId);
  }
}

export const vivaRepository = new VivaRepository();
