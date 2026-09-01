import "server-only";

import { notFound } from "next/navigation";

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
