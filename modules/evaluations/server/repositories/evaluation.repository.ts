import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tables, TablesInsert } from "@/lib/database.types";

export type Evaluation = Tables<"evaluations">;
export type KnowledgeGap = Tables<"knowledge_gaps">;

export class EvaluationRepository {
  async createEvaluation(evalData: TablesInsert<"evaluations">): Promise<Evaluation> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("evaluations")
      .insert(evalData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create evaluation: ${error.message}`);
    }
    return data;
  }

  async findByResponseId(responseId: string): Promise<Evaluation | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("evaluations")
      .select("*")
      .eq("response_id", responseId)
      .single();

    if (error || !data) {
      return null;
    }
    return data;
  }

  async createKnowledgeGaps(gaps: TablesInsert<"knowledge_gaps">[]): Promise<KnowledgeGap[]> {
    if (!gaps.length) return [];
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("knowledge_gaps")
      .insert(gaps)
      .select();

    if (error) {
      throw new Error(`Failed to create knowledge gaps: ${error.message}`);
    }
    return data || [];
  }

  async listKnowledgeGapsByVivaId(vivaId: string, userId: string): Promise<KnowledgeGap[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("knowledge_gaps")
      .select("*")
      .eq("viva_id", vivaId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list knowledge gaps: ${error.message}`);
    }
    return data || [];
  }
}

export const evaluationRepository = new EvaluationRepository();
