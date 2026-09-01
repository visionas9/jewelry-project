import { beforeAll, describe, expect, it } from "vitest";

import { createClient } from "@supabase/supabase-js";

import { adminClient, createMember, type Member } from "./support/accounts";
import { totpCode } from "./support/totp";

// A password alone must not be enough to read the shop's orders. These check
// the claim the database actually relies on: aal2, which Supabase only adds
// once a second factor has been verified.

let alp: Member;

beforeAll(async () => {
  alp = await createMember("mfa-yonetici@example.com", "cok-gizli-parola-1");

  const { error } = await adminClient().from("admins").insert({ id: alp.id });
  if (error) throw new Error(`Could not grant admin: ${error.message}`);
});

describe("an administrator who has only typed a password", () => {
  it("is on the admins list", async () => {
    const { data } = await alp.client.rpc("is_admin_account");

    expect(data).toBe(true);
  });

  it("is not yet treated as the administrator", async () => {
    // The account is right; the session is not strong enough. This is what
    // makes a stolen password worthless on its own.
    const { data } = await alp.client.rpc("is_admin");

    expect(data).toBe(false);
  });

  it("reads no orders but their own", async () => {
    const { data } = await alp.client.from("orders").select("id");

    expect(data).toEqual([]);
  });
});

describe("once a second factor is verified", () => {
  it("is treated as the administrator", async () => {
    const { data: factor, error: enrolError } = await alp.client.auth.mfa.enroll({
      factorType: "totp",
    });

    expect(enrolError).toBeNull();

    const { error: verifyError } = await alp.client.auth.mfa.challengeAndVerify({
      factorId: factor!.id,
      code: totpCode(factor!.totp.secret),
    });

    expect(verifyError).toBeNull();

    const { data } = await alp.client.rpc("is_admin");

    expect(data).toBe(true);
  });
});

describe("an enrolment that was started and abandoned", () => {
  it("does not block the next one", async () => {
    const name = "Eski cihaz";

    const abandoned = await alp.client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: name,
    });

    expect(abandoned.error).toBeNull();

    // Supabase refuses a second factor with a name already in use, verified or
    // not — so an enrolment somebody walked away from would block every later
    // attempt. The panel clears unverified factors before enrolling, and gives
    // each new one a name of its own; this is the rule that makes both
    // necessary.
    const blocked = await alp.client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: name,
    });

    expect(blocked.error).not.toBeNull();

    await alp.client.auth.mfa.unenroll({ factorId: abandoned.data!.id });

    const { error } = await alp.client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: name,
    });

    expect(error).toBeNull();
  });
});

describe("somebody who has only the password", () => {
  it("cannot enrol their own device, or remove the real one", async () => {
    // The enrolment page is reachable with a password alone — it has to be, or
    // a lost phone locks the administrator out of the page that fixes it. What
    // stops that being a way in is Supabase itself: once a factor is verified,
    // touching the factors needs aal2, which is what the password does not buy.
    const withPasswordOnly = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await withPasswordOnly.auth.signInWithPassword({
      email: "mfa-yonetici@example.com",
      password: "cok-gizli-parola-1",
    });

    const { data: level } =
      await withPasswordOnly.auth.mfa.getAuthenticatorAssuranceLevel();

    expect(level?.currentLevel).toBe("aal1");

    const enrolled = await withPasswordOnly.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Başkasının cihazı",
    });

    expect(enrolled.error?.message).toContain("AAL2 required");

    const { data: factors } = await withPasswordOnly.auth.mfa.listFactors();
    const verified = factors?.all?.find((factor) => factor.status === "verified");

    const removed = await withPasswordOnly.auth.mfa.unenroll({
      factorId: verified!.id,
    });

    expect(removed.error?.message).toContain("AAL2 required");

    const { data: isAdmin } = await withPasswordOnly.rpc("is_admin");

    expect(isAdmin).toBe(false);
  });
});
