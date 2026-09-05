import { describe, expect, it } from "vitest";

import { findLegalDocument, LEGAL_DOCUMENTS, legalHref } from "@/lib/legal";

// The footer and /legal/[slug] both build themselves from this one list, so
// what these check is that the list can't quietly produce a link to a 404.

describe("the legal documents", () => {
  it("gives every document a slug that can sit in a URL", () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("uses each slug once", () => {
    const slugs = LEGAL_DOCUMENTS.map((document) => document.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves every link the footer renders", () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(findLegalDocument(document.slug)).toBe(document);
      expect(legalHref(document.slug)).toBe(`/legal/${document.slug}`);
    }
  });

  it("has nothing to render for an unknown slug", () => {
    expect(findLegalDocument("kvkk")).toBeUndefined();
    expect(findLegalDocument("")).toBeUndefined();
  });

  it("gives every section something to show", () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.sections.length).toBeGreaterThan(0);

      for (const section of document.sections) {
        expect(section.heading).not.toBe("");
        expect(section.body.length).toBeGreaterThan(0);
      }
    }
  });
});
