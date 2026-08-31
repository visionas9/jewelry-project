import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabase } from "./supabase-server";

// The guard for pages that belong to one member.
//
// getUser, not getSession: getSession believes whatever the cookie says, and a
// cookie is the one thing an attacker gets to write. getUser asks Supabase to
// verify the token, which is the difference between a guard and a decoration.
//
// This is a second line rather than the only one. Row Level Security already
// stops one member reading another's rows whichever way the request arrives;
// this exists so a signed-out visitor is sent somewhere useful instead of being
// shown a page with nothing on it.
//
// `returnTo` is where they should land once they succeed. Callers pass their
// own path, because a Server Component cannot ask which URL it is being
// rendered for.
//
// The client comes back with the member: it is bound to this request's cookies,
// and building a second one to run the next query would mean a second set of
// cookie reads for the same session.
export async function requireMember(returnTo: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  }

  return { user, supabase };
}
