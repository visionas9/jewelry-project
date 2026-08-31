import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { verifyEmailLink } from "@/lib/auth-link";

// Where the confirmation link in the sign-up email lands. The link shapes it
// accepts, and why there are two of them, are explained in lib/auth-link.ts.
//
// A Route Handler, not a page, because verifying writes the session cookie and
// only Route Handlers and Server Functions are allowed to set cookies.
export async function GET(request: NextRequest) {
  if (await verifyEmailLink(new URL(request.url))) {
    redirect("/welcome");
  }

  // Expired, already used, or tampered with. The sign-up page explains it in
  // Turkish and offers a fresh email, which is the only useful next step.
  redirect("/signup?error=invalid-link");
}
