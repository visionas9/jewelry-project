"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MIN_PASSWORD_LENGTH, turkishAuthError } from "@/lib/auth-errors";
import { createServerSupabase } from "@/lib/supabase-server";

export type NewPasswordState = { message: string } | null;

export async function setNewPassword(
  _previous: NewPasswordState,
  formData: FormData
): Promise<NewPasswordState> {
  const password = String(formData.get("password") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      message: `Şifreniz en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`,
    };
  }

  const supabase = await createServerSupabase();

  // Re-established here rather than trusted from the page that rendered the
  // form. A Server Action is a public POST endpoint: reaching it does not mean
  // anyone clicked a reset link, and this one changes a password.
  //
  // getUser, not getSession: getSession believes whatever the cookie says, and
  // the cookie is the one thing an attacker gets to write.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session means the link never verified, or it expired while this form
  // sat open. Either way the answer is a fresh link, not an error message on a
  // form that cannot succeed.
  if (!user) redirect("/forgot-password?error=invalid-link");

  // Nothing identifying the account travels in the form. The password written
  // is the one belonging to the verified session and there is no id here to
  // tamper with.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { message: turkishAuthError(error) };
  }

  // The session cookie has been reissued, so anything rendered for the old one
  // is stale.
  revalidatePath("/", "layout");

  // Signed in already — verifying the link was the sign-in. /account says so
  // and gives them somewhere to be.
  redirect("/account?reset=ok");
}
