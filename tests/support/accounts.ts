import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { totpCode } from "./totp";

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

/**
 * Makes a member the administrator, with a second factor already verified.
 *
 * Both halves matter: the row says which account, and the factor is what makes
 * is_admin() true — a session that has only typed a password is deliberately
 * not enough.
 */
export async function makeAdmin(member: Member): Promise<void> {
  const { error } = await adminClient().from("admins").insert({ id: member.id });

  if (error) throw new Error(`Could not grant admin: ${error.message}`);

  const { data: factor, error: enrolError } = await member.client.auth.mfa.enroll({
    factorType: "totp",
  });

  if (enrolError || !factor) {
    throw new Error(`Could not enrol a factor: ${enrolError?.message}`);
  }

  const { error: verifyError } = await member.client.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: totpCode(factor.totp.secret),
  });

  if (verifyError) {
    throw new Error(`Could not verify the factor: ${verifyError.message}`);
  }
}

/**
 * A member nobody else is using.
 *
 * place_order allows one unpaid order per member, so a test that places an
 * order needs a buyer of its own: sharing one across tests makes the second
 * order fail for a reason the test is not about. The address is unique per
 * call, so files running in parallel workers cannot collide.
 */
export function createBuyer(): Promise<Member> {
  return createMember(
    `alici-${randomUUID().slice(0, 8)}@example.com`,
    "cok-gizli-parola-alici"
  );
}
