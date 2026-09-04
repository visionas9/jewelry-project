import { describe, expect, it } from "vitest";

import { wroteNothing } from "@/lib/admin-write";

// The case this exists for: RLS refuses an update, PostgREST reports no error
// and returns no row, and the panel would otherwise say it saved.

describe("deciding whether a write happened", () => {
  it("counts no error and no row as nothing written", () => {
    expect(wroteNothing(null, null)).toBe(true);
    expect(wroteNothing(null, undefined)).toBe(true);
  });

  it("counts a returned row as written", () => {
    expect(wroteNothing(null, { slug: "bir-bileklik" })).toBe(false);
  });

  it("leaves a real error to the caller's own handling", () => {
    // Already an error, so this is not the silent case — the action reports it
    // through its own message rather than through this one.
    expect(wroteNothing({ code: "23505" }, null)).toBe(false);
  });
});
