import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesInsert } from "@/lib/database.types";
import { localStore } from "@/lib/supabase/local-store";

export type Evaluation = Tables<"evaluations">;
export type KnowledgeGap = Tables<"knowledge_gaps">;

export class EvaluationRepository {
  async createEvaluation(evalData: TablesInsert<"evaluations">): Promise<Evaluation> {
    const localEval = localStore.createEvaluation(evalData);

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("evaluations")
        .insert({ ...evalData, id: localEval.id })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // Use localEval
    }
    return localEval;
  }

  async findByResponseId(responseId: string): Promise<Evaluation | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("response_id", responseId)
        .single();

      if (!error && data) {
        return data;
      }

      const admin = createAdminClient();
      const { data: adminData, error: adminErr } = await admin
        .from("evaluations")
        .select("*")
        .eq("response_id", responseId)
        .single();

      if (!adminErr && adminData) {
        return adminData;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.findEvaluationByResponseId(responseId);
  }

  async createKnowledgeGaps(gaps: TablesInsert<"knowledge_gaps">[]): Promise<KnowledgeGap[]> {
    if (!gaps.length) return [];
    const localGaps = localStore.createKnowledgeGaps(gaps as Parameters<typeof localStore.createKnowledgeGaps>[0]);

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("knowledge_gaps")
        .insert(localGaps)
        .select();

      if (!error && data) {
        return data;
      }
    } catch {
      // Use localGaps
    }
    return localGaps;
  }

  async listKnowledgeGapsByVivaId(vivaId: string, userId?: string): Promise<KnowledgeGap[]> {
    try {
      const supabase = await createClient();
      let query = supabase.from("knowledge_gaps").select("*").eq("viva_id", vivaId);
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query.order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }

      const admin = createAdminClient();
      const { data: adminData, error: adminErr } = await admin
        .from("knowledge_gaps")
        .select("*")
        .eq("viva_id", vivaId)
        .order("created_at", { ascending: true });

      if (!adminErr && adminData && adminData.length > 0) {
        return adminData;
      }
    } catch {
      // Fallback to localStore
    }
    return localStore.listKnowledgeGapsByVivaId(vivaId);
  }
}

export const evaluationRepository = new EvaluationRepository();
