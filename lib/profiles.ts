import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// Every profile query lives here, the way lib/products.ts owns product queries.
//
// The client is passed in rather than created here on purpose. A profile only
// means anything in the context of a signed-in request, and that session lives
// in the caller's client — a client made here would carry no session and every
// query would come back empty, which the policies would make look like a member
// with no profile rather than like the mistake it is.

type ProfileRow = { display_name: string | null };

export async function getDisplayName(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    // A missing table, a revoked grant, a database that is simply down: all of
    // them arrive here as an error and all of them used to look exactly like a
    // member who had not set a name yet.
    console.error("profiles: could not read display name", error);
  }

  return data?.display_name ?? null;
}

// Why this is three outcomes and not a boolean:
//
// An update that matches no rows is not an error in Postgres. It returns
// cleanly, having done nothing. So a member whose profile row is missing — the
// row the sign-up trigger is supposed to create — got told their name was
// saved, every time, forever.
export type SaveResult = "saved" | "no-profile" | "failed";

export async function setDisplayName(
  supabase: SupabaseClient,
  userId: string,
  displayName: string | null
): Promise<SaveResult> {
  // Filtered by id even though the policy already limits this to the member's
  // own row. Belt and braces, and it means a policy edited badly later fails
  // closed here rather than rewriting every profile in the table.
  //
  // `.select()` is what makes the write answerable: without it Supabase returns
  // nothing at all and there is no way to tell a save from a no-op.
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId)
    .select("id");

  if (error) {
    console.error("profiles: could not save display name", error);
    return "failed";
  }

  return data && data.length > 0 ? "saved" : "no-profile";
}
