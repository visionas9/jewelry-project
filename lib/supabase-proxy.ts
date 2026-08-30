import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-env";

// Session refresh, in one place.
//
// Access tokens expire in an hour. Without this, a member who leaves a tab open
// over lunch comes back signed out — the refresh token in their cookie is still
// perfectly good, but nothing ever spends it. Doing it here means every route
// gets a fresh session without a single page having to think about expiry.
//
// Refresh only. No redirects, no route guarding, no "is this person allowed"
// — that lives in RLS, where the database enforces it whether the request came
// through a page, a Server Action, or a raw fetch with the anon key.
export async function refreshSession(request: NextRequest) {
  // Cookies have to land in two places. The request copy is what the page we
  // are about to render will read; the response copy is what the browser
  // stores for next time. Writing only one of them refreshes the session for
  // exactly one of those two readers, which is the classic way to end up with
  // a page that renders signed-out and a browser that thinks it is signed in.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // The call itself is the point: getUser verifies the token with Supabase and
  // refreshes it when it has expired, which is what triggers setAll above. The
  // returned user is discarded on purpose — deciding anything with it here
  // would be the authorization this deliberately does not do.
  await supabase.auth.getUser();

  return response;
}
