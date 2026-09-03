import { describe, expect, it } from "vitest";

import { CARRIERS, isKnownCarrier } from "@/lib/carriers";

// The carrier is chosen from a list now rather than typed, so the server can
// insist on it being one of ours. A <select> is a suggestion, not a
// constraint — the request behind it is still whatever somebody sends.

describe("the list itself", () => {
  it("holds the firms she actually ships with", () => {
    expect(CARRIERS).toContain("Yurtiçi Kargo");
    expect(CARRIERS).toContain("Aras Kargo");
    expect(CARRIERS).toContain("PTT Kargo");
  });

  it("has no duplicates", () => {
    expect(new Set(CARRIERS).size).toBe(CARRIERS.length);
  });
});

describe("what the server will accept", () => {
  it("accepts a name from the list", () => {
    expect(isKnownCarrier("Yurtiçi Kargo")).toBe(true);
  });

  it("refuses anything else", () => {
    expect(isKnownCarrier("Benim Kargom")).toBe(false);
    expect(isKnownCarrier("")).toBe(false);
    expect(isKnownCarrier("<script>alert(1)</script>")).toBe(false);
  });

  it("refuses a near miss rather than guessing", () => {
    // Not trimmed, not case-folded, not fuzzy-matched. The only way to send a
    // valid carrier is to send exactly one of ours, which is what makes the
    // stored value safe to trust later.
    expect(isKnownCarrier("yurtiçi kargo")).toBe(false);
    expect(isKnownCarrier(" Yurtiçi Kargo ")).toBe(false);
  });
});
