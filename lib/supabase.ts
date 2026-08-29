import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-env";

// The anonymous client. It carries no session and reads no cookies, and that is
// the point: product queries run through it, and a client that touched cookies
// would turn every product page from a cached, shared render into a per-visitor
// one. Keep it that way.
//
// Anything that needs to know who is signed in belongs in supabase-browser.ts
// or supabase-server.ts instead.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
