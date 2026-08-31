import { describe, expect, it } from "vitest";

import { looksLikeEmail } from "@/lib/email";

// A deliberately loose check: it exists to catch a slip of the finger, not to
// decide which addresses are real. The tests below draw that line — obvious
// typos are rejected, and anything that could plausibly be someone's address
// gets through to Supabase.

describe("the email shape check", () => {
  it("accepts an ordinary address", () => {
    expect(looksLikeEmail("ayse@example.com")).toBe(true);
  });

  it("accepts a subdomain and a plus tag", () => {
    expect(looksLikeEmail("ayse+kayit@mail.example.com.tr")).toBe(true);
  });

  it("rejects an address with no @", () => {
    expect(looksLikeEmail("ayse.example.com")).toBe(false);
  });

  it("rejects an address with no domain dot", () => {
    expect(looksLikeEmail("ayse@example")).toBe(false);
  });

  it("rejects a bare domain", () => {
    expect(looksLikeEmail("@example.com")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(looksLikeEmail("")).toBe(false);
  });

  it("rejects an address with a space in it", () => {
    // The likeliest real-world version of this is a trailing space from a
    // paste, which the actions trim before they get here.
    expect(looksLikeEmail("ayse @example.com")).toBe(false);
  });
});
