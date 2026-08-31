import { describe, expect, it } from "vitest";

import {
  MAX_DISPLAY_NAME_LENGTH,
  normalizeDisplayName,
} from "@/lib/display-name";

describe("names that go through", () => {
  it("keeps an ordinary name", () => {
    expect(normalizeDisplayName("Ayşe Y.")).toEqual({
      ok: true,
      value: "Ayşe Y.",
    });
  });

  it("trims the edges and collapses runs of whitespace", () => {
    // Two names that look identical on screen must not be two different values
    // in the database.
    expect(normalizeDisplayName("  Ayşe   Y.  ")).toEqual({
      ok: true,
      value: "Ayşe Y.",
    });
    expect(normalizeDisplayName("Ayşe\tY.")).toEqual({
      ok: true,
      value: "Ayşe Y.",
    });
  });

  it("accepts a name exactly at the limit", () => {
    const name = "a".repeat(MAX_DISPLAY_NAME_LENGTH);
    expect(normalizeDisplayName(name)).toEqual({ ok: true, value: name });
  });

  it("counts an emoji as one character, not two", () => {
    // "🌿" is a single code point but two UTF-16 units. Charging someone twice
    // for one thing they typed would put this over the limit.
    const name = "🌿".repeat(MAX_DISPLAY_NAME_LENGTH);
    expect(normalizeDisplayName(name).ok).toBe(true);
  });
});

describe("clearing the name", () => {
  it.each(["", "   ", "\t\n"])("treats %j as removing it", (value) => {
    // Not an error: a member is allowed to go back to being unnamed, which is
    // where every account starts.
    expect(normalizeDisplayName(value)).toEqual({ ok: true, value: null });
  });
});

describe("names that are refused", () => {
  it("refuses a single character", () => {
    expect(normalizeDisplayName("A").ok).toBe(false);
  });

  it("refuses one character past the limit", () => {
    expect(normalizeDisplayName("a".repeat(MAX_DISPLAY_NAME_LENGTH + 1)).ok).toBe(
      false
    );
  });

  it("refuses an email address", () => {
    // The field exists so a member's inbox never appears beside their words.
    // Typing it in here anyway would undo the whole point.
    expect(normalizeDisplayName("ayse@example.com").ok).toBe(false);
  });

  // Written as escapes on purpose: these characters are invisible, so spelling
  // them out is the only way this stays readable and stays what it says it is.
  it.each([
    ["zero-width space", "Ay\u200b\u015fe"],
    ["right-to-left override", "Ay\u202e\u015fe"],
    ["control character", "Ay\u0007\u015fe"],
  ])("refuses a name containing a %s", (_label, value) => {
    // Invisible on screen and very much there: these let one member's name
    // imitate another's, or reverse the text printed around it.
    expect(normalizeDisplayName(value).ok).toBe(false);
  });

  it("neutralises a byte order mark instead of refusing it", () => {
    // \ufeff counts as whitespace in JavaScript, so it is collapsed with the
    // rest before any of the checks below run. The hidden character is gone
    // either way, which is what actually mattered.
    expect(normalizeDisplayName("Ay\ufeff\u015fe")).toEqual({
      ok: true,
      value: "Ay \u015fe",
    });
  });

  it("refuses anything that is not a string", () => {
    expect(normalizeDisplayName(null).ok).toBe(false);
    expect(normalizeDisplayName(undefined).ok).toBe(false);
    expect(normalizeDisplayName(42).ok).toBe(false);
  });
});
