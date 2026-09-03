import "server-only";

import { notFound, redirect } from "next/navigation";

import { createServerSupabase } from "./supabase-server";

// The panel's own check, on top of the proxy's. A page that is reached some way
// the proxy did not expect must still refuse, and the policies refuse anything
// that gets past both.
//
// notFound rather than a redirect or a message: nothing here confirms that
// there is an administrator, or that this path means anything.

async function ask(question: "is_admin" | "is_admin_account") {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc(question);

  if (data !== true) notFound();

  return supabase;
}

// Full admin: the account, and a session that passed a second factor.
export function requireAdmin() {
  return ask("is_admin");
}

// The account alone. Only for the page where a factor is enrolled — reaching
// it with a password is the point.
export function requireAdminAccount() {
  return ask("is_admin_account");
}

// The full guard for a panel page that reads or moves orders: the account, then
// the second factor. A non-administrator was already turned into a 404 by
// requireAdminAccount; the redirect below therefore only ever reaches the
// administrator's own session, sending her to enrol or confirm a factor rather
// than showing her a 404 of her own panel. Everything past this point is aal2,
// which is what the order policies and functions demand anyway.
export async function requireVerifiedAdmin() {
  const supabase = await requireAdminAccount();

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assurance?.currentLevel !== "aal2") {
    redirect("/admin/security");
  }

  return supabase;
}
