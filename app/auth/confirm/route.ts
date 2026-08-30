import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabase-server";

// Where the confirmation link in the email lands.
//
// Two link shapes reach here, and both are supported on purpose:
//
//   ?token_hash=…&type=signup   the template points straight at us. Works from
//                               any device, because the token in the URL is the
//                               whole proof.
//   ?code=…                     Supabase's stock {{ .ConfirmationURL }}, which
//                               verifies on their side and hands back a PKCE
//                               code. Only works in the browser that signed up,
//                               since the matching verifier sits in a cookie
//                               there — open that link on your phone after
//                               signing up on a laptop and it fails.
//
// token_hash is the one we want customers on; `code` stays as a fallback so a
// link already sitting in someone's inbox does not break.
//
// A Route Handler, not a page, because verifying writes the session cookie and
// only Route Handlers and Server Functions are allowed to set cookies.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createServerSupabase();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) redirect("/welcome");
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/welcome");
  }

  // Expired, already used, or tampered with. The sign-up page explains it in
  // Turkish and offers a fresh email, which is the only useful next step.
  redirect("/signup?error=invalid-link");
}
