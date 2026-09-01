import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/lib/supabase-proxy";

// Next 16 renamed `middleware.ts` to `proxy.ts`. Same execution point, same
// behaviour — a file named middleware.ts here would simply never run.
// Pages that belong to one member. Each guards itself as well — this list only
// decides where a signed-out visitor is sent, not what they may see.
const MEMBERS_ONLY = ["/account", "/checkout", "/orders"];

export async function proxy(request: NextRequest) {
  const rescued = strayAuthLink(request);

  if (rescued) return NextResponse.redirect(rescued);

  const { response, user } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  // Sent away before the page renders. The guard inside the page would do it
  // too, but only after its shell had already painted — long enough to show a
  // checkout page to somebody who is about to be asked to sign in.
  if (!user && MEMBERS_ONLY.some((path) => pathname.startsWith(path))) {
    const signin = new URL("/signin", request.url);
    signin.searchParams.set("next", pathname);

    return NextResponse.redirect(signin);
  }

  return response;
}

// A verification link that arrived at the site root instead of its route.
//
// The auth emails build their link from the address the app asks Supabase to
// send people back to. Supabase only honours that address if it is on the
// project's redirect allow list; when it is not, it silently substitutes the
// project's Site URL — which is the bare host, with no path. The link still
// carries its token, but it points at the home page, which does nothing with
// it.
//
// That is a one-line fix in the Supabase dashboard, and this is what keeps a
// missing entry from costing anyone their account in the meantime. It only
// ever fires on the home page, and only for a request already carrying a
// token, so an ordinary visit never reaches it.
function strayAuthLink(request: NextRequest): URL | null {
  const url = new URL(request.url);

  if (url.pathname !== "/") return null;

  const type = url.searchParams.get("type");

  if (!url.searchParams.get("token_hash") || !type) return null;

  // Forwarded whole, query and all: the token is the part that matters and the
  // route on the other end reads it from exactly where it already is.
  url.pathname = type === "recovery" ? "/auth/reset" : "/auth/confirm";

  return url;
}

export const config = {
  // Everything except static assets and image files. Without a matcher this
  // runs on every CSS file and every product photo, spending a Supabase call
  // on requests that have no session to refresh.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
