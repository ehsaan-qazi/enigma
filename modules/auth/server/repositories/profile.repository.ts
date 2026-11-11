import { createClient } from "@/lib/supabase/server";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { localStore } from "@/lib/supabase/local-store";

export type Profile = Tables<"profiles">;

export class ProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to local store
    }
    return localStore.findProfileById(id);
  }

  async create(profile: TablesInsert<"profiles">): Promise<Profile> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("profiles")
        .insert(profile)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to local store
    }
    return localStore.upsertProfile({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      institution: profile.institution,
      role: profile.role,
    });
  }

  async update(id: string, updates: TablesUpdate<"profiles">): Promise<Profile> {
    try {
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

      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback to local store
    }
    return localStore.upsertProfile({ id, ...updates });
  }
}

export const profileRepository = new ProfileRepository();
