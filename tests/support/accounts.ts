import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Helpers for tests that need real signed-in members.
//
// Two kinds of client appear here and the difference matters. The admin client
// holds the service role key and ignores every policy — it exists only to set
// up members. Member clients hold the same public anon key a browser has, so a
// query through one is subject to exactly the rules a real visitor would face.

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — see tests/support/env.ts`);
  }
  return value;
}

// Setup only. Never assert through this: it bypasses the policies under test.
export function adminClient(): SupabaseClient {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type Member = {
  id: string;
  email: string;
  /** Signed in, carrying the public anon key. Subject to RLS. */
  client: SupabaseClient;
};

/**
 * Creates a confirmed member and returns them signed in.
 *
 * Confirmed on creation because email delivery is a separate concern; a member
 * stuck waiting for a verification mail cannot sign in, and this test has no
 * opinion about that half of the flow.
 */
export async function createMember(
  email: string,
  password: string
): Promise<Member> {
  const admin = adminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Could not create ${email}: ${error?.message}`);
  }

  const client = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const signIn = await client.auth.signInWithPassword({ email, password });

  if (signIn.error) {
    throw new Error(`Could not sign in ${email}: ${signIn.error.message}`);
  }

  return { id: data.user.id, email, client };
}
