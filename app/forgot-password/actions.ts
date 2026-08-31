"use server";

import { turkishAuthError } from "@/lib/auth-errors";
import { looksLikeEmail } from "@/lib/email";
import { AUTH_URL } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase-server";

export type ResetRequestState =
  | { status: "idle" }
  // The address rides along so the "check your inbox" screen can name it
  // without a hidden input the visitor could edit between the two screens.
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

export async function requestPasswordReset(
  _previous: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim();

  // A malformed address is a typo, and saying so reveals nothing — it is not
  // an answer about whether anyone is registered. Everything past this point
  // is deliberately the same for a member and a stranger.
  if (!looksLikeEmail(email)) {
    return {
      status: "error",
      email,
      message: "Geçerli bir e-posta adresi girin.",
    };
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // This is the address the emailed link is built from: the template pastes
    // it in rather than hardcoding the site, which is what lets a preview
    // deployment send links back to itself. Supabase also uses it as the
    // landing spot for its own stock template, so a project whose dashboard
    // template has not been updated still works.
    redirectTo: `${AUTH_URL}/auth/reset`,
  });

  if (error) {
    // Supabase does not fail on an unknown address, so nothing that reaches
    // here is a statement about the address: it is a rate limit, or the mail
    // service being down. Both are worth telling the visitor about.
    return { status: "error", email, message: turkishAuthError(error) };
  }

  // Said the same way whether an account exists or not. The alternative —
  // "we don't know that address" — turns this form into a way to ask which of
  // someone's customers shop here, one address at a time.
  return { status: "sent", email };
}
