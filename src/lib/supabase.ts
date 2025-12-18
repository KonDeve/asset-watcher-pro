import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Create Supabase client only if configured
let supabase: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured()) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Keep users signed in across reloads/laptop restarts via localStorage-backed refresh tokens
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export { supabase };

// Export a function to get the client (useful for checking)
export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  return supabase;
};
