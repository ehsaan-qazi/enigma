"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSupabaseData() {
  await createClient();

  // Example: Query data from a table
  // const { data, error } = await supabase.from("your_table").select("*");
  // if (error) throw error;
  // return data;

  return { message: "Supabase client configured successfully" };
}
