/**
 * Server-side Supabase client for Node.js context (Vite middleware)
 * Uses process.env instead of import.meta.env
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { config } from 'dotenv';
import path from 'path';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

// Get environment variables from process.env (Node.js context)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Create Supabase client only if configured
let supabaseServer: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured()) {
  supabaseServer = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
  console.log('✅ Supabase server client initialized');
} else {
  console.warn('⚠️  Supabase not configured for server. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export { supabaseServer };

// Export a function to get the client
export const getSupabaseServerClient = (): SupabaseClient<Database> | null => {
  return supabaseServer;
};
