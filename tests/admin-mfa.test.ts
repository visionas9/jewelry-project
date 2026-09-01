import { beforeAll, describe, expect, it } from "vitest";

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
