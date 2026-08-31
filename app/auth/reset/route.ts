import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { verifyEmailLink } from "@/lib/auth-link";

// Where the link in the password reset email lands.
//
// Its own route rather than a branch inside /auth/confirm, because the two
// links mean different things once they have been verified: one says "this
// address is really yours", the other says "let this person set a new
// password". Keeping them apart means neither route has to guess which kind of
// link it was handed, including on the `code` shape, which carries no type at
// all.
//
// Verifying signs the visitor in. That is the whole mechanism: /reset-password
// asks for nothing but the new password, because the link is what proved who
// they are.
export async function GET(request: NextRequest) {
  if (await verifyEmailLink(new URL(request.url))) {
    redirect("/reset-password");
  }

  // Expired, already used, or tampered with. /forgot-password says so in
  // Turkish and offers a fresh link.
  redirect("/forgot-password?error=invalid-link");
}
