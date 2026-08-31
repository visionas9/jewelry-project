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
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  return data?.display_name ?? null;
}

// Returns whether it saved. The caller turns that into something Turkish; this
// has no opinion about what the member should be told.
export async function setDisplayName(
  supabase: SupabaseClient,
  userId: string,
  displayName: string | null
): Promise<boolean> {
  // Filtered by id even though the policy already limits this to the member's
  // own row. Belt and braces, and it means a policy edited badly later fails
  // closed here rather than rewriting every profile in the table.
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);

  return error === null;
}
