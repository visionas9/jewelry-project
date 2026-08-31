"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import {
  GENERIC_AUTH_ERROR,
  MIN_PASSWORD_LENGTH,
  turkishAuthError,
} from "@/lib/auth-errors";
import { looksLikeEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

export type SignUpState =
  | { status: "idle" }
  // `email` rides along so the "check your inbox" screen can name the address
  // and the resend button knows where to send to, without a hidden input the
  // visitor could edit.
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

export async function signUp(
  _previous: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Re-checked here even though the form marks both fields `required`. The
  // browser's validation is a convenience for the visitor; this action is a
  // public POST endpoint and has to assume the form was never involved.
  if (!looksLikeEmail(email)) {
    return {
      status: "error",
      email,
      message: "Geçerli bir e-posta adresi girin.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      email,
      message: `Şifreniz en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`,
    };
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE.url}/auth/confirm` },
  });

  if (error) {
    return { status: "error", email, message: turkishAuthError(error) };
  }

  // Supabase does not say "that email is taken" — it returns a user-shaped
  // object with an empty `identities` array instead, so an attacker cannot
  // farm the signup form for which addresses exist.
  //
  // The spec asks us to say so plainly anyway, which trades that protection
  // for a visitor who would otherwise wait forever for an email that is never
  // coming. Deliberate, and worth revisiting if the shop ever gets scraped.
  if (data.user && data.user.identities?.length === 0) {
    return {
      status: "error",
      email,
      message:
        "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyebilirsiniz.",
    };
  }

  if (!data.user) {
    return { status: "error", email, message: GENERIC_AUTH_ERROR };
  }

  return { status: "sent", email };
}

export type ResendState = { message: string; ok: boolean } | null;

export async function resendConfirmation(
  email: string,
  _previous: ResendState
): Promise<ResendState> {
  if (!looksLikeEmail(email)) {
    return { ok: false, message: GENERIC_AUTH_ERROR };
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${SITE.url}/auth/confirm` },
  });

  if (error) {
    return { ok: false, message: turkishAuthError(error) };
  }

  return { ok: true, message: "Doğrulama e-postası tekrar gönderildi." };
}
