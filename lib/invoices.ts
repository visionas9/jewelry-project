import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Attachment } from "./send-email";

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
export function invoicePath(code: string, extension = "pdf"): string {
  return `${code}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
}

// What the buyer sees on their download. Their own order code, not the storage
// path, which means nothing to them.
export function invoiceFilename(code: string): string {
  return `${code}-fatura.pdf`;
}

/**
 * The fatura as an email attachment, or null.
 *
 * Null on every failure rather than throwing: this runs after an order has
 * already moved, and a buyer being told their payment arrived matters more than
 * the PDF riding along. She can send the invoice on its own afterwards.
 */
export async function invoiceAttachment(
  supabase: SupabaseClient,
  code: string,
  path: string | null
): Promise<Attachment | null> {
  if (!path) return null;

  try {
    const { data, error } = await supabase.storage
      .from(INVOICE_BUCKET)
      .download(path);

    if (error || !data) return null;

    const bytes = Buffer.from(await data.arrayBuffer());

    return { filename: invoiceFilename(code), content: bytes.toString("base64") };
  } catch {
    return null;
  }
}

/**
 * A link the buyer can use, good for a few minutes.
 *
 * Minted per request rather than stored: a URL that lives in the database is a
 * URL that outlives the reason it was created.
 */
export async function invoiceDownloadUrl(
  supabase: SupabaseClient,
  code: string,
  path: string | null
): Promise<string | null> {
  if (!path) return null;

  const { data } = await supabase.storage
    .from(INVOICE_BUCKET)
    .createSignedUrl(path, 300, { download: invoiceFilename(code) });

  return data?.signedUrl ?? null;
}
