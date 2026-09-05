// The bucket's name and its filing rules.
//
// Split out of lib/invoices.ts because that module is server-only — it reads
// files and mints signed URLs — while the upload control needs the same path
// rule in the browser. One definition, two callers.

export const INVOICE_BUCKET = "invoices";

// Filed under the order it belongs to, so the bucket is browsable by a human
// looking for one, and two orders can never collide.
//
// The timestamp sorts them for anyone reading the bucket; the random half is
// what actually guarantees a new name. A timestamp alone is not enough — two
// uploads inside the same millisecond would produce one path, and the second
// fatura would quietly replace the first. Re-issuing an invoice must leave the
// earlier document in place: if she ever has to explain which one went out
// when, both need to still exist.
//
// globalThis.crypto rather than node:crypto: this module is imported by the
// upload control in the browser as well as by the server, and node:crypto does
// not bundle. The Web Crypto API is present in both.
export function invoicePath(code: string, extension = "pdf"): string {
  const unique = globalThis.crypto.randomUUID().slice(0, 8);

  return `${code}/${Date.now()}-${unique}.${extension}`;
}

// What the buyer sees on their download. Their own order code, not the storage
// path, which means nothing to them.
export function invoiceFilename(code: string): string {
  return `${code}-fatura.pdf`;
}
