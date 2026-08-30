import type { NextRequest } from "next/server";

import { refreshSession } from "@/lib/supabase-proxy";

// Next 16 renamed `middleware.ts` to `proxy.ts`. Same execution point, same
// behaviour — a file named middleware.ts here would simply never run.
export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  // Everything except static assets and image files. Without a matcher this
  // runs on every CSS file and every product photo, spending a Supabase call
  // on requests that have no session to refresh.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
