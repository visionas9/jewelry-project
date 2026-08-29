import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-env";

// The session-aware client for Client Components.
//
// It stores the session in cookies rather than localStorage. That is what lets
// the server read the same session on the next request — a session kept only in
// localStorage is invisible to a server render.
//
// Safe to call from anywhere in the browser: @supabase/ssr returns the same
// instance every time, so components do not need to pass one around.
export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
