/**
 * Supabase Client Configuration
 * Database client for Secret Santa Chain
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client-side Supabase client (uses anon key)
// Using untyped client to avoid TypeScript errors when tables don't exist yet
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Server-side Supabase client (uses service role key for admin operations)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey
);

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
