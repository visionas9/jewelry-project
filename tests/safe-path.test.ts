import { describe, expect, it } from "vitest";

import { safeInternalPath } from "@/lib/safe-path";

// The value this guards arrives in a query string, so every case below is one
// an attacker gets to choose. The question each answers is the same: could this
// send someone who signed in on ishindenshinstore.com somewhere that is not
// ishindenshinstore.com?

describe("paths that belong to this site", () => {
  it("keeps a plain path", () => {
    expect(safeInternalPath("/account")).toBe("/account");
  });

  it("keeps a nested path with a query string of its own", () => {
    expect(safeInternalPath("/products?stone=lapis")).toBe(
      "/products?stone=lapis"
    );
  });
});

describe("anything that could leave the site", () => {
  it.each([
    // The obvious one.
    "https://evil.example",
    "http://evil.example",
    // Protocol-relative: reads as relative, resolves to a different host.
    "//evil.example",
    "//evil.example/signin",
    // Backslashes, which some browsers normalise into the case above.
    "/\\evil.example",
    "\\\\evil.example",
    // Schemes that never point at a page at all.
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    // Not a path.
    "account",
    "",
  ])("refuses %j", (value) => {
    expect(safeInternalPath(value)).toBeNull();
  });

  it("refuses a control character that could cut a header short", () => {
    expect(safeInternalPath("/account\r\nLocation: https://evil.example")).toBe(
      null
    );
  });

  it("refuses anything that is not a string", () => {
    // FormData.get returns a File for a file input, and null when the field is
    // simply absent — both reach this function as-is.
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
    expect(safeInternalPath(42)).toBeNull();
    expect(safeInternalPath(["/account"])).toBeNull();
  });
});
