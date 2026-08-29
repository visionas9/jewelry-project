import { localSupabaseEnv } from "./local-supabase";

// lib/supabase.ts reads these at module load and throws if they are missing,
// so they have to be set before the test file — and its imports — are loaded.
// Vitest runs setup files first, which is exactly that window.
const env = localSupabaseEnv();

process.env.NEXT_PUBLIC_SUPABASE_URL = env.API_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.ANON_KEY;
