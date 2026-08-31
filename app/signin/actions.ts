"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabase } from "@/lib/supabase-server";
import { turkishAuthError } from "@/lib/auth-errors";
import { safeInternalPath } from "@/lib/safe-path";

export type SignInState = { message: string; email: string } | null;

export async function signIn(
  _previous: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Checked here even though the page checked it before rendering the field.
  // This action is a public POST endpoint: the form it trusts is one anybody
  // can rebuild by hand, with any `next` they like.
  const next = safeInternalPath(formData.get("next")) ?? "/";

  // No shape validation and no "please fill this in" branch. Every wrong
  // input — empty, malformed, wrong password, no such account — has to come
  // back as the same sentence, or the differences between them tell an
  // attacker which addresses are real.
  if (email === "" || password === "") {
    return { message: "E-posta veya şifre hatalı.", email };
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: turkishAuthError(error), email };
  }

  // The session cookie has changed, so anything already rendered for a
  // signed-out visitor is stale. Clearing the whole layout is heavy-handed but
  // correct: signing in can change what any page shows.
  revalidatePath("/", "layout");

  // Back to whatever they were trying to reach, or the home page for anyone
  // who simply came to sign in.
  redirect(next);
}
