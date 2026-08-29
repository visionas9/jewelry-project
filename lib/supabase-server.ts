import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-env";

// The session-aware client for Server Components, Server Actions and Route
// Handlers.
//
// One per request, never shared. It is bound to the cookies of the request that
// created it, so holding on to one across requests would hand one visitor's
// session to the next.
//
// Calling this opts the caller out of static rendering: cookies() is request
// data, which Next cannot know at build time. That is exactly why product
// queries keep using the session-free client in supabase.ts.
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies — the response headers are
          // already on their way out. A refreshed token is written back by the
          // Server Action or Route Handler that owns the mutation instead.
        }
      },
    },
  });
}
