import { describe, expect, it } from "vitest";

import { invoiceFilename, invoicePath } from "@/lib/invoices";

describe("where an invoice is filed", () => {
  it("lives under its own order", () => {
    expect(invoicePath("IS-00007")).toMatch(/^IS-00007\/\d+-[0-9a-f]{8}\.pdf$/);
  });

  it("never overwrites an earlier one", () => {
    // Re-issuing a fatura must leave the first document in place: if she has to
    // explain which one went out when, both need to still exist.
    // Generated back to back, so the timestamp halves are almost certainly
    // identical — the random half is what has to do the work.
    const paths = new Set(
      Array.from({ length: 50 }, () => invoicePath("IS-00007"))
    );

    expect(paths.size).toBe(50);
  });

  it("keeps the extension it was given", () => {
    expect(invoicePath("IS-00007", "png")).toMatch(/\.png$/);
  });
});

describe("what the buyer's download is called", () => {
  it("is named after their order, not the storage path", () => {
    expect(invoiceFilename("IS-00007")).toBe("IS-00007-fatura.pdf");
  });
});
