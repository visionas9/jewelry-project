import "server-only";

import type { EmailOtpType } from "@supabase/supabase-js";

import { createServerSupabase } from "./supabase-server";

// Turning a link from an email into a session.
//
// Two link shapes reach the routes that call this, and both are supported on
// purpose:
//
//   ?token_hash=…&type=…   the template points straight at us. Works from any
//                          device, because the token in the URL is the whole
//                          proof.
//   ?code=…                Supabase's stock {{ .ConfirmationURL }}, which
//                          verifies on their side and hands back a PKCE code.
//                          Only works in the browser that started the flow,
//                          since the matching verifier sits in a cookie there
//                          — open that link on your phone after asking for the
//                          link on a laptop and it fails.
//
// token_hash is the one we want customers on; `code` stays as a fallback so a
// link already sitting in someone's inbox does not break, and so a hosted
// project still on the stock dashboard template keeps working.
//
// Callers must be Route Handlers or Server Functions: verifying writes the
// session cookie, and nothing else is allowed to set cookies.
export async function verifyEmailLink(url: URL): Promise<boolean> {
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");

  const supabase = await createServerSupabase();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    return !error;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  }

  // Neither shape present: somebody typed the path in, or a mail client
  // mangled the link.
  return false;
}
