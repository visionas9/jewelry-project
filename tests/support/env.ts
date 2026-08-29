import { localSupabaseEnv } from "./local-supabase";

// lib/supabase.ts reads these at module load and throws if they are missing,
// so they have to be set before the test file — and its imports — are loaded.
// Vitest runs setup files first, which is exactly that window.
const env = localSupabaseEnv();

process.env.NEXT_PUBLIC_SUPABASE_URL = env.API_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.ANON_KEY;

// Only the tests get this one, and only ever to create the members a test needs.
// It bypasses every policy, so it must never be used to make an assertion —
// that would prove the policies work by not using them.
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SERVICE_ROLE_KEY;
