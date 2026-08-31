import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { createMember, type Member } from "./support/accounts";

// Two real members against the real policies. Every assertion below goes
// through a client holding the public anon key — the same key a browser has —
// so nothing here is proved by privilege the application would not have.

let ayse: Member;
let mehmet: Member;

beforeAll(async () => {
  ayse = await createMember("ayse@example.com", "cok-gizli-parola-1");
  mehmet = await createMember("mehmet@example.com", "cok-gizli-parola-2");
});

describe("a profile row for every account", () => {
  it("appears on its own when the account is created", async () => {
    const { data, error } = await ayse.client
      .from("profiles")
      .select("id, display_name, created_at")
      .eq("id", ayse.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(ayse.id);
    // Nothing has set one yet — the display name is the member's to fill in.
    expect(data?.display_name).toBeNull();
  });

  it("lets a member set their own display name", async () => {
    const { error } = await ayse.client
      .from("profiles")
      .update({ display_name: "Ayşe" })
      .eq("id", ayse.id);

    expect(error).toBeNull();

    const { data } = await ayse.client
      .from("profiles")
      .select("display_name")
      .eq("id", ayse.id)
      .maybeSingle();

    expect(data?.display_name).toBe("Ayşe");
  });
});

describe("one member cannot reach another", () => {
  it("hides another member's profile from a read", async () => {
    const { data, error } = await ayse.client
      .from("profiles")
      .select("id, display_name")
      .eq("id", mehmet.id);

    // Not an error — the row is simply not there as far as Ayşe is concerned.
    // That is what the policy does: it narrows what the query can see rather
    // than refusing the query.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("returns nothing when a member asks for every profile", async () => {
    const { data } = await ayse.client.from("profiles").select("id");

    // No filter at all, and still only her own row.
    expect(data?.map((row) => row.id)).toEqual([ayse.id]);
  });

  it("refuses an update to another member's profile", async () => {
    await ayse.client
      .from("profiles")
      .update({ display_name: "çalındı" })
      .eq("id", mehmet.id);

    const { data } = await mehmet.client
      .from("profiles")
      .select("display_name")
      .eq("id", mehmet.id)
      .maybeSingle();

    expect(data?.display_name).toBeNull();
  });

  it("shows a signed-out visitor nothing at all", async () => {
    const { error } = await anonymous.from("profiles").select("id");

    // anon is granted nothing on this table, so it is stopped a layer earlier
    // than the policies — at the table itself.
    //
    // This assertion passes locally whether or not the grant is right, which is
    // how the hosted project came to differ: Supabase's default privileges on
    // the public schema had handed anon select on profiles, and a signed-out
    // read there came back empty instead of refused. 0004 revokes it. Nothing
    // reachable from this suite can catch that drift — only a query against the
    // real project can, which is why the check lives in the PR notes too.
    expect(error?.code).toBe("42501");
  });
});

describe("nothing a member can write grants them anything", () => {
  it("refuses to let a member rewrite their row's owner", async () => {
    const { error } = await ayse.client
      .from("profiles")
      .update({ id: mehmet.id })
      .eq("id", ayse.id);

    // display_name is the only column granted for update, so this never even
    // reaches a policy.
    expect(error).not.toBeNull();
  });

  it("has no column that could carry a role", async () => {
    const { data } = await ayse.client
      .from("profiles")
      .select("*")
      .eq("id", ayse.id)
      .maybeSingle();

    // If someone later adds a role or is_admin column to this table, this fails
    // — which is the point. Privileges do not belong on a row its owner writes.
    expect(Object.keys(data ?? {}).sort()).toEqual([
      "created_at",
      "display_name",
      "id",
    ]);
  });
});
