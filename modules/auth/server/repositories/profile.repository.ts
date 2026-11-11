import { createClient } from "@/lib/supabase/server";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

export type Profile = Tables<"profiles">;

export class ProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }
    return data;
  }

  async create(profile: TablesInsert<"profiles">): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }
    return data;
  }

  async update(id: string, updates: TablesUpdate<"profiles">): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
    return data;
  }
}

export const profileRepository = new ProfileRepository();
